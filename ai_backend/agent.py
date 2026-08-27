import os
import json
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langgraph.prebuilt import create_react_agent
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.tools import tool
from database import query_history_rag, fetch_warranty_status

# RAG tools connected to Supabase pgvector
@tool
async def query_vehicle_history(query: str, vehicle_id: str) -> str:
    """Searches the vehicle's historical service records, receipts, and inspections."""
    return await query_history_rag(query, vehicle_id)

@tool
async def check_warranty_status(part_name: str, vehicle_id: str) -> str:
    """Checks if a specific part is covered under warranty based on past service invoices."""
    return await fetch_warranty_status(part_name, vehicle_id)

async def run_agent(query: str, history: list[dict], vehicle_context: str):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {"response": "Error: GROQ_API_KEY not found.", "suggestions": []}

    try:
        model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        llm = ChatGroq(
            api_key=api_key,
            model=model_name,
            temperature=0.3
        )
        
        system_prompt = f"""You are the Autognosis AI, a persistent intelligent vehicle brain.
        
        **VEHICLE CONTEXT:**
        {vehicle_context}
        
        **PERSONA:**
        - Professional, precise, and evidence-based, but friendly and accessible.
        - You act as the central reasoning layer for this vehicle.
        - NEVER expose your underlying architecture, tools, LLM model, or RAG details to the user.
        - Ground your responses in retrieved evidence (service records, warranties). Distinguish between documented facts and inference.
        
        **DIAGNOSTIC & WARRANTY PROCESS:**
        1. **Retrieve History**: If the user asks about past repairs, use `query_vehicle_history`.
        2. **Check Warranty**: If evaluating a part failure, use `check_warranty_status`.
        3. **External Research**: Use `tavily_search_results_json` if you need external or up-to-date information (e.g. standard repair procedures, recall notices, or typical costs).
        
        **OUTPUT:**
        You must output your final response as valid JSON matching this schema:
        {{
            "advice": "Markdown string containing your full response to the user.",
            "suggestions": ["Option A", "Option B", "Option C"],
            "video_link": "URL to a relevant video or null",
            "video_label": "Label for the video or null"
        }}
        """

        # Handle Dynamic Initialization
        if query.strip() == "[SYSTEM_INIT]":
            query = (
                "The user has just opened the dashboard. Introduce yourself briefly, acknowledge the vehicle context, "
                "and ask how you can assist them today. Be welcoming. Output JSON only."
            )
        
        # Agent Tools
        tavily_tool = TavilySearchResults(max_results=3)
        tools = [tavily_tool, query_vehicle_history, check_warranty_status]
        
        # Build Agent Executor
        agent_executor = create_react_agent(llm, tools, prompt=system_prompt)
        
        # Build message history
        messages = []
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "bot":
                messages.append(AIMessage(content=msg["content"]))
                
        messages.append(HumanMessage(content=query))
        
        # Execute Agent
        response = await agent_executor.ainvoke({"messages": messages})
        final_message = response["messages"][-1].content.strip()
        
        # Robust JSON extraction
        import re
        match = re.search(r'\{.*\}', final_message, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        
        # Fallback if no JSON found
        return {
            "advice": final_message,
            "suggestions": ["Tell me more", "Cost estimate?"],
            "video_link": None,
            "video_label": None
        }
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"response": f"Error during agent execution: {str(e)}", "suggestions": []}


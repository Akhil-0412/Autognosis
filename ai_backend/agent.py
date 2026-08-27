import os
import json
from typing import Optional
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langgraph.prebuilt import create_react_agent
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.tools import tool
from database import query_history_rag, fetch_warranty_status


class Diagnosis(BaseModel):
    """Structured diagnostic response returned to the Autognosis dashboard."""

    advice: str = Field(description="Markdown string containing the full response to the user.")
    suggestions: list[str] = Field(
        default_factory=list,
        description="Two to three short follow-up actions the user can tap.",
    )
    video_link: Optional[str] = Field(default=None, description="URL to a relevant video, if any.")
    video_label: Optional[str] = Field(default=None, description="Label for the video, if any.")


# RAG tools connected to Neon pgvector
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
        model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
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
        Write your answer to the user as Markdown, and offer two or three short
        follow-up actions they can take next. Do not wrap your answer in JSON and
        do not invent a tool to format it - the response is structured for you.
        """

        # Handle Dynamic Initialization
        if query.strip() == "[SYSTEM_INIT]":
            query = (
                "The user has just opened the dashboard. Introduce yourself briefly, acknowledge the vehicle context, "
                "and ask how you can assist them today. Be welcoming."
            )

        # Agent Tools
        tavily_tool = TavilySearchResults(max_results=3)
        tools = [tavily_tool, query_vehicle_history, check_warranty_status]

        # Build message history
        messages = []
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "bot":
                messages.append(AIMessage(content=msg["content"]))

        messages.append(HumanMessage(content=query))

        # Preferred path: let LangGraph coerce the final turn into the schema.
        # Asking the model to hand-write JSON makes tool-calling models (notably
        # gpt-oss) invent a bogus `json` tool, which Groq rejects outright.
        final_message = ""
        try:
            agent_executor = create_react_agent(
                llm, tools, prompt=system_prompt, response_format=Diagnosis
            )
            response = await agent_executor.ainvoke({"messages": messages})

            structured = response.get("structured_response")
            if isinstance(structured, Diagnosis):
                return structured.model_dump()

            final_message = response["messages"][-1].content.strip()
        except Exception as structured_err:
            print(f"Structured output unavailable, falling back to plain agent: {structured_err}")
            agent_executor = create_react_agent(llm, tools, prompt=system_prompt)
            response = await agent_executor.ainvoke({"messages": messages})
            final_message = response["messages"][-1].content.strip()

        # The model may still have emitted JSON on its own; accept it if valid.
        import re
        match = re.search(r'\{.*\}', final_message, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group(0))
                if isinstance(parsed, dict) and "advice" in parsed:
                    return parsed
            except json.JSONDecodeError:
                pass

        # Otherwise the prose itself is the advice - never surface an empty reply.
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

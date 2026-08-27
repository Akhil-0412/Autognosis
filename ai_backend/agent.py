import os
import json
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

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
        
        system_prompt = """You are a "Chatty Mechanic Buddy" named **Sparky**. 🛠️
        
        **PERSONA:**
        - Friendly, helpful, and colloquial.
        - Don't sound like a robot. Say "Hey!", "Looks like...", "By the way...".
        - ALWAYS be helpful.
        
        **MEMORY & CONTEXT:**
        1. **Review History**: Don't ask what you already know.
        2. **Facts**: Remember the User's Car (Year/Make/Model).
        
        **DIAGNOSTIC PROCESS:**
        1. **Identify Issue**: Diagnosing a sound? Maintenance?
        2. **Check Facts**: Do we need mileage? Last service?
        3. **Formulate Plan**:
           - If Diagnosing: Ask 1 (ONE) relevant question.
           - If Solving: Give the fix + Cost (INR). **DO NOT** give the video link yet.
           - **CRITICAL STEP**: If a repair is known (e.g., Oil Change), add "Show me a DIY Video" to the `suggestions` list.
        
        **VIDEO LINK LOGIC:**
        - **ONLY** provide `video_link` if the user explicitly asks (e.g., "Show video", "How do I do it?", or clicks "Show me a DIY Video").
        - If asked, generate a Google Search URL: `https://www.google.com/search?q=site:carcarekiosk.com+[Year]+[Make]+[Model]+[Issue]`
        - Otherwise, set `video_link`: null.
        
        **OUTPUT FORMAT (JSON):**
        {
            "advice": "Markdown string. Be chatty! Use bolding for **Costs** and **Parts**.",
            "suggestions": ["Option A", "Option B", ...],
            "video_link": "https://... (OR null)",
            "video_label": "Watch DIY Video on CarCareKiosk (OR null)"
        }
        
        **SUGGESTION LOGIC:**
        - Provide 4-5 diverse options.
        - If a repair is identified, ONE suggestion MUST be "Show me a DIY Video".
        """
        
        # Build Message History
        # 1. System Prompt
        messages = [SystemMessage(content=system_prompt)]
        
        # 2. Add Vehicle Context as a System Message reminder
        messages.append(SystemMessage(content=f"Current Context: {vehicle_context}"))
        
        # 3. Add Conversation History (Deep context)
        for msg in history:  # Process all history sent by frontend
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "bot":
                messages.append(AIMessage(content=msg["content"]))
                
        # 4. Add Latest User Query
        messages.append(HumanMessage(content=query))
        
        # Enforce JSON mode implicitly via the prompt, Llama 3.3 is good at this.
        # Ideally we'd use .with_structured_output() but let's keep it simple for now.
        response = llm.invoke(messages)
        
        # Robust JSON extraction
        content = response.content.strip()
        import re
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            json_str = match.group(0)
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass
        
        # Fallback if no JSON found or parse error
        return {
            "advice": content,
            "suggestions": ["Tell me more", "Cost estimate?", "Maintenance schedule"],
            "video_link": None,
            "video_label": None
        }
            
    except Exception as e:
        return {"response": f"Error contacting AI provider: {str(e)}", "suggestions": []}


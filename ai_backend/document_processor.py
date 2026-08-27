import os
import json
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

async def process_document(text_content: str) -> dict:
    """
    Extracts structured data from a vehicle service receipt, invoice, or warranty document.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {"error": "GROQ_API_KEY not found."}
        
    model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    try:
        llm = ChatGroq(
            api_key=api_key,
            model=model_name,
            temperature=0.0
        )
        
        system_prompt = """You are an expert automotive document parser.
        Given the OCR text of a service receipt, invoice, or warranty document, extract the following information into a strict JSON format.
        Return ONLY valid JSON, do not include markdown formatting or conversational text.
        
        {
          "garage_name": "Name of the garage or null",
          "service_date": "YYYY-MM-DD or null",
          "mileage": "Integer or null",
          "services_performed": ["List of services"],
          "parts_replaced": [
             {
               "part_name": "Name of part",
               "cost": "Cost as number or string",
               "warranty_duration": "E.g. 12 months, 2 years, or null if not specified"
             }
          ],
          "total_cost": "Total cost as string or number",
          "recommendations": "Any notes or recommendations from the mechanic"
        }
        """
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Document Text:\n\n{text_content}")
        ]
        
        response = await llm.ainvoke(messages)
        content = response.content.strip()
        
        # Robust JSON extraction
        import re
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
                
        return {"error": "Failed to parse document into structured format", "raw": content}
        
    except Exception as e:
        return {"error": str(e)}

import os
import json
from supabase import create_client, Client

def get_supabase() -> Client:
    url: str = os.environ.get("SUPABASE_URL", "")
    key: str = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
    return create_client(url, key)

async def store_vehicle_document(vehicle_id: str, document_data: dict, embedding: list = None):
    """
    Stores a parsed document into the Supabase database.
    If embedding is provided, it stores it in a pgvector column for semantic search.
    """
    supabase = get_supabase()
    
    # Store raw document
    doc_record = {
        "vehicle_id": vehicle_id,
        "content": json.dumps(document_data),
        "embedding": embedding # Assuming a vector column exists in Supabase
    }
    
    response = supabase.table("vehicle_documents").insert(doc_record).execute()
    return response.data

async def query_history_rag(query: str, vehicle_id: str) -> str:
    """
    Queries the vehicle history using Supabase pgvector match_documents function.
    """
    # Placeholder for actual embedding generation of the query
    # In production, we would embed the query string here.
    query_embedding = [0.0] * 1536 # Mock 1536-d vector
    
    supabase = get_supabase()
    
    try:
        # Example RPC call to a Supabase pgvector match function
        response = supabase.rpc(
            "match_vehicle_documents",
            {"query_embedding": query_embedding, "match_threshold": 0.7, "match_count": 5, "p_vehicle_id": vehicle_id}
        ).execute()
        
        if not response.data:
            return "No relevant historical records found."
            
        results = [f"Record: {doc['content']}" for doc in response.data]
        return "\n\n".join(results)
    except Exception as e:
        return f"Error querying database: {str(e)}"

async def fetch_warranty_status(part_name: str, vehicle_id: str) -> str:
    """
    Queries the database specifically looking for a part and returning its warranty status.
    """
    supabase = get_supabase()
    
    try:
        # Simplistic JSONB query (In reality, we might use pgvector for semantic part matching)
        response = supabase.table("vehicle_documents").select("content").eq("vehicle_id", vehicle_id).execute()
        
        relevant_warranties = []
        for row in response.data:
            data = json.loads(row["content"])
            if "parts_replaced" in data:
                for part in data["parts_replaced"]:
                    if part_name.lower() in part.get("part_name", "").lower():
                        relevant_warranties.append(
                            f"Part '{part['part_name']}' replaced on {data.get('service_date')} at {data.get('garage_name')}. Warranty: {part.get('warranty_duration')}."
                        )
        
        if not relevant_warranties:
            return f"No warranty records found for {part_name}."
            
        return "\n".join(relevant_warranties)
    except Exception as e:
        return f"Error checking warranty: {str(e)}"

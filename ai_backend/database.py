import os
import json
import psycopg2
from psycopg2.extras import Json
from pgvector.psycopg2 import register_vector
import logging

logger = logging.getLogger(__name__)

def get_db_connection():
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        raise ValueError("Missing DATABASE_URL")
    
    conn = psycopg2.connect(db_url)
    register_vector(conn)
    return conn

async def store_vehicle_document(vehicle_id: str, document_data: dict, embedding: list = None):
    """
    Stores a parsed document into the Neon database.
    If embedding is provided, it stores it in a pgvector column for semantic search.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "INSERT INTO vehicle_documents (vehicle_id, content, embedding) VALUES (%s, %s, %s) RETURNING id;",
            (vehicle_id, Json(document_data), embedding)
        )
        inserted_id = cur.fetchone()[0]
        conn.commit()
        
        cur.close()
        conn.close()
        return [{"id": inserted_id}]
    except Exception as e:
        logger.error(f"Error storing document: {str(e)}")
        raise

async def query_history_rag(query: str, vehicle_id: str) -> str:
    """
    Queries the vehicle history using pgvector similarity search in Neon.
    """
    # Placeholder for actual embedding generation of the query
    # In production, we would embed the query string here.
    query_embedding = [0.0] * 1536 # Mock 1536-d vector
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # pgvector similarity search (<-> is L2 distance, <=>` is cosine)
        cur.execute(
            \"\"\"
            SELECT content FROM vehicle_documents
            WHERE vehicle_id = %s
            ORDER BY embedding <=> %s
            LIMIT 5;
            \"\"\",
            (vehicle_id, query_embedding)
        )
        
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        if not rows:
            return "No relevant historical records found."
            
        results = [f"Record: {json.dumps(row[0])}" for row in rows]
        return "\n\n".join(results)
    except Exception as e:
        return f"Error querying database: {str(e)}"

async def fetch_warranty_status(part_name: str, vehicle_id: str) -> str:
    """
    Queries the database specifically looking for a part and returning its warranty status.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # We can query all documents for the vehicle, or even use Postgres JSONB queries directly.
        # For simplicity, we'll fetch them and parse in Python as before.
        cur.execute(
            "SELECT content FROM vehicle_documents WHERE vehicle_id = %s;",
            (vehicle_id,)
        )
        
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        relevant_warranties = []
        for row in rows:
            data = row[0]
            if isinstance(data, str):
                data = json.loads(data)
                
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

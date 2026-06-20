from typing import List
from models import MemoryItem

# Ephemeral in-memory database storage using a list.
# This list is pre-populated with example memories to support immediate testing of key functionality.
_memories_db: List[MemoryItem] = [
    MemoryItem(type="architecture", content="Use MongoDB Atlas"),
    MemoryItem(type="preference", content="Prefer Python for backend services"),
    MemoryItem(type="coding_standard", content="Use type hints and descriptive variable names in all Python modules")
]

def save_memory(memory_type: str, content: str) -> MemoryItem:
    """
    Saves a memory item into the temporary in-memory database.
    
    --- FUTURE PARCLE INTEGRATION NOTE ---
    To migrate to Parcle long-term memory:
    1. Define the Parcle endpoint (e.g. https://api.parcle.ai/v1/memories)
    2. Make an asynchronous/synchronous POST request sending:
       headers={"Authorization": f"Bearer {PARCLE_API_KEY}"}
       json={"type": memory_type, "content": content}
    3. Save the response data and handle network/API errors.
    --------------------------------------
    """
    item = MemoryItem(type=memory_type, content=content)
    _memories_db.append(item)
    return item

def search_memory(query: str) -> List[MemoryItem]:
    """
    Searches the memory database using case-insensitive keyword and substring matching.
    
    --- FUTURE PARCLE INTEGRATION NOTE ---
    To migrate to Parcle search capabilities:
    1. Send search string query to Parcle vector/keyword search endpoint:
       headers={"Authorization": f"Bearer {PARCLE_API_KEY}"}
       params={"query": query}
    2. Parcle will run semantic similarity matching and return relevant memories.
    --------------------------------------
    """
    if not query:
        return []
        
    query_lower = query.lower()
    query_words = set(query_lower.split())
    results: List[MemoryItem] = []
    
    for item in _memories_db:
        content_lower = item.content.lower()
        type_lower = item.type.lower()
        
        # Match if full query is a substring, or if any query word exists in type or content
        if (query_lower in content_lower or 
            query_lower in type_lower or 
            any(word in content_lower or word in type_lower for word in query_words)):
            results.append(item)
            
    return results

def get_all_memories() -> List[MemoryItem]:
    """
    Retrieves all memories currently stored in the database.
    
    --- FUTURE PARCLE INTEGRATION NOTE ---
    To migrate to Parcle retrieval capabilities:
    1. Fetch all memory entries tied to the current agent session.
    --------------------------------------
    """
    return list(_memories_db)

import logging
from typing import List
from models import MemoryItem
import parcle_client
from datetime import datetime
import mongodb

logger = logging.getLogger("memoryforge_backend")

# Local fallback in-memory database storage
_memories_db: List[MemoryItem] = [
    MemoryItem(type="architecture", content="Use MongoDB Atlas"),
    MemoryItem(type="preference", content="Prefer Python for backend services"),
    MemoryItem(type="coding_standard", content="Use type hints and descriptive variable names in all Python modules")
]

DEFAULT_USER_ID = "default_user"

def save_memory(memory_type: str, content: str, user_id: str = DEFAULT_USER_ID) -> MemoryItem:
    """
    Attempts to save a memory block to MongoDB Atlas and the Parcle service.
    """
    item = MemoryItem(type=memory_type, content=content)
    
    # 1. Save to MongoDB Atlas collection 'memories'
    try:
        mongodb.db.memories.insert_one({
            "type": memory_type,
            "content": content,
            "user_id": user_id,
            "timestamp": datetime.utcnow()
        })
        logger.info(f"[MONGODB SAVED] Saved memory to database: {memory_type}")
    except Exception as db_err:
        logger.error(f"Failed to save memory to MongoDB: {str(db_err)}")
        
    # 2. Save to Parcle primary save
    try:
        # Try Parcle primary save
        parcle_client.save_to_parcle(user_id, memory_type, content)
        print(f"[MEMORY SAVED] Type: {memory_type}, Content: {content}")
        logger.info(f"[MEMORY SAVED] Type: {memory_type}, Content: {content}")
    except Exception as e:
        # Graceful fallback to local list
        print(f"[PARCLE FALLBACK ACTIVE] Failed to save memory to Parcle: {str(e)}")
        logger.warning(f"[PARCLE FALLBACK ACTIVE] Failed to save memory to Parcle: {str(e)}")
        
        _memories_db.append(item)
        print(f"[MEMORY SAVED] (Local Fallback) Type: {memory_type}, Content: {content}")
        logger.info(f"[MEMORY SAVED] (Local Fallback) Type: {memory_type}, Content: {content}")
        
    return item

def search_memory(query: str, user_id: str = DEFAULT_USER_ID) -> List[MemoryItem]:
    """
    Queries memory records matching the query string.
    Attempts Parcle vector indexing first, falling back to database search, then local keyword matcher.
    """
    print(f"[MEMORY SEARCH] Query: {query}")
    logger.info(f"[MEMORY SEARCH] Query: {query}")
    
    # Increment query topic tracking in analytics
    try:
        if query:
            mongodb.increment_topic_query(query[:50])
    except Exception as ae:
        logger.error(f"Failed to update query metrics: {str(ae)}")
        
    try:
        # Try Parcle primary search
        results = parcle_client.search_in_parcle(user_id, query)
        print(f"[MEMORY RETRIEVED] Retrieved {len(results)} memories from Parcle.")
        logger.info(f"[MEMORY RETRIEVED] Retrieved {len(results)} memories from Parcle.")
        
        # Increment retrieval count in analytics
        try:
            if results:
                mongodb.increment_retrieval_count(len(results))
        except Exception:
            pass
            
        return results
    except Exception as e:
        # Fallback to MongoDB search or local in-memory DB
        print(f"[PARCLE FALLBACK ACTIVE] Falling back to database search due to error: {str(e)}")
        logger.warning(f"[PARCLE FALLBACK ACTIVE] Falling back to database search due to error: {str(e)}")
        
        if not query:
            return []
            
        # Try to search MongoDB memories first
        try:
            query_regex = {"$regex": query, "$options": "i"}
            db_results = mongodb.db.memories.find({
                "user_id": user_id,
                "$or": [
                    {"content": query_regex},
                    {"type": query_regex}
                ]
            })
            results = [MemoryItem(type=doc["type"], content=doc["content"]) for doc in db_results]
            if results:
                print(f"[MEMORY RETRIEVED] (MongoDB Fallback) Retrieved {len(results)} memories.")
                return results
        except Exception as db_err:
            logger.error(f"MongoDB search fallback failed: {str(db_err)}")
            
        # Hard fallback to in-memory list
        query_lower = query.lower()
        query_words = set(query_lower.split())
        results = []
        
        for item in _memories_db:
            content_lower = item.content.lower()
            type_lower = item.type.lower()
            
            if (query_lower in content_lower or 
                query_lower in type_lower or 
                any(word in content_lower or word in type_lower for word in query_words)):
                results.append(item)
                
        print(f"[MEMORY RETRIEVED] (Local Fallback) Retrieved {len(results)} memories.")
        logger.info(f"[MEMORY RETRIEVED] (Local Fallback) Retrieved {len(results)} memories.")
        return results

def get_all_memories(user_id: str = DEFAULT_USER_ID) -> List[MemoryItem]:
    """
    Fetches all recorded memory records from MongoDB, Parcle or local database fallback.
    """
    # Try querying MongoDB memories first
    try:
        db_memories = mongodb.db.memories.find({"user_id": user_id})
        results = [MemoryItem(type=doc["type"], content=doc["content"]) for doc in db_memories]
        if results:
            return results
    except Exception as db_err:
        logger.error(f"Failed to fetch memories from MongoDB: {str(db_err)}")

    try:
        # Try Parcle primary fetch
        results = parcle_client.list_all_parcle_memories(user_id)
        return results
    except Exception as e:
        print(f"[PARCLE FALLBACK ACTIVE] Falling back to local list due to error: {str(e)}")
        logger.warning(f"[PARCLE FALLBACK ACTIVE] Falling back to local list due to error: {str(e)}")
        return list(_memories_db)


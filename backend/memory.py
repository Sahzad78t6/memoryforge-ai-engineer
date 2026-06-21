import logging
from typing import List, Optional
from models import MemoryItem
import parcle_client
from datetime import datetime
import mongodb

logger = logging.getLogger("memoryforge_backend")

# Local fallback in-memory database storage using dictionary entries for metadata & user isolation
_memories_db: List[dict] = [
    {
        "type": "architecture",
        "content": "Use MongoDB Atlas",
        "user_id": "default_user",
        "source_filename": None,
        "created_at": None
    },
    {
        "type": "preference",
        "content": "Prefer Python for backend services",
        "user_id": "default_user",
        "source_filename": None,
        "created_at": None
    },
    {
        "type": "coding_standard",
        "content": "Use type hints and descriptive variable names in all Python modules",
        "user_id": "default_user",
        "source_filename": None,
        "created_at": None
    }
]

DEFAULT_USER_ID = "default_user"

def save_memory(
    memory_type: str,
    content: str,
    user_id: str = DEFAULT_USER_ID,
    source_filename: Optional[str] = None,
    created_at: Optional[str] = None
) -> MemoryItem:
    """
    Attempts to save a memory block to MongoDB Atlas and the Parcle service.
    """
    if not created_at:
        created_at = datetime.utcnow().isoformat()

    item = MemoryItem(
        type=memory_type,
        content=content,
        source_filename=source_filename,
        created_at=created_at
    )
    
    # 1. Save to MongoDB Atlas collection 'memories'
    try:
        mongodb.db.memories.insert_one({
            "type": memory_type,
            "content": content,
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "source_filename": source_filename,
            "created_at": created_at
        })
        logger.info(f"[MONGODB SAVE] Saved memory to database: {memory_type}")
    except Exception as db_err:
        logger.error(f"[ERROR] Failed to save memory to MongoDB: {str(db_err)}")
        
    # 2. Save to Parcle primary save
    try:
        parcle_client.save_to_parcle(
            user_id,
            memory_type,
            content,
            source_filename=source_filename,
            created_at=created_at
        )
        logger.info(f"[PARCLE SAVE] Memory successfully pushed to Parcle index.")
    except Exception as e:
        # Graceful fallback to local list
        logger.warning(f"[ERROR] [PARCLE FALLBACK ACTIVE] Failed to save memory to Parcle: {str(e)}")
        
        _memories_db.append({
            "type": memory_type,
            "content": content,
            "user_id": user_id,
            "source_filename": source_filename,
            "created_at": created_at
        })
        logger.info(f"[MONGODB SAVE] (Local Fallback) Saved memory Type: {memory_type}, Content: {content}")
        
    return item

def search_memory(query: str, user_id: str = DEFAULT_USER_ID) -> List[MemoryItem]:
    """
    Queries memory records matching the query string.
    Attempts Parcle vector indexing first, falling back to database search, then local keyword matcher.
    """
    logger.info(f"[MEMORY SEARCH] Query: {query}")
    
    # Increment query topic tracking in analytics
    try:
        if query:
            mongodb.increment_topic_query(query[:50])
    except Exception as ae:
        logger.error(f"[ERROR] Failed to update query metrics: {str(ae)}")
        
    try:
        # Try Parcle primary search
        results = parcle_client.search_in_parcle(user_id, query)
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
        logger.warning(f"[ERROR] [PARCLE FALLBACK ACTIVE] Falling back to database search due to error: {str(e)}")
        
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
            results = [
                MemoryItem(
                    type=doc["type"],
                    content=doc["content"],
                    source_filename=doc.get("source_filename"),
                    created_at=doc.get("created_at") or (doc.get("timestamp").isoformat() if isinstance(doc.get("timestamp"), datetime) else None)
                ) for doc in db_results
            ]
            if results:
                logger.info(f"[MEMORY RETRIEVED] (MongoDB Fallback) Retrieved {len(results)} memories.")
                return results
        except Exception as db_err:
            logger.error(f"[ERROR] MongoDB search fallback failed: {str(db_err)}")
            
        # Hard fallback to in-memory list with strict user isolation
        query_lower = query.lower()
        query_words = set(query_lower.split())
        results = []
        
        for item in _memories_db:
            if item.get("user_id") != user_id:
                continue
            content_lower = item.get("content", "").lower()
            type_lower = item.get("type", "").lower()
            
            if (query_lower in content_lower or 
                query_lower in type_lower or 
                any(word in content_lower or word in type_lower for word in query_words)):
                results.append(
                    MemoryItem(
                        type=item.get("type"),
                        content=item.get("content"),
                        source_filename=item.get("source_filename"),
                        created_at=item.get("created_at")
                    )
                )
                
        logger.info(f"[MEMORY RETRIEVED] (Local Fallback) Retrieved {len(results)} memories.")
        return results

def get_all_memories(user_id: str = DEFAULT_USER_ID) -> List[MemoryItem]:
    """
    Fetches all recorded memory records from MongoDB, Parcle or local database fallback.
    """
    # Try querying MongoDB memories first
    try:
        db_memories = mongodb.db.memories.find({"user_id": user_id})
        results = [
            MemoryItem(
                type=doc["type"],
                content=doc["content"],
                source_filename=doc.get("source_filename"),
                created_at=doc.get("created_at") or (doc.get("timestamp").isoformat() if isinstance(doc.get("timestamp"), datetime) else None)
            ) for doc in db_memories
        ]
        if results:
            logger.info(f"[MEMORY RETRIEVED] (MongoDB) Retrieved {len(results)} memories.")
            return results
    except Exception as db_err:
        logger.error(f"[ERROR] Failed to fetch memories from MongoDB: {str(db_err)}")

    try:
        # Try Parcle primary fetch
        results = parcle_client.list_all_parcle_memories(user_id)
        logger.info(f"[MEMORY RETRIEVED] (Parcle) Retrieved {len(results)} memories.")
        return results
    except Exception as e:
        logger.warning(f"[ERROR] [PARCLE FALLBACK ACTIVE] Falling back to local list due to error: {str(e)}")
        
        results = []
        for item in _memories_db:
            if item.get("user_id") == user_id:
                results.append(
                    MemoryItem(
                        type=item.get("type"),
                        content=item.get("content"),
                        source_filename=item.get("source_filename"),
                        created_at=item.get("created_at")
                    )
                )
        logger.info(f"[MEMORY RETRIEVED] (Local Fallback) Retrieved {len(results)} memories.")
        return results



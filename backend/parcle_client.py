import logging
import time
from typing import List, Optional
from parcle import Parcle
from models import MemoryItem
import config

logger = logging.getLogger("memoryforge_backend")

_client: Optional[Parcle] = None
_is_connected = False

def get_client() -> Parcle:
    """
    Retrieves or instantiates the Parcle API client wrapper.
    Performs a lightweight validation check on credentials during first connection.
    Logs '[PARCLE CONNECTED]' upon successful setup.
    """
    global _client, _is_connected
    if _client is None:
        if not config.PARCLE_API_KEY:
            raise ValueError("PARCLE_API_KEY is not configured.")
            
        # Instantiate Parcle SDK client
        _client = Parcle(api_key=config.PARCLE_API_KEY)
        
        try:
            # Verify authentication and ensure default user exists
            _client.create_user(user_id="default_user")
            _is_connected = True
            print("[PARCLE CONNECTED]")
            logger.info("[PARCLE CONNECTED] Successfully authenticated with Parcle memory platform.")
        except Exception as e:
            _is_connected = False
            logger.warning(f"Connection verification failed: {str(e)}")
            raise e
            
    return _client

def ensure_user_exists(user_id: str) -> None:
    """
    Guarantees that the specified user_id is created in the Parcle system.
    """
    client = get_client()
    try:
        client.create_user(user_id=user_id)
        logger.info(f"Successfully ensured / created Parcle user: {user_id}")
    except Exception:
        # Ignore errors (e.g. 409 Conflict if user already exists)
        pass

def save_to_parcle(user_id: str, memory_type: str, content: str, max_retries: int = 3) -> bool:
    """
    Appends a new memory record to Parcle with type tag category.
    Implements simple exponential backoff for resilience against transient errors.
    """
    ensure_user_exists(user_id)
    client = get_client()
    delay = 1.0
    
    for attempt in range(max_retries):
        try:
            client.ingest_dialog(
                user_id=user_id,
                messages=[{"role": "user", "content": content}],
                tag={"type": memory_type}
            )
            return True
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"Failed to ingest dialogue to Parcle after {max_retries} attempts.")
                raise e
            time.sleep(delay)
            delay *= 2
            
    return False

def search_in_parcle(user_id: str, query: str, max_retries: int = 3) -> List[MemoryItem]:
    """
    Queries Parcle memory vector index and maps Citations to original memory categories.
    """
    ensure_user_exists(user_id)
    client = get_client()
    delay = 1.0
    search_result = None
    
    # 1. Perform semantic search query
    for attempt in range(max_retries):
        try:
            search_result = client.search(user_id=user_id, query=query)
            break
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"Search request failed after {max_retries} attempts.")
                raise e
            time.sleep(delay)
            delay *= 2
            
    if not search_result or not search_result.citations:
        return []
        
    memories: List[MemoryItem] = []
    
    # 2. Resolve returned citation sources
    for citation in search_result.citations:
        if citation.type == "session":
            session = None
            for attempt in range(max_retries):
                try:
                    session = client.get_session(user_id=user_id, session_id=citation.id)
                    break
                except Exception as e:
                    if attempt == max_retries - 1:
                        logger.error(f"Failed to retrieve session {citation.id}: {str(e)}")
                        raise e
                    time.sleep(delay)
                    delay *= 2
                    
            if session and session.messages:
                m_type = session.tag.get("type", "conversation") if session.tag else "conversation"
                content = session.messages[0].content
                memories.append(MemoryItem(type=m_type, content=content))
                
    return memories

def list_all_parcle_memories(user_id: str, max_retries: int = 3) -> List[MemoryItem]:
    """
    Gathers all recorded dialog sessions from Parcle and converts them into MemoryItems.
    """
    ensure_user_exists(user_id)
    client = get_client()
    delay = 1.0
    sources_page = None
    
    for attempt in range(max_retries):
        try:
            sources_page = client.list_sources(user_id=user_id, type="session", limit=100)
            break
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"List sources request failed after {max_retries} attempts.")
                raise e
            time.sleep(delay)
            delay *= 2
            
    if not sources_page or not sources_page.sources:
        return []
        
    memories: List[MemoryItem] = []
    for source in sources_page.sources:
        for attempt in range(max_retries):
            try:
                session = client.get_session(user_id=user_id, session_id=source.id)
                if session and session.messages:
                    m_type = session.tag.get("type", "conversation") if session.tag else "conversation"
                    content = session.messages[0].content
                    memories.append(MemoryItem(type=m_type, content=content))
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    logger.warning(f"Skipping source ID {source.id} due to resolution error: {str(e)}")
                else:
                    time.sleep(delay)
                    delay *= 2
                    
    return memories

def ingest_file_to_parcle(user_id: str, filename: str, content_bytes: bytes, content_type: str, max_retries: int = 3) -> bool:
    """
    Ingests a document file (PDF, TXT, MD, README) into Parcle memory for semantic search.
    """
    ensure_user_exists(user_id)
    client = get_client()
    delay = 1.0
    
    for attempt in range(max_retries):
        try:
            client.ingest_file(
                user_id=user_id,
                file=(filename, content_bytes, content_type),
                tag={"type": "document", "filename": filename}
            )
            return True
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"Failed to ingest file {filename} to Parcle after {max_retries} attempts: {str(e)}")
                raise e
            time.sleep(delay)
            delay *= 2
            
    return False


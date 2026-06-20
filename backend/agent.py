from typing import Tuple, List
from memory import search_memory, save_memory
from groq_client import generate_response
from models import MemoryItem

def process_message(message: str) -> Tuple[str, List[MemoryItem]]:
    """
    Orchestrates the conversation flow:
    1. Searches current memory database for keywords in the user message.
    2. Retrieves relevant MemoryItem records.
    3. Triggers Groq completion using the retrieved context.
    4. Records the new user request and generated response as an interaction memory.
    5. Returns the generated response string along with the memory items used.
    """
    # Step 1 & 2: Search memory for query relevance
    relevant_memories = search_memory(message)
    
    # Step 3: Call Groq API with context
    reply = generate_response(message, relevant_memories)
    
    # Step 4: Save the conversation interaction back to memory for future persistence
    interaction_summary = f"User asked for: '{message}' -> AI responded with: '{reply[:200]}...'"
    save_memory(memory_type="interaction", content=interaction_summary)
    
    # Return the reply text and memory context
    return reply, relevant_memories

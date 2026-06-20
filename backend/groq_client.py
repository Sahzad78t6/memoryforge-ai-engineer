# pyrefly: ignore [missing-import]
from groq import Groq
from typing import List
import config
from models import MemoryItem

# Initialize the Groq client using the validated API key
client = Groq(api_key=config.GROQ_API_KEY)

def generate_response(message: str, memory_context: List[MemoryItem]) -> str:
    """
    Combines the memory context and user request to construct a system prompt,
    calls the Groq API (using llama-3.3-70b-versatile), and returns the generated text.
    """
    # Format the memory context lists into a readable string format
    if memory_context:
        formatted_context = ""
        for i, item in enumerate(memory_context, 1):
            formatted_context += f"{i}. [{item.type.upper()}] {item.content}\n"
    else:
        formatted_context = "No previous memory context available."

    # Construct system prompt matching specifications
    system_prompt = (
        "You are MemoryForge AI Engineer.\n\n"
        "You are an AI software engineer with persistent memory.\n\n"
        "Before answering, always review the provided memory context.\n"
        "Use previous architectural decisions, bug fixes, coding standards, and team preferences whenever relevant.\n"
        "Maintain consistency with prior decisions unless the user explicitly changes them.\n\n"
        "Memory Context:\n"
        f"{formatted_context.strip()}\n\n"
        "User Request:\n"
        f"{message}"
    )

    try:
        # Request completion from Groq API
        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.2  # Keep temp relatively low for consistent software engineering advice
        )
        
        # Extract and return response text
        if chat_completion.choices and len(chat_completion.choices) > 0:
            return chat_completion.choices[0].message.content or ""
        else:
            raise RuntimeError("Received an empty completion response from Groq API.")
            
    except Exception as e:
        # Re-raise with added context for upstream handling
        raise RuntimeError(f"Error calling Groq API: {str(e)}")

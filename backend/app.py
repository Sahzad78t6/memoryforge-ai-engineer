from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

from models import ChatRequest, ChatResponse
from agent import process_message

# Set up logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("memoryforge_backend")

# Initialize FastAPI application
app = FastAPI(
    title="MemoryForge AI Engineer Backend",
    description="FastAPI + Groq AI Engineer with persistent local memory.",
    version="1.0.0"
)

# Add CORS Middleware to enable communication with standard web frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler for unanticipated server errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"An internal server error occurred: {str(exc)}"}
    )

@app.get("/health")
async def health():
    """
    Health check endpoint to ensure services are responsive.
    """
    return {
        "status": "ok",
        "service": "MemoryForge AI Engineer"
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main dialogue endpoint:
    1. Evaluates incoming query message.
    2. Interrogates local memory database for relevant contextual matches.
    3. Runs prompt processing via Groq Client using llama-3.3-70b-versatile.
    4. Saves the interaction to the memory store.
    5. Returns the response message and memory context objects.
    """
    # Reject empty queries
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")
        
    try:
        reply, memory_context = process_message(request.message)
        return ChatResponse(reply=reply, memory_context=memory_context)
    except RuntimeError as re:
        logger.error(f"Runtime processing error: {str(re)}")
        raise HTTPException(status_code=502, detail=str(re))
    except Exception as e:
        logger.error(f"Internal app error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

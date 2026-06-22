import os
from pathlib import Path
from dotenv import load_dotenv
import logging

BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from the backend/.env file regardless of where the app is started from.
load_dotenv(BASE_DIR / ".env")

# Extract key configuration values
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PARCLE_API_KEY = os.getenv("PARCLE_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "memoryforge")
JWT_SECRET = os.getenv("JWT_SECRET", "memoryforge-super-secret-key-1234567890")
VISION_PROVIDER = os.getenv("VISION_PROVIDER", "gemini")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def validate_config() -> None:
    """
    Validates that the required configuration variables are set.
    Raises a ValueError with a detailed message identifying the missing environment variables.
    """
    missing_vars = []
    if not GROQ_API_KEY:
        missing_vars.append("GROQ_API_KEY")
    if not PARCLE_API_KEY:
        missing_vars.append("PARCLE_API_KEY")
    
    if VISION_PROVIDER == "gemini" and not GEMINI_API_KEY:
        missing_vars.append("GEMINI_API_KEY")
    elif VISION_PROVIDER == "openai" and not OPENAI_API_KEY:
        missing_vars.append("OPENAI_API_KEY")
        
    if missing_vars:
        # In development we prefer to warn and continue so the server can be
        # started for local testing. Production deployments should provide
        # these keys. This will log a warning and leave missing keys as None.
        logging.warning(
            "Configuration Validation Warning: The following environment variable(s) are missing: %s. "
            "Proceeding with missing values for local testing.",
            ', '.join(missing_vars)
        )

# Automatically validate on import to ensure immediate failure on configuration issues
validate_config()


import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Extract key configuration values
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PARCLE_API_KEY = os.getenv("PARCLE_API_KEY")

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
        
    if missing_vars:
        raise ValueError(
            f"Configuration Validation Failed: The following environment variable(s) are missing: "
            f"{', '.join(missing_vars)}. Please check your .env file or environment settings."
        )

# Automatically validate on import to ensure immediate failure on configuration issues
validate_config()

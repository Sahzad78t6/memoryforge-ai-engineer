import logging
import json
from groq import Groq
import config

logger = logging.getLogger("memoryforge_backend")

def extract_structured_knowledge(file_name: str, file_content: str, upload_type: str) -> dict:
    """
    Calls Groq Llama-3.3-70b-versatile in strict JSON mode to extract structured knowledge.
    """
    if not config.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY is not configured. Falling back to safe extractor mode for local testing.")
        # Return a safe fallback without calling external API for local testing
        return {
            "summary": "[Fallback] Groq not configured — basic parsing only.",
            "technologies": [],
            "architecture": "Unknown",
            "decisions": [],
            "dependencies": [],
            "security_findings": [],
            "memories": []
        }
        
    client = Groq(api_key=config.GROQ_API_KEY)
    
    system_prompt = (
        "You are an expert AI Software Architect and Security Auditor.\n"
        "Your task is to analyze the provided text content extracted from a file, document, or project code repository.\n"
        "You must output a single, valid JSON object containing software engineering insights, metadata, and memories to be stored.\n\n"
        "The output JSON object MUST follow this schema exactly:\n"
        "{\n"
        "  \"summary\": \"A clean, detailed paragraph summarizing the contents and core purpose.\",\n"
        "  \"technologies\": [\"list of languages, frameworks, tools, databases, or cloud hosts detected\"],\n"
        "  \"architecture\": \"The overall design architecture detected (e.g., microservices, monolithic, client-server, layered, SPA, MVC, unknown).\",\n"
        "  \"decisions\": [\"Key software engineering or configuration decisions found\"],\n"
        "  \"dependencies\": [\"List of packages, manifest libraries, or dependencies used\"],\n"
        "  \"security_findings\": [\"List of security findings, hardcoded keys/secrets, vulnerabilities, or bad practices found. Empty list if none.\"],\n"
        "  \"memories\": [\n"
        "    {\n"
        "      \"type\": \"architecture | coding_standard | bug_fix | team_preference | conversation\",\n"
        "      \"content\": \"A concise engineering memory statement (e.g., 'Project uses JWT for auth.', 'Code relies on MongoDB.')\"\n"
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Make sure the 'memories' list has 2 to 5 high-value candidate memories to persist. Each memory statement should be self-contained and useful for a coding assistant.\n"
        "Ensure your response is valid JSON and contains NO extra text, headers, or explanations outside the JSON object itself."
    )
    
    user_content = (
        f"File Name: {file_name}\n"
        f"Upload Ingestion Type: {upload_type}\n"
        f"--- File/Project Content starts here ---\n"
        f"{file_content[:50000]}\n" # Safety limit input to 50k characters
        f"--- File/Project Content ends here ---"
    )
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            response_format={"type": "json_object"},
            temperature=0.1 # Keep temperature low for deterministic JSON structures
        )
        
        raw_output = completion.choices[0].message.content or "{}"
        parsed_json = json.loads(raw_output)
        
        # Ensure schema structure exists
        result = {
            "summary": parsed_json.get("summary", "No summary available."),
            "technologies": parsed_json.get("technologies", []),
            "architecture": parsed_json.get("architecture", "Unknown"),
            "decisions": parsed_json.get("decisions", []),
            "dependencies": parsed_json.get("dependencies", []),
            "security_findings": parsed_json.get("security_findings", []),
            "memories": parsed_json.get("memories", [])
        }
        
        return result
    except Exception as e:
        logger.error(f"Error extracting structured knowledge via Groq: {str(e)}", exc_info=True)
        # Safe fallback dictionary
        return {
            "summary": f"[Parsing Fallback] Failed to extract knowledge automatically due to API error: {str(e)}",
            "technologies": [],
            "architecture": "Unknown",
            "decisions": [],
            "dependencies": [],
            "security_findings": [f"Knowledge extractor error: {str(e)}"],
            "memories": []
        }

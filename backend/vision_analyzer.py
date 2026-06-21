import json
import logging
from PIL import Image
import io
import vision_provider

logger = logging.getLogger("memoryforge_backend")

def analyze_image(file_bytes: bytes, filename: str) -> dict:
    """
    Analyzes an uploaded image (screenshot, diagram, script, wireframe) using Vision AI
    and returns a structured dictionary of software engineering insights.
    """
    logger.info("[VISION START] Initiating image intelligence analysis.")
    
    # 1. Determine Mime Type
    mime_type = "image/png"
    try:
        image = Image.open(io.BytesIO(file_bytes))
        img_format = image.format
        if img_format:
            mime_type = f"image/{img_format.lower()}"
    except Exception as e:
        logger.warning(f"Could not open image via PIL to detect format: {str(e)}. Defaulting to image/png")
        ext = filename.split(".")[-1].lower() if "." in filename else "png"
        if ext in ["jpg", "jpeg"]:
            mime_type = "image/jpeg"
        elif ext == "webp":
            mime_type = "image/webp"
        elif ext == "gif":
            mime_type = "image/gif"
            
    # 2. Construct prompt demanding specific JSON schema
    prompt = (
        "You are an advanced AI Software Architect, System Designer, and Security Auditor.\n"
        "Analyze this image (which could be an architecture diagram, user interface screenshot, flowchart, code snippet, system wireframe, database ER diagram, or technical documentation) and extract software engineering insights.\n\n"
        "You MUST respond with a single, valid JSON object containing exactly the following keys. Do NOT include any markdown headers, wrappers (like ```json), or extra text outside the JSON object.\n\n"
        "Schema:\n"
        "{\n"
        "  \"summary\": \"A clear, high-level paragraph summarizing what this image represents and its technical context.\",\n"
        "  \"technologies_detected\": [\"List of visible or inferred frameworks, databases, programming languages, API models, tools, or libraries\"],\n"
        "  \"architecture_patterns\": [\"Architecture design patterns detected (e.g. MVC, microservices, SPA, monolithic, serverless, layered, pub-sub, client-server, unknown)\"],\n"
        "  \"components_detected\": [\"Identifiable components or UI elements (e.g. login form, payment gateway, backend routing handler, user dashboard, database clusters, cache layer)\"],\n"
        "  \"security_findings\": [\"Specific credentials, hardcoded keys, vulnerabilities, risks, lack of TLS, plain passwords, or insecure data flows visible in the screenshot. Empty array if none.\"],\n"
        "  \"recommendations\": [\"Engineering or architecture improvements, security mitigations, styling fixes, or code optimizations based on the image.\"],\n"
        "  \"memories_created\": [\n"
        "    {\n"
        "      \"type\": \"architecture | coding_standard | bug_fix | team_preference | conversation\",\n"
        "      \"content\": \"A concise, self-contained, fact-based engineering memory statement to persist (e.g. 'Uses Groq for AI inference.', 'React is used for client dashboard.', 'Login panel uses JWT tokens.')\"\n"
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Ensure the memories_created list has 2 to 5 high-value candidate memory statements to persist."
    )
    
    try:
        # Call API provider
        raw_output = vision_provider.call_vision_api(file_bytes, mime_type, prompt)
        
        # Clean response text if model included markdown code blocks
        clean_output = raw_output.strip()
        if clean_output.startswith("```"):
            # strip leading/trailing markdown blocks
            lines = clean_output.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            clean_output = "\n".join(lines).strip()
            
        parsed_json = json.loads(clean_output)
        
        # Ensure schema structure exists
        analysis_result = {
            "summary": parsed_json.get("summary", "No summary extracted."),
            "technologies_detected": parsed_json.get("technologies_detected", []),
            "architecture_patterns": parsed_json.get("architecture_patterns", []),
            "components_detected": parsed_json.get("components_detected", []),
            "security_findings": parsed_json.get("security_findings", []),
            "recommendations": parsed_json.get("recommendations", []),
            "memories_created": parsed_json.get("memories_created", [])
        }
        
        logger.info("[VISION SUCCESS] Vision AI successfully analyzed the image and returned structured payload.")
        return analysis_result
        
    except Exception as e:
        logger.error(f"[VISION ERROR] Exception occurred during Vision AI processing: {str(e)}", exc_info=True)
        # Re-raise to trigger app.py fallback logic
        raise RuntimeError(f"Vision analysis failed: {str(e)}")

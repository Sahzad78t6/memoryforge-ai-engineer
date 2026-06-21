import base64
import logging
import requests
import config

logger = logging.getLogger("memoryforge_backend")

def call_vision_api(image_bytes: bytes, mime_type: str, prompt: str) -> str:
    """
    Abstractions layer to communicate with Vision AI providers (Gemini or OpenAI)
    using raw HTTP requests to avoid installing extra dependencies.
    """
    provider = config.VISION_PROVIDER.lower()
    
    # Base64 encode the image
    base64_image = base64.b64encode(image_bytes).decode("utf-8")
    
    if provider == "gemini":
        if not config.GEMINI_API_KEY or "your_gemini_api_key" in config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured with a valid key.")
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={config.GEMINI_API_KEY}"
        headers = {
            "Content-Type": "application/json"
        }
        
        # Structure the payload based on Google AI Studio specs
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": base64_image
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        logger.info(f"[VISION PROVIDER] Dispatching request to Gemini API (mime_type: {mime_type})")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
            logger.error(f"[VISION ERROR] Gemini API returned status code {response.status_code}: {response.text}")
            raise RuntimeError(f"Gemini API Error: {response.text}")
            
        res_json = response.json()
        try:
            candidates = res_json.get("candidates", [])
            if candidates and len(candidates) > 0:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts and len(parts) > 0:
                    text_out = parts[0].get("text", "")
                    return text_out
            raise KeyError("Failed to parse candidates -> content -> parts -> text from Gemini response.")
        except Exception as parse_err:
            logger.error(f"[VISION ERROR] Failed to parse Gemini response payload: {str(parse_err)}. Raw: {res_json}")
            raise RuntimeError(f"Failed to parse Gemini response: {str(parse_err)}")
            
    elif provider == "openai":
        if not config.OPENAI_API_KEY or "your_openai_api_key" in config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured with a valid key.")
            
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config.OPENAI_API_KEY}"
        }
        
        payload = {
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            "response_format": {"type": "json_object"},
            "max_tokens": 4096
        }
        
        logger.info(f"[VISION PROVIDER] Dispatching request to OpenAI API (gpt-4o)")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
            logger.error(f"[VISION ERROR] OpenAI API returned status code {response.status_code}: {response.text}")
            raise RuntimeError(f"OpenAI API Error: {response.text}")
            
        res_json = response.json()
        try:
            choices = res_json.get("choices", [])
            if choices and len(choices) > 0:
                text_out = choices[0].get("message", {}).get("content", "")
                return text_out
            raise KeyError("Failed to parse choices -> message -> content from OpenAI response.")
        except Exception as parse_err:
            logger.error(f"[VISION ERROR] Failed to parse OpenAI response payload: {str(parse_err)}. Raw: {res_json}")
            raise RuntimeError(f"Failed to parse OpenAI response: {str(parse_err)}")
            
    else:
        raise ValueError(f"Unsupported VISION_PROVIDER configured: '{provider}'")

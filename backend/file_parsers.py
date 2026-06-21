import io
import logging
import zipfile
from pypdf import PdfReader
from docx import Document
from PIL import Image
import pytesseract

logger = logging.getLogger("memoryforge_backend")

def parse_pdf(file_bytes: bytes) -> str:
    """
    Extracts raw text content from PDF file bytes page by page.
    """
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        text_content = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text)
        return "\n".join(text_content)
    except Exception as e:
        logger.error(f"Error parsing PDF file: {str(e)}")
        raise ValueError(f"Failed to read PDF document: {str(e)}")

def parse_docx(file_bytes: bytes) -> str:
    """
    Extracts text paragraphs from Word DOCX file bytes.
    """
    try:
        docx_file = io.BytesIO(file_bytes)
        doc = Document(docx_file)
        text_content = [p.text for p in doc.paragraphs if p.text]
        return "\n".join(text_content)
    except Exception as e:
        logger.error(f"Error parsing DOCX file: {str(e)}")
        raise ValueError(f"Failed to read DOCX document: {str(e)}")

def parse_image_ocr(file_bytes: bytes) -> str:
    """
    Extracts text from image file bytes using pytesseract OCR.
    Gracefully falls back to metadata details if the Tesseract binary is not installed on the system.
    """
    try:
        image = Image.open(io.BytesIO(file_bytes))
        width, height = image.size
        img_format = image.format or "Unknown"
        
        try:
            # Attempt OCR text extraction
            ocr_text = pytesseract.image_to_string(image)
            if ocr_text and ocr_text.strip():
                return ocr_text
            else:
                return f"[Image Metadata] Format: {img_format}, Dimensions: {width}x{height}px. No text was detected via OCR."
        except Exception as ocr_err:
            logger.warning(f"[OCR FALLBACK ACTIVE] Tesseract OCR error: {str(ocr_err)}. Falling back to image metadata description.")
            return (
                f"[Image Ingestion Fallback]\n"
                f"Tesseract OCR is not fully configured on the host system.\n"
                f"Image Format: {img_format}\n"
                f"Dimensions: {width}x{height}px\n"
                f"Action item: Whitelist or install Tesseract OCR binary on host path for direct image text extraction."
            )
    except Exception as e:
        logger.error(f"Error reading image: {str(e)}")
        raise ValueError(f"Failed to process image: {str(e)}")

def parse_project_zip(file_bytes: bytes) -> str:
    """
    Unpacks a ZIP archive in memory, extracts its folder structure tree,
    and grabs configuration files and source code snippets for project analysis.
    """
    try:
        zip_file = io.BytesIO(file_bytes)
        text_summary = []
        
        with zipfile.ZipFile(zip_file) as z:
            file_list = z.namelist()
            
            # 1. Document the directory tree structure
            text_summary.append("=== Project File Structure Tree ===")
            text_summary.append("\n".join(file_list))
            text_summary.append("===================================\n")
            
            # Identify configuration or package manifest metadata files
            config_keywords = [
                "readme", "requirements.txt", "package.json", "setup.py", 
                "dockerfile", "docker-compose", ".env", "config", "settings", 
                "manifest", "build.gradle", "pom.xml"
            ]
            
            code_extensions = [".py", ".js", ".ts", ".java", ".cpp", ".html", ".css"]
            
            config_files_found = []
            code_files_found = []
            
            for path in file_list:
                # Skip directory path listings
                if path.endswith("/"):
                    continue
                    
                lower_path = path.lower()
                
                # Check config keywords
                if any(kw in lower_path for kw in config_keywords):
                    config_files_found.append(path)
                # Check code files
                elif any(lower_path.endswith(ext) for ext in code_extensions):
                    code_files_found.append(path)
            
            # Read configuration files
            text_summary.append("=== Configuration & Setup Files Content ===")
            for path in config_files_found[:8]: # Limit to first 8 configs
                try:
                    with z.open(path) as f:
                        content = f.read().decode('utf-8', errors='ignore')
                        text_summary.append(f"\n--- File: {path} ---")
                        # Limit single file reading to 8000 characters
                        text_summary.append(content[:8000])
                except Exception as fe:
                    text_summary.append(f"\n--- File: {path} (Error reading: {str(fe)}) ---")
            text_summary.append("===========================================\n")
            
            # Read primary code files (up to a budget limit of 30,000 characters total)
            text_summary.append("=== Source Code Snippets ===")
            code_char_budget = 30000
            char_count = 0
            
            for path in code_files_found[:10]: # Limit to first 10 code files
                if char_count >= code_char_budget:
                    break
                try:
                    with z.open(path) as f:
                        content = f.read().decode('utf-8', errors='ignore')
                        snippet = content[:5000] # Limit file snippet to 5000 chars
                        text_summary.append(f"\n--- Code File: {path} ---")
                        text_summary.append(snippet)
                        char_count += len(snippet)
                except Exception as fe:
                    text_summary.append(f"\n--- Code File: {path} (Error reading: {str(fe)}) ---")
            text_summary.append("=============================")
            
        return "\n".join(text_summary)
    except Exception as e:
        logger.error(f"Error parsing ZIP archive: {str(e)}")
        raise ValueError(f"Failed to read project ZIP archive: {str(e)}")

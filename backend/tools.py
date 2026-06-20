import os
from typing import Dict, Any, List

# Authorize file operations only within the project directory to prevent path traversal vulnerabilities.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def _is_safe_path(path: str) -> bool:
    """
    Helper function to check if the target path resides within the PROJECT_ROOT.
    """
    abs_path = os.path.abspath(path)
    return abs_path.startswith(PROJECT_ROOT)

def _resolve_path(path: str) -> str:
    """
    Helper function to resolve absolute paths relative to PROJECT_ROOT if a relative path is passed.
    """
    if not os.path.isabs(path):
        return os.path.abspath(os.path.join(PROJECT_ROOT, path))
    return os.path.abspath(path)

def read_file(path: str) -> Dict[str, Any]:
    """
    Reads the content of a text file safely.
    
    Returns a dict with:
        success (bool): Whether the file was successfully read.
        data (str, optional): Content of the file.
        error (str, optional): Error message if action failed.
    """
    try:
        target_path = _resolve_path(path)
        
        if not _is_safe_path(target_path):
            return {
                "success": False,
                "error": f"Security Error: Access denied. Path '{path}' is outside the authorized project root."
            }
            
        if not os.path.exists(target_path):
            return {"success": False, "error": f"File '{path}' does not exist."}
            
        if not os.path.isfile(target_path):
            return {"success": False, "error": f"Path '{path}' is a directory, not a file."}
            
        with open(target_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        return {"success": True, "data": content}
    except Exception as e:
        return {"success": False, "error": f"Failed to read file: {str(e)}"}

def write_file(path: str, content: str) -> Dict[str, Any]:
    """
    Writes text content to a file safely.
    
    Returns a dict with:
        success (bool): Whether the file was successfully written.
        data (str, optional): Success status message.
        error (str, optional): Error message if action failed.
    """
    try:
        target_path = _resolve_path(path)
        
        if not _is_safe_path(target_path):
            return {
                "success": False,
                "error": f"Security Error: Access denied. Path '{path}' is outside the authorized project root."
            }
            
        # Create directories if they do not exist
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(content)
            
        return {"success": True, "data": f"Successfully wrote content to '{path}'"}
    except Exception as e:
        return {"success": False, "error": f"Failed to write file: {str(e)}"}

def list_files(directory: str = ".") -> Dict[str, Any]:
    """
    Lists the files and directories inside a given folder path.
    
    Returns a dict with:
        success (bool): Whether the operation completed successfully.
        data (list, optional): Metadata list of files/directories.
        error (str, optional): Error message if action failed.
    """
    try:
        target_dir = _resolve_path(directory)
        
        if not _is_safe_path(target_dir):
            return {
                "success": False,
                "error": f"Security Error: Access denied. Directory '{directory}' is outside the authorized project root."
            }
            
        if not os.path.exists(target_dir):
            return {"success": False, "error": f"Directory '{directory}' does not exist."}
            
        if not os.path.isdir(target_dir):
            return {"success": False, "error": f"Path '{directory}' is a file, not a directory."}
            
        entries = os.listdir(target_dir)
        results: List[Dict[str, Any]] = []
        for entry in entries:
            full_entry_path = os.path.join(target_dir, entry)
            is_dir = os.path.isdir(full_entry_path)
            results.append({
                "name": entry,
                "is_dir": is_dir,
                "size_bytes": os.path.getsize(full_entry_path) if not is_dir else None
            })
            
        return {"success": True, "data": results}
    except Exception as e:
        return {"success": False, "error": f"Failed to list directory contents: {str(e)}"}

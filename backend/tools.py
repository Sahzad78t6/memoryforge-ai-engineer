import os
from pathlib import Path
from typing import Dict, Any, List, Optional

# Authorize file operations only within the configured project directory to prevent path traversal vulnerabilities.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "workspaces"))


def _to_safe_name(value: str) -> str:
    cleaned = value.strip().lower()
    cleaned = ''.join(ch if ch.isalnum() or ch in ('-', '_') else '-' for ch in cleaned)
    cleaned = cleaned.strip('-_')
    return cleaned or "project"


def _is_safe_path(path: str, base_root: Optional[str] = None) -> bool:
    """
    Helper function to check if the target path resides within the allowed base root.
    """
    allowed_root = os.path.realpath(base_root or PROJECT_ROOT)
    abs_path = os.path.realpath(os.path.abspath(path))
    return os.path.commonpath([allowed_root, abs_path]) == allowed_root


def _resolve_path(path: str, base_root: Optional[str] = None) -> str:
    """
    Helper function to resolve absolute paths relative to the configured base root if a relative path is passed.
    """
    root = os.path.realpath(base_root or PROJECT_ROOT)
    if not os.path.isabs(path):
        return os.path.abspath(os.path.join(root, path))
    return os.path.abspath(path)


def get_user_workspace_root(user_id: str) -> str:
    """
    Returns the per-user workspace root and creates it if it does not exist.
    """
    user_key = _to_safe_name(str(user_id))
    root = os.path.join(WORKSPACE_ROOT, user_key)
    os.makedirs(root, exist_ok=True)
    return root


def get_user_project_root(user_id: str, project_name: Optional[str] = None) -> str:
    """
    Returns a per-user project directory that is safe to use for reading/writing uploaded files.
    """
    base_root = get_user_workspace_root(user_id)
    folder_name = _to_safe_name(project_name or "default-project")
    project_root = os.path.join(base_root, folder_name)
    os.makedirs(project_root, exist_ok=True)
    return project_root


def read_file(path: str, base_root: Optional[str] = None) -> Dict[str, Any]:
    """
    Reads the content of a text file safely.
    
    Returns a dict with:
        success (bool): Whether the file was successfully read.
        data (str, optional): Content of the file.
        error (str, optional): Error message if action failed.
    """
    try:
        target_path = _resolve_path(path, base_root)
        
        if not _is_safe_path(target_path, base_root):
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


def write_file(path: str, content: str, base_root: Optional[str] = None) -> Dict[str, Any]:
    """
    Writes text content to a file safely.
    
    Returns a dict with:
        success (bool): Whether the file was successfully written.
        data (str, optional): Success status message.
        error (str, optional): Error message if action failed.
    """
    try:
        target_path = _resolve_path(path, base_root)
        
        if not _is_safe_path(target_path, base_root):
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


def list_files(directory: str = ".", base_root: Optional[str] = None) -> Dict[str, Any]:
    """
    Lists the files and directories inside a given folder path.
    
    Returns a dict with:
        success (bool): Whether the operation completed successfully.
        data (list, optional): Metadata list of files/directories.
        error (str, optional): Error message if action failed.
    """
    try:
        target_dir = _resolve_path(directory, base_root)
        
        if not _is_safe_path(target_dir, base_root):
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

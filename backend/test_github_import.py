import requests
import uuid
import sys
from pathlib import Path

# Add backend directory to path to test parse_github_url directly
sys.path.append(str(Path(__file__).parent))
from app import parse_github_url

base_url = "http://127.0.0.1:8000"

def test_url_parsing():
    print("--- Testing URL Parsing Utility ---")
    test_cases = [
        ("https://github.com/octocat/Spoon-Knife", ("octocat", "Spoon-Knife")),
        ("https://github.com/octocat/Spoon-Knife.git", ("octocat", "Spoon-Knife")),
        ("https://github.com/octocat/Spoon-Knife/", ("octocat", "Spoon-Knife")),
        ("octocat/Spoon-Knife", ("octocat", "Spoon-Knife")),
        ("invalid-url", (None, None)),
        ("https://github.com/onlyowner", (None, None))
    ]
    
    for url, expected in test_cases:
        res = parse_github_url(url)
        assert res == expected, f"Failed for {url}: expected {expected}, got {res}"
        print(f"PASSED: {url} -> {res}")
    print("All URL parsing tests PASSED.\n")

def test_api_github_import():
    print("--- Testing API GitHub Import Endpoint ---")
    
    # 1. Register a new user
    test_email = f"github_test_{uuid.uuid4().hex[:8]}@example.com"
    test_name = "GitHub Tester"
    test_password = "password123"

    print("Registering test user...")
    reg_payload = {
        "name": test_name,
        "email": test_email,
        "password": test_password,
        "role": "USER"
    }
    r_reg = requests.post(f"{base_url}/auth/register", json=reg_payload)
    if r_reg.status_code != 200:
        print(f"Registration Failed: {r_reg.text}")
        sys.exit(1)
        
    # 2. Log in
    print("Logging in...")
    login_payload = {
        "email": test_email,
        "password": test_password
    }
    r_login = requests.post(f"{base_url}/auth/login", json=login_payload)
    token = r_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Import valid small repository
    valid_repo = "https://github.com/octocat/Spoon-Knife"
    print(f"Importing valid repository: {valid_repo}...")
    import_payload = {"github_url": valid_repo}
    r_import = requests.post(f"{base_url}/upload/github", json=import_payload, headers=headers)
    print(f"Import Status Code: {r_import.status_code}")
    if r_import.status_code == 200:
        res = r_import.json()
        print("Import Response keys:", list(res.keys()))
        print("Status:", res.get("status"))
        print("Files in workspace:", res.get("files_in_workspace"))
        print("Summary:", res.get("summary"))
        print("Memories created count:", res.get("memories_created_count"))
        assert res.get("status") == "success"
        assert res.get("files_in_workspace") > 0
    else:
        print(f"Import Failed: {r_import.text}")
        sys.exit(1)
        
    # 4. Import invalid repository
    invalid_repo = "https://github.com/octocat/this-repo-does-not-exist-at-all-12345"
    print(f"Importing invalid repository (expecting failure): {invalid_repo}...")
    r_invalid = requests.post(f"{base_url}/upload/github", json={"github_url": invalid_repo}, headers=headers)
    print(f"Invalid Repo Status Code: {r_invalid.status_code}")
    print(f"Invalid Repo Response: {r_invalid.text}")
    assert r_invalid.status_code == 400
    assert "Failed to fetch repository" in r_invalid.json().get("message", "")
    
    # 5. Import invalid URL format
    bad_format = "invalid_format_string"
    print(f"Importing bad URL format (expecting failure): {bad_format}...")
    r_bad = requests.post(f"{base_url}/upload/github", json={"github_url": bad_format}, headers=headers)
    print(f"Bad Format Status Code: {r_bad.status_code}")
    print(f"Bad Format Response: {r_bad.text}")
    assert r_bad.status_code == 400
    assert "Invalid GitHub repository URL format" in r_bad.json().get("message", "")

    print("All API GitHub import tests PASSED.\n")

if __name__ == "__main__":
    test_url_parsing()
    test_api_github_import()
    print("SUCCESS: All integration tests passed successfully!")

import requests
import io
import uuid
import zipfile
from PIL import Image

base_url = "http://127.0.0.1:8000"

# 1. Register a new user
test_email = f"ingest_test_{uuid.uuid4().hex[:8]}@example.com"
test_name = "Ingestion Tester"
test_password = "password123"

print("--- 1. REGISTERING USER ---")
reg_payload = {
    "name": test_name,
    "email": test_email,
    "password": test_password,
    "role": "USER"
}
r_reg = requests.post(f"{base_url}/auth/register", json=reg_payload)
print(f"Registration Status: {r_reg.status_code}")
if r_reg.status_code != 200:
    print(r_reg.text)
    exit(1)

# 2. Log in
print("\n--- 2. LOGGING IN ---")
login_payload = {
    "email": test_email,
    "password": test_password
}
r_login = requests.post(f"{base_url}/auth/login", json=login_payload)
print(f"Login Status: {r_login.status_code}")
token = r_login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 3. Test POST /upload/file
print("\n--- 3. TESTING POST /upload/file ---")
doc_content = (
    "Architecture Standards Guideline:\n"
    "We use Python FastAPI for backend services and MongoDB Atlas as the primary database.\n"
    "All users are saved in the 'users' collection of the 'memoryforge' database.\n"
    "MemoryForge utilizes Parcle for semantic memory retrieval."
)
files = {
    "file": ("architecture_guideline.txt", io.BytesIO(doc_content.encode("utf-8")), "text/plain")
}
r_file = requests.post(f"{base_url}/upload/file", files=files, headers=headers)
print(f"File Upload Status: {r_file.status_code}")
if r_file.status_code == 200:
    res = r_file.json()
    print("Upload Result Keys:", list(res.keys()))
    print("Memories Created Count:", res.get("memories_created_count"))
    print("AI Summary Preview:", res.get("analysis", {}).get("summary")[:150] + "...")
else:
    print(r_file.text)

# 4. Test POST /upload/image
print("\n--- 4. TESTING POST /upload/image ---")
img = Image.new('RGB', (100, 100), color = 'blue')
img_bytes = io.BytesIO()
img.save(img_bytes, format='PNG')
img_bytes.seek(0)
img_files = {
    "file": ("architecture_diagram.png", img_bytes, "image/png")
}
r_img = requests.post(f"{base_url}/upload/image", files=img_files, headers=headers)
print(f"Image Upload Status: {r_img.status_code}")
if r_img.status_code == 200:
    res = r_img.json()
    print("Upload Result Keys:", list(res.keys()))
    print("AI Summary Preview:", res.get("analysis", {}).get("summary")[:150] + "...")
else:
    print(r_img.text)

# 5. Test POST /upload/project
print("\n--- 5. TESTING POST /upload/project (ZIP) ---")
zip_buffer = io.BytesIO()
with zipfile.ZipFile(zip_buffer, 'a', zipfile.ZIP_DEFLATED) as zip_file:
    zip_file.writestr('package.json', '{"name": "test-microservice", "dependencies": {"express": "^4.17.1", "mongoose": "^5.11.15"}}')
    zip_file.writestr('README.md', '# Test Microservice\nThis is a sample project for testing ZIP upload. Uses Express and Mongoose.')
zip_buffer.seek(0)
zip_files = {
    "file": ("project_src.zip", zip_buffer, "application/zip")
}
r_zip = requests.post(f"{base_url}/upload/project", files=zip_files, headers=headers)
print(f"Project Upload Status: {r_zip.status_code}")
if r_zip.status_code == 200:
    res = r_zip.json()
    print("Upload Result Keys:", list(res.keys()))
    print("AI Summary Preview:", res.get("analysis", {}).get("summary")[:150] + "...")
    print("Technologies:", res.get("analysis", {}).get("technologies"))
    print("Dependencies:", res.get("analysis", {}).get("dependencies"))
else:
    print(r_zip.text)

# 6. Test GET /knowledge/history
print("\n--- 6. TESTING GET /knowledge/history ---")
r_hist = requests.get(f"{base_url}/knowledge/history", headers=headers)
print(f"History Status: {r_hist.status_code}")
if r_hist.status_code == 200:
    res = r_hist.json()
    print(f"History contains {len(res)} items.")
    for idx, item in enumerate(res):
        print(f"Item {idx+1}: {item.get('filename')} (Type: {item.get('file_type')}) - Summary: {item.get('summary')[:80]}...")
else:
    print(r_hist.text)

# 7. Test GET /knowledge/search
print("\n--- 7. TESTING GET /knowledge/search ---")
r_search = requests.get(f"{base_url}/knowledge/search", params={"query": "MongoDB"}, headers=headers)
print(f"Search Status: {r_search.status_code}")
if r_search.status_code == 200:
    res = r_search.json()
    print(f"Search found {len(res)} results for 'MongoDB':")
    for idx, item in enumerate(res):
        print(f"Result {idx+1}: {item.get('title')} - Preview: {item.get('content_preview')[:120]}...")
else:
    print(r_search.text)

print("\n--- VERIFICATION COMPLETED ---")

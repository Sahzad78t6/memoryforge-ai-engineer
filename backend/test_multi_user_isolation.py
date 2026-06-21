import requests
import uuid

base_url = "http://127.0.0.1:8000"

def run_multi_user_test():
    print("--- 1. REGISTERING USER A ---")
    email_a = f"usera_{uuid.uuid4().hex[:6]}@example.com"
    r_reg_a = requests.post(f"{base_url}/auth/register", json={
        "name": "User A",
        "email": email_a,
        "password": "passwordA123",
        "role": "USER"
    })
    assert r_reg_a.status_code == 200
    
    print("--- 2. LOGGING IN USER A ---")
    r_login_a = requests.post(f"{base_url}/auth/login", json={
        "email": email_a,
        "password": "passwordA123"
    })
    assert r_login_a.status_code == 200
    token_a = r_login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    print("--- 3. REGISTERING USER B ---")
    email_b = f"userb_{uuid.uuid4().hex[:6]}@example.com"
    r_reg_b = requests.post(f"{base_url}/auth/register", json={
        "name": "User B",
        "email": email_b,
        "password": "passwordB123",
        "role": "USER"
    })
    assert r_reg_b.status_code == 200
    
    print("--- 4. LOGGING IN USER B ---")
    r_login_b = requests.post(f"{base_url}/auth/login", json={
        "email": email_b,
        "password": "passwordB123"
    })
    assert r_login_b.status_code == 200
    token_b = r_login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Verify no memories initially for both
    r_mems_a = requests.get(f"{base_url}/memories", headers=headers_a)
    assert r_mems_a.status_code == 200
    assert r_mems_a.json()["count"] == 0

    r_mems_b = requests.get(f"{base_url}/memories", headers=headers_b)
    assert r_mems_b.status_code == 200
    assert r_mems_b.json()["count"] == 0

    print("--- 5. USER A SAVES MEMORY ---")
    private_memory_a = "Secret code of A is ALPHA-99"
    r_create_a = requests.post(f"{base_url}/memories", json={
        "type": "preference",
        "content": private_memory_a
    }, headers=headers_a)
    assert r_create_a.status_code == 200

    print("--- 6. USER B ATTEMPTS TO GET USER A'S MEMORY ---")
    # Get all memories for User B
    r_mems_b_after = requests.get(f"{base_url}/memories", headers=headers_b)
    assert r_mems_b_after.status_code == 200
    mems_b = r_mems_b_after.json()["memories"]
    
    # Assert User A's memory is NOT in User B's list
    for item in mems_b:
        assert private_memory_a not in item["content"], "LEAK DETECTED: User B can see User A's memory content!"
    print("Success: User B has no access to User A's memories.")

    # Search query
    r_search_b = requests.post(f"{base_url}/chat", json={
        "message": "What is the secret code of A?"
    }, headers=headers_b)
    assert r_search_b.status_code == 200
    reply_b = r_search_b.json()["reply"]
    print(f"Agent reply to User B: {reply_b}")
    assert "ALPHA-99" not in reply_b, "LEAK DETECTED: Agent used User A's memory to reply to User B!"
    print("Success: Agent did not leak User A's memory to User B in chat.")

    print("\n--- MULTI-USER ISOLATION VERIFIED SUCCESSFULLY ---")

if __name__ == "__main__":
    run_multi_user_test()

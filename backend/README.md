# MemoryForge AI Engineer Backend

MemoryForge AI Engineer is a modular, production-ready backend showing how to construct an AI software engineer with persistent context retrieval and local memory storage. It is built using Python FastAPI, Pydantic, and Groq API.

## Project Structure

```
backend/
├── app.py           # FastAPI Application Entrypoint
├── agent.py         # Conversation & Memory Retrieval Orchestrator
├── memory.py        # Local Ephemeral Memory Store (Future Parcle Integration)
├── tools.py         # Safe File Operation Utilities
├── models.py        # Pydantic Schemas & Types
├── config.py        # Configuration Validator
├── groq_client.py   # Groq API Client Setup (llama-3.3-70b-versatile)
├── .env.example     # Environment Template
├── requirements.txt # Python Dependencies
└── README.md        # Instructions & Documentation
```

---

## Getting Started

### 1. Clone the Project
Navigate to the project root:
```bash
cd backend
```

### 2. Create and Activate Virtual Environment

**Windows (Command Prompt / PowerShell):**
```cmd
python -m venv venv
venv\Scripts\activate
```

**Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Setup Environment Variables
Create a `.env` file in the `backend/` directory by copying `.env.example`:
```bash
cp .env.example .env
```
Fill in your credentials:
```ini
GROQ_API_KEY=your_groq_api_key_here
PARCLE_API_KEY=your_parcle_api_key_here # Provide a dummy key if not using Parcle yet
```

### 5. Run the Server
Launch the local Uvicorn development server:
```bash
uvicorn app:app --reload
```

---

## API Testing

Once the server has successfully started, you can access the following urls:

- **Health Status**: [http://localhost:8000/health](http://localhost:8000/health)
- **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Example `/chat` Payload
You can send POST requests to [http://localhost:8000/chat](http://localhost:8000/chat) with:
```json
{
  "message": "Create a login system using the database"
}
```
Because the memory database is initialized with:
`{"type": "architecture", "content": "Use MongoDB Atlas"}`

The output from the LLM will automatically retrieve and incorporate MongoDB reasoning into the proposed login system implementation plan.

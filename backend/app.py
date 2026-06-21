# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, Request, Depends, File, UploadFile, status
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
import jwt
from datetime import datetime
from typing import List, Optional

# Local imports
import config
import mongodb
import auth
import parcle_client
import file_parsers
import knowledge_extractor
from models import (
    ChatRequest, 
    ChatResponse, 
    MemoryItem, 
    MemoriesResponse, 
    UserRegister, 
    UserLogin, 
    UserResponse, 
    TokenResponse,
    KnowledgeItem,
    KnowledgeResponse
)
from memory import get_all_memories, save_memory, search_memory

# Set up logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("memoryforge_backend")

# Initialize FastAPI application
app = FastAPI(
    title="MemoryForge AI Engineer Backend",
    description="Multi-user Knowledge platform with MongoDB Atlas + Parcle memory.",
    version="2.0.0"
)

# Add CORS Middleware to enable communication with standard web frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional Bearer security helper to support logged-in or default users
security_optional = HTTPBearer(auto_error=False)

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
        email = payload.get("sub")
        if email:
            return mongodb.db.users.find_one({"email": email})
    except Exception:
        pass
    return None

# Global exception handler for unanticipated server errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"An internal server error occurred: {str(exc)}"}
    )

@app.get("/health")
async def health():
    """
    Health check endpoint to ensure services are responsive.
    """
    return {
        "status": "ok",
        "service": "MemoryForge AI Engineer",
        "database": "mock_fallback" if mongodb.is_fallback else "mongodb_atlas"
    }

# --- Authentication & Users ---

@app.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserRegister):
    """
    Registers a new user (USER or ADMIN) and hashes their password.
    """
    logger.info("[REGISTER REQUEST] Incoming registration request received.")
    try:
        # Request body log
        logger.info(f"[REQUEST BODY] Name: {user_data.name}, Email: {user_data.email}, Role: {user_data.role}")
        
        # Pydantic validation passed (FastAPI did this on entry)
        logger.info("[VALIDATION PASSED] Request data successfully validated against Pydantic schema.")
        
        # User exists check
        logger.info(f"[USER EXISTS CHECK] Checking if user with email {user_data.email} exists.")
        
        db_name = getattr(mongodb.db, "name", "mock_db")
        collection_name = "users"
        logger.info(f"Database name: {db_name}")
        logger.info(f"Collection name: {collection_name}")
        
        existing_user = mongodb.db.users.find_one({"email": user_data.email})
        if existing_user:
            logger.warning(f"[REGISTER ERROR] Email {user_data.email} is already registered.")
            raise HTTPException(status_code=400, detail="Email is already registered.")
        
        hashed_pwd = auth.hash_password(user_data.password)
        user_doc = {
            "name": user_data.name,
            "email": user_data.email,
            "password": hashed_pwd,
            "role": user_data.role.upper() if user_data.role else "USER",
            "created_at": datetime.utcnow()
        }
        
        # Saving user
        logger.info(f"[SAVING USER] Inserting document for {user_doc['email']} into collection '{collection_name}' in database '{db_name}'.")
        result = mongodb.db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        logger.info(f"Insert result inserted_id: {user_id}")
        logger.info("[USER SAVED] Successfully saved user to database.")
        
        # Query MongoDB immediately and verify the user exists
        logger.info(f"[VERIFICATION] Querying database immediately for {user_doc['email']} to verify persistence.")
        verified_user = mongodb.db.users.find_one({"email": user_doc["email"]})
        if verified_user:
            logger.info(f"[VERIFICATION SUCCESS] User verified in database. Document ID: {verified_user.get('_id')}")
        else:
            logger.error(f"[VERIFICATION FAILED] User {user_doc['email']} could NOT be retrieved immediately after saving.")
            
        return UserResponse(
            id=user_id,
            name=user_doc["name"],
            email=user_doc["email"],
            role=user_doc["role"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[REGISTER ERROR] Exception during registration: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    Verifies login credentials and issues a JWT token.
    """
    user = mongodb.db.users.find_one({"email": credentials.email})
    if not user or not auth.verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    token = auth.create_access_token(data={"sub": user["email"]})
    user_id = str(user["_id"])
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            name=user["name"],
            email=user["email"],
            role=user["role"]
        )
    )

@app.get("/auth/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(auth.get_current_user)):
    """
    Returns profile information for the authenticated user.
    """
    user_id = str(current_user["_id"])
    return UserResponse(
        id=user_id,
        name=current_user["name"],
        email=current_user["email"],
        role=current_user["role"]
    )

@app.get("/users", response_model=List[UserResponse])
async def get_users(admin_user: dict = Depends(auth.get_admin_user)):
    """
    Protected Admin endpoint: lists all registered users.
    """
    db_users = mongodb.db.users.find()
    result = []
    for u in db_users:
        result.append(UserResponse(
            id=str(u["_id"]),
            name=u["name"],
            email=u["email"],
            role=u["role"]
        ))
    return result

# --- Memories API ---

@app.get("/memories", response_model=MemoriesResponse)
async def memories(current_user: Optional[dict] = Depends(get_optional_user)):
    """
    Retrieves all persistent memories from MongoDB / Parcle.
    """
    user_id = str(current_user["_id"]) if current_user else "default_user"
    try:
        items = get_all_memories(user_id=user_id)
        return MemoriesResponse(count=len(items), memories=items)
    except Exception as e:
        logger.error(f"Failed to fetch memories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/memories", response_model=MemoryItem)
async def create_memory(memory: MemoryItem, current_user: Optional[dict] = Depends(get_optional_user)):
    """
    Saves a memory in both MongoDB and Parcle under the caller's space.
    """
    user_id = str(current_user["_id"]) if current_user else "default_user"
    try:
        return save_memory(memory.type, memory.content, user_id=user_id)
    except Exception as e:
        logger.error(f"Failed to create memory: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Knowledge Base API ---

@app.post("/knowledge", response_model=KnowledgeItem)
async def create_knowledge(item: KnowledgeItem, current_user: Optional[dict] = Depends(get_optional_user)):
    """
    Adds a knowledge record in MongoDB Atlas and optionally registers search vectors in Parcle.
    """
    user_id = str(current_user["_id"]) if current_user else "default_user"
    try:
        knowledge_doc = {
            "title": item.title,
            "content": item.content,
            "user_id": user_id,
            "timestamp": datetime.utcnow()
        }
        res = mongodb.db.knowledge_base.insert_one(knowledge_doc)
        item_id = str(res.inserted_id)
        
        # Save to Parcle to ensure semantic keyword matching references this knowledge
        try:
            parcle_client.save_to_parcle(user_id, "knowledge", f"Title: {item.title}\nContent: {item.content}")
        except Exception as pe:
            logger.warning(f"Failed to index knowledge in Parcle: {str(pe)}")
            
        return KnowledgeItem(id=item_id, title=item.title, content=item.content)
    except Exception as e:
        logger.error(f"Failed to save knowledge: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/knowledge", response_model=KnowledgeResponse)
async def list_knowledge(current_user: Optional[dict] = Depends(get_optional_user)):
    """
    Lists knowledge documents.
    """
    user_id = str(current_user["_id"]) if current_user else "default_user"
    try:
        db_items = mongodb.db.knowledge_base.find({"user_id": user_id})
        knowledge = []
        for doc in db_items:
            knowledge.append(KnowledgeItem(
                id=str(doc["_id"]),
                title=doc["title"],
                content=doc["content"]
            ))
        return KnowledgeResponse(count=len(knowledge), knowledge=knowledge)
    except Exception as e:
        logger.error(f"Failed to list knowledge: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Document Upload API ---

@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """
    Uploads a txt, md, readme, pdf document, saves metadata in Atlas and indexes into Parcle memory.
    """
    user_id = str(current_user["_id"]) if current_user else "default_user"
    try:
        content_bytes = await file.read()
        filename = file.filename
        content_type = file.content_type or "text/plain"
        
        content_text = ""
        if content_type.startswith("text/") or filename.endswith((".txt", ".md", ".json", "README")):
            try:
                content_text = content_bytes.decode('utf-8')
            except Exception:
                content_text = "[Binary Content]"
        else:
            content_text = "[Uploaded File]"
            
        # Store metadata in MongoDB Atlas documents
        doc_metadata = {
            "filename": filename,
            "content_type": content_type,
            "size": len(content_bytes),
            "user_id": user_id,
            "timestamp": datetime.utcnow()
        }
        res = mongodb.db.documents.insert_one(doc_metadata)
        doc_id = str(res.inserted_id)
        
        # Save to Knowledge Base as well for simple text viewing
        mongodb.db.knowledge_base.insert_one({
            "title": f"Document: {filename}",
            "content": content_text[:10000] if content_text else f"Uploaded document {filename}",
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "document_id": doc_id
        })
        
        # Ingest file into Parcle
        try:
            parcle_client.ingest_file_to_parcle(user_id, filename, content_bytes, content_type)
        except Exception as pe:
            logger.warning(f"Failed to index file in Parcle: {str(pe)}")
            
        return {
            "status": "success",
            "message": f"Successfully uploaded and indexed {filename}",
            "document_id": doc_id
        }
    except Exception as e:
        logger.error(f"Failed to upload document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Chat & Chat History API ---

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user: Optional[dict] = Depends(get_optional_user)):
    """
    Processes chat prompts with multi-user workspace retrieval.
    Stores interaction history in MongoDB.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")
        
    user_id = str(current_user["_id"]) if current_user else "default_user"
    try:
        # Search relevant memory context (which triggers analytics tracking)
        relevant_memories = search_memory(request.message, user_id=user_id)
        
        # Generate completion response via Groq
        from groq_client import generate_response
        reply = generate_response(request.message, relevant_memories)
        
        # Save chat log in MongoDB Atlas
        try:
            mongodb.db.chat_history.insert_one({
                "user_id": user_id,
                "message": request.message,
                "reply": reply,
                "timestamp": datetime.utcnow()
            })
        except Exception as db_err:
            logger.error(f"Failed to save chat log: {str(db_err)}")
            
        # Ingest the user interaction as conversation memory
        interaction_summary = f"User query: '{request.message}' | Response: '{reply}'"
        save_memory(memory_type="conversation", content=interaction_summary, user_id=user_id)
        
        return ChatResponse(reply=reply, memory_context=relevant_memories)
    except Exception as e:
        logger.error(f"Internal chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/history")
async def chat_history(current_user: Optional[dict] = Depends(get_optional_user)):
    """
    Retrieves previous dialogue history from MongoDB Atlas.
    """
    user_id = str(current_user["_id"]) if current_user else "default_user"
    try:
        cursor = mongodb.db.chat_history.find({"user_id": user_id}).sort("timestamp", 1)
        history = []
        for doc in cursor:
            history.append({
                "id": str(doc["_id"]),
                "message": doc["message"],
                "reply": doc["reply"],
                "timestamp": doc["timestamp"].isoformat() if isinstance(doc.get("timestamp"), datetime) else doc.get("timestamp")
            })
        return history
    except Exception as e:
        logger.error(f"Failed to fetch chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Analytics API ---

@app.get("/analytics")
async def get_analytics(current_user: Optional[dict] = Depends(get_optional_user)):
    """
    Returns analytics widgets containing user roles, database document sizes, memory categories, and top search topics.
    """
    try:
        total_users = mongodb.db.users.count_documents({})
        total_memories = mongodb.db.memories.count_documents({})
        total_chats = mongodb.db.chat_history.count_documents({})
        total_knowledge = mongodb.db.knowledge_base.count_documents({})
        
        # Ingest files metrics
        total_files = mongodb.db.uploaded_files.count_documents({})
        total_projects = mongodb.db.uploaded_files.count_documents({"file_type": "project"})
        
        # Memory retrieval count
        retrieval_doc = mongodb.db.analytics.find_one({"metric": "memory_retrieval_count"})
        retrieval_count = retrieval_doc.get("value", 0) if retrieval_doc else 0
        
        # Most queried topics
        topic_cursor = mongodb.db.analytics.find({"metric": "topic_query"})
        topic_list = []
        for t in topic_cursor:
            topic_list.append({
                "topic": t.get("topic", "unknown"),
                "count": t.get("value", 0)
            })
        topic_list = sorted(topic_list, key=lambda x: x["count"], reverse=True)[:5]
        
        # User roles aggregation
        admin_count = mongodb.db.users.count_documents({"role": "ADMIN"})
        regular_user_count = mongodb.db.users.count_documents({"role": "USER"})
        
        # Category breakdown of memories
        categories = ["architecture", "coding_standard", "bug_fix", "team_preference", "conversation"]
        category_breakdown = {}
        for cat in categories:
            category_breakdown[cat] = mongodb.db.memories.count_documents({"type": cat})
            
        return {
            "total_users": total_users,
            "total_memories": total_memories,
            "total_chats": total_chats,
            "memory_retrieval_count": retrieval_count,
            "total_knowledge_documents": total_knowledge,
            "most_queried_topics": topic_list,
            "roles": {
                "ADMIN": admin_count,
                "USER": regular_user_count
            },
            "memory_categories": category_breakdown,
            "total_files_uploaded": total_files,
            "total_projects_analyzed": total_projects,
            "queries_answered": total_chats,
            "knowledge_items_generated": total_knowledge + total_files
        }
    except Exception as e:
        logger.error(f"Failed to fetch analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# --- File & Project Knowledge Ingestion API ---

@app.post("/upload/file")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(auth.get_current_user)
):
    """
    Accepts a single document or source code file, parses text,
    analyzes with Groq, saves structured findings in Atlas, and
    saves generated memories to MongoDB and Parcle.
    """
    user_id = str(current_user["_id"])
    filename = file.filename
    content_bytes = await file.read()
    file_size = len(content_bytes)
    
    # 1. Parse text based on extension
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    content_text = ""
    
    try:
        if ext == "pdf":
            content_text = file_parsers.parse_pdf(content_bytes)
        elif ext == "docx":
            content_text = file_parsers.parse_docx(content_bytes)
        else:
            # Try plain text decoding
            try:
                content_text = content_bytes.decode("utf-8", errors="ignore")
            except Exception:
                content_text = f"[Binary Content: Extension {ext}]"
                
        if not content_text.strip():
            content_text = f"Empty content parsed from {filename}"
            
        # 2. Extract structured knowledge using Groq LLM
        analysis = knowledge_extractor.extract_structured_knowledge(filename, content_text, "document")
        
        # 3. Save to MongoDB 'uploaded_files'
        file_doc = {
            "filename": filename,
            "file_type": ext,
            "size": file_size,
            "user_id": user_id,
            "timestamp": datetime.utcnow()
        }
        res_file = mongodb.db.uploaded_files.insert_one(file_doc)
        file_id = str(res_file.inserted_id)
        
        # 4. Save to 'file_summaries'
        mongodb.db.file_summaries.insert_one({
            "file_id": file_id,
            "user_id": user_id,
            "summary": analysis.get("summary", ""),
            "timestamp": datetime.utcnow()
        })
        
        # 5. Save to 'project_analysis'
        mongodb.db.project_analysis.insert_one({
            "file_id": file_id,
            "user_id": user_id,
            "technologies": analysis.get("technologies", []),
            "architecture": analysis.get("architecture", "Unknown"),
            "decisions": analysis.get("decisions", []),
            "dependencies": analysis.get("dependencies", []),
            "security_findings": analysis.get("security_findings", []),
            "timestamp": datetime.utcnow()
        })
        
        # 6. Save to 'knowledge_base'
        mongodb.db.knowledge_base.insert_one({
            "title": f"Document: {filename}",
            "content": content_text[:10000],
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "file_id": file_id
        })
        
        # 7. Ingest memory items
        saved_memories = []
        for mem in analysis.get("memories", []):
            try:
                item = save_memory(mem.get("type", "architecture"), mem.get("content", ""), user_id=user_id)
                saved_memories.append(item)
            except Exception as mem_err:
                logger.error(f"Failed to ingest memory during upload: {str(mem_err)}")
                
        return {
            "file_id": file_id,
            "filename": filename,
            "size": file_size,
            "analysis": analysis,
            "memories_created_count": len(saved_memories)
        }
        
    except Exception as e:
        logger.error(f"Failed to upload document file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(auth.get_current_user)
):
    """
    Accepts an image file, runs OCR text extraction, analyzes with Groq,
    and indexes findings and memories.
    """
    user_id = str(current_user["_id"])
    filename = file.filename
    content_bytes = await file.read()
    file_size = len(content_bytes)
    
    try:
        # 1. Parse Image OCR content
        ocr_result = file_parsers.parse_image_ocr(content_bytes, filename)
        
        # 2. Check if OCR text extraction failed or was unavailable
        if ocr_result.get("status") == "partial_success":
            # Save metadata of uploaded file to uploaded_files
            file_doc = {
                "filename": filename,
                "file_type": "image",
                "size": file_size,
                "user_id": user_id,
                "timestamp": datetime.utcnow()
            }
            res_file = mongodb.db.uploaded_files.insert_one(file_doc)
            file_id = str(res_file.inserted_id)
            
            # Save friendly text summaries
            mongodb.db.file_summaries.insert_one({
                "file_id": file_id,
                "user_id": user_id,
                "summary": ocr_result["summary"],
                "timestamp": datetime.utcnow()
            })
            
            # Save empty project_analysis to support metadata queries
            mongodb.db.project_analysis.insert_one({
                "file_id": file_id,
                "user_id": user_id,
                "technologies": [],
                "architecture": "Unknown",
                "decisions": [],
                "dependencies": [],
                "security_findings": [],
                "timestamp": datetime.utcnow()
            })

            # Save empty knowledge base record
            mongodb.db.knowledge_base.insert_one({
                "title": f"Image Diagram: {filename}",
                "content": ocr_result["analysis"],
                "user_id": user_id,
                "timestamp": datetime.utcnow(),
                "file_id": file_id
            })

            return {
                "summary": ocr_result["summary"],
                "analysis": ocr_result["analysis"],
                "memories_created": [],
                "status": "partial_success",
                "file_id": file_id,
                "filename": filename,
                "size": file_size
            }
        
        # 3. Successful OCR extraction
        ocr_content = ocr_result.get("text", "")
        
        # 4. Extract structured knowledge using Groq LLM
        analysis = knowledge_extractor.extract_structured_knowledge(filename, ocr_content, "image")
        
        # 5. Save to MongoDB 'uploaded_files'
        file_doc = {
            "filename": filename,
            "file_type": "image",
            "size": file_size,
            "user_id": user_id,
            "timestamp": datetime.utcnow()
        }
        res_file = mongodb.db.uploaded_files.insert_one(file_doc)
        file_id = str(res_file.inserted_id)
        
        # 6. Save summaries and analysis details
        mongodb.db.file_summaries.insert_one({
            "file_id": file_id,
            "user_id": user_id,
            "summary": analysis.get("summary", ""),
            "timestamp": datetime.utcnow()
        })
        
        mongodb.db.project_analysis.insert_one({
            "file_id": file_id,
            "user_id": user_id,
            "technologies": analysis.get("technologies", []),
            "architecture": analysis.get("architecture", "Unknown"),
            "decisions": analysis.get("decisions", []),
            "dependencies": analysis.get("dependencies", []),
            "security_findings": analysis.get("security_findings", []),
            "timestamp": datetime.utcnow()
        })
        
        mongodb.db.knowledge_base.insert_one({
            "title": f"Image Diagram: {filename}",
            "content": ocr_content[:10000],
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "file_id": file_id
        })
        
        # 7. Ingest memories
        saved_memories = []
        for mem in analysis.get("memories", []):
            try:
                item = save_memory(mem.get("type", "architecture"), mem.get("content", ""), user_id=user_id)
                saved_memories.append(item)
            except Exception as mem_err:
                logger.error(f"Failed to ingest memory from image: {str(mem_err)}")
                
        return {
            "file_id": file_id,
            "filename": filename,
            "size": file_size,
            "analysis": analysis,
            "memories_created_count": len(saved_memories),
            "extracted_text": ocr_content,
            "summary": analysis.get("summary", ""),
            "technologies_detected": analysis.get("technologies", []),
            "memories_generated": analysis.get("memories", [])
        }
    except Exception as e:
        logger.error(f"Failed to ingest image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/project")
async def upload_project(
    file: UploadFile = File(...),
    current_user: dict = Depends(auth.get_current_user)
):
    """
    Accepts a project ZIP archive, unpacks structure and code, analyzes with Groq,
    and registers project analysis metadata and memories.
    """
    user_id = str(current_user["_id"])
    filename = file.filename
    content_bytes = await file.read()
    file_size = len(content_bytes)
    
    try:
        # 1. Parse ZIP file contents
        zip_content = file_parsers.parse_project_zip(content_bytes)
        
        # 2. Extract structured knowledge using Groq LLM
        analysis = knowledge_extractor.extract_structured_knowledge(filename, zip_content, "project")
        
        # 3. Save to MongoDB 'uploaded_files'
        file_doc = {
            "filename": filename,
            "file_type": "project",
            "size": file_size,
            "user_id": user_id,
            "timestamp": datetime.utcnow()
        }
        res_file = mongodb.db.uploaded_files.insert_one(file_doc)
        file_id = str(res_file.inserted_id)
        
        # 4. Save metadata tables
        mongodb.db.file_summaries.insert_one({
            "file_id": file_id,
            "user_id": user_id,
            "summary": analysis.get("summary", ""),
            "timestamp": datetime.utcnow()
        })
        
        mongodb.db.project_analysis.insert_one({
            "file_id": file_id,
            "user_id": user_id,
            "technologies": analysis.get("technologies", []),
            "architecture": analysis.get("architecture", "Unknown"),
            "decisions": analysis.get("decisions", []),
            "dependencies": analysis.get("dependencies", []),
            "security_findings": analysis.get("security_findings", []),
            "timestamp": datetime.utcnow()
        })
        
        mongodb.db.knowledge_base.insert_one({
            "title": f"Project Archive: {filename}",
            "content": f"Ingested ZIP structure and configuration contents for {filename}",
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "file_id": file_id
        })
        
        # 5. Ingest memories
        saved_memories = []
        for mem in analysis.get("memories", []):
            try:
                item = save_memory(mem.get("type", "architecture"), mem.get("content", ""), user_id=user_id)
                saved_memories.append(item)
            except Exception as mem_err:
                logger.error(f"Failed to ingest memory from project ZIP: {str(mem_err)}")
                
        return {
            "file_id": file_id,
            "filename": filename,
            "size": file_size,
            "analysis": analysis,
            "memories_created_count": len(saved_memories)
        }
    except Exception as e:
        logger.error(f"Failed to ingest project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/knowledge/search")
async def search_knowledge(
    query: str,
    current_user: dict = Depends(auth.get_current_user)
):
    """
    Searches matching items inside knowledge_base and file_summaries.
    """
    user_id = str(current_user["_id"])
    if not query.strip():
        return []
        
    try:
        query_regex = {"$regex": query, "$options": "i"}
        
        # Search summaries and knowledge docs
        cursor_kb = mongodb.db.knowledge_base.find({
            "user_id": user_id,
            "$or": [
                {"title": query_regex},
                {"content": query_regex}
            ]
        })
        
        results = []
        for doc in cursor_kb:
            results.append({
                "type": "document",
                "id": str(doc["_id"]),
                "title": doc.get("title", ""),
                "content_preview": doc.get("content", "")[:300] + ("..." if len(doc.get("content", "")) > 300 else ""),
                "timestamp": doc.get("timestamp").isoformat() if isinstance(doc.get("timestamp"), datetime) else doc.get("timestamp")
            })
            
        return results
    except Exception as e:
        logger.error(f"Failed to search knowledge base: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/knowledge/history")
async def get_knowledge_history(
    current_user: dict = Depends(auth.get_current_user)
):
    """
    Lists uploaded files metadata and attaches their generated summaries and project findings.
    """
    user_id = str(current_user["_id"])
    try:
        files = list(mongodb.db.uploaded_files.find({"user_id": user_id}).sort("timestamp", -1))
        
        history = []
        for f in files:
            file_id = str(f["_id"])
            summary_doc = mongodb.db.file_summaries.find_one({"file_id": file_id})
            analysis_doc = mongodb.db.project_analysis.find_one({"file_id": file_id})
            
            history.append({
                "file_id": file_id,
                "filename": f.get("filename", ""),
                "file_type": f.get("file_type", ""),
                "size": f.get("size", 0),
                "timestamp": f.get("timestamp").isoformat() if isinstance(f.get("timestamp"), datetime) else f.get("timestamp"),
                "summary": summary_doc.get("summary", "") if summary_doc else "No summary generated.",
                "analysis": {
                    "technologies": analysis_doc.get("technologies", []) if analysis_doc else [],
                    "architecture": analysis_doc.get("architecture", "Unknown") if analysis_doc else "Unknown",
                    "decisions": analysis_doc.get("decisions", []) if analysis_doc else [],
                    "dependencies": analysis_doc.get("dependencies", []) if analysis_doc else [],
                    "security_findings": analysis_doc.get("security_findings", []) if analysis_doc else []
                }
            })
        return history
    except Exception as e:
        logger.error(f"Failed to retrieve knowledge history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

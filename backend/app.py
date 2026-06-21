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


def get_user_workspace_root_for_request(user_id: str) -> str:
    """
    Uses the latest uploaded project location for the user when available,
    otherwise falls back to a generated per-user default workspace.
    """
    from tools import get_user_project_root

    latest_upload = mongodb.db.uploaded_files.find_one(
        {"user_id": user_id},
        sort=[("timestamp", -1)]
    )
    if latest_upload and latest_upload.get("project_root"):
        return latest_upload["project_root"]
    return get_user_project_root(user_id)

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

# Local imports
import config
import mongodb
import auth
import parcle_client
import file_parsers
import knowledge_extractor
import vision_analyzer


@app.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(auth.get_current_user)
):
    """
    Accepts an image file, runs Vision AI image intelligence extraction,
    applies rule-based context memory, indexes memories in Parcle,
    and stores details in the generic knowledge_base collection.
    """
    logger.info("[VISION START] Received image upload request.")
    user_id = str(current_user["_id"])
    filename = file.filename
    content_bytes = await file.read()
    file_size = len(content_bytes)
    
    try:
        # 1. Run Vision AI analyzer
        analysis = vision_analyzer.analyze_image(content_bytes, filename)
        logger.info("[VISION SUCCESS] Vision AI analysis complete.")
        
        summary = analysis.get("summary", "")
        technologies_detected = analysis.get("technologies_detected", [])
        architecture_patterns = analysis.get("architecture_patterns", [])
        components_detected = analysis.get("components_detected", [])
        security_findings = analysis.get("security_findings", [])
        recommendations = analysis.get("recommendations", [])
        memories_created = analysis.get("memories_created", [])
        
        # 2. Check rule-based memories based on vision results content
        rule_memories = []
        vision_text = (
            str(technologies_detected) + " " +
            summary + " " +
            str(components_detected) + " " +
            str(architecture_patterns)
        ).upper()
        
        if "MONGODB" in vision_text:
            rule_memories.append({"type": "architecture", "content": "Project uses MongoDB"})
        if "JWT" in vision_text:
            rule_memories.append({"type": "authentication", "content": "Uses JWT Authentication"})
        if "REACT" in vision_text:
            rule_memories.append({"type": "frontend", "content": "React Frontend Detected"})

        # 3. Save memories (AI-generated and rule-based) under authenticated space
        saved_memories = []
        for mem in memories_created:
            try:
                item = save_memory(mem.get("type", "architecture"), mem.get("content", ""), user_id=user_id)
                saved_memories.append({"type": item.type, "content": item.content})
            except Exception as mem_err:
                logger.error(f"Failed to ingest Vision AI memory: {str(mem_err)}")
                
        for rm in rule_memories:
            try:
                # Avoid duplicates
                if not any(m["content"].lower() == rm["content"].lower() for m in saved_memories):
                    item = save_memory(rm["type"], rm["content"], user_id=user_id)
                    saved_memories.append({"type": item.type, "content": item.content})
            except Exception as mem_err:
                logger.error(f"Failed to save rule-based memory: {str(mem_err)}")

        logger.info("[VISION MEMORY GENERATED] Ingested vision-generated memories.")
        logger.info("[PARCLE SAVE] Memories successfully pushed to Parcle index.")

        # 4. Save metadata to uploaded_files (backward compatibility)
        file_doc = {
            "filename": filename,
            "file_type": "image",
            "size": file_size,
            "user_id": user_id,
            "timestamp": datetime.utcnow()
        }
        res_file = mongodb.db.uploaded_files.insert_one(file_doc)
        file_id = str(res_file.inserted_id)
        
        mongodb.db.file_summaries.insert_one({
            "file_id": file_id,
            "user_id": user_id,
            "summary": summary,
            "timestamp": datetime.utcnow()
        })
        
        mongodb.db.project_analysis.insert_one({
            "file_id": file_id,
            "user_id": user_id,
            "technologies": technologies_detected,
            "architecture": architecture_patterns[0] if architecture_patterns else "Unknown",
            "decisions": recommendations,
            "dependencies": [],
            "security_findings": security_findings,
            "timestamp": datetime.utcnow()
        })

        # 5. Save to generic 'knowledge_base' collection with source attribution
        knowledge_doc = {
            "type": "image",
            "user_id": user_id,
            "filename": filename,
            "size": file_size,
            "upload_date": datetime.utcnow(),
            "timestamp": datetime.utcnow(),
            "title": f"Image Analysis: {filename}",
            "content": summary,
            "summary": summary,
            "technologies": technologies_detected,
            "architecture": architecture_patterns,
            "components_detected": components_detected,
            "security_findings": security_findings,
            "recommendations": recommendations,
            "generated_memories": saved_memories,
            "vision_provider": config.VISION_PROVIDER,
            "file_id": file_id
        }
        mongodb.db.knowledge_base.insert_one(knowledge_doc)
        logger.info("[MONGODB SAVE] Vision AI results saved to generic knowledge_base collection.")
        logger.info("[VISION COMPLETE] Image intelligence ingestion complete.")

        return {
            "status": "success",
            "filename": filename,
            "summary": summary,
            "technologies_detected": technologies_detected,
            "architecture_patterns": architecture_patterns,
            "components_detected": components_detected,
            "security_findings": security_findings,
            "recommendations": recommendations,
            "memories_created": saved_memories,
            "file_id": file_id,
            "size": file_size
        }

    except Exception as e:
        logger.error(f"[VISION ERROR] Vision AI pipeline failed: {str(e)}")
        # Save fallback details to database
        try:
            file_doc = {
                "filename": filename,
                "file_type": "image",
                "size": file_size,
                "user_id": user_id,
                "timestamp": datetime.utcnow()
            }
            res_file = mongodb.db.uploaded_files.insert_one(file_doc)
            file_id = str(res_file.inserted_id)
            
            mongodb.db.file_summaries.insert_one({
                "file_id": file_id,
                "user_id": user_id,
                "summary": "Image uploaded successfully.",
                "timestamp": datetime.utcnow()
            })
            
            # Save fallback to generic knowledge_base collection
            knowledge_doc = {
                "type": "image",
                "user_id": user_id,
                "filename": filename,
                "size": file_size,
                "upload_date": datetime.utcnow(),
                "timestamp": datetime.utcnow(),
                "title": f"Image Analysis: {filename}",
                "content": "Vision analysis unavailable.",
                "summary": "Image uploaded successfully.",
                "technologies": [],
                "architecture": [],
                "components_detected": [],
                "security_findings": [],
                "recommendations": [],
                "generated_memories": [],
                "vision_provider": config.VISION_PROVIDER,
                "file_id": file_id,
                "status": "partial_success"
            }
            mongodb.db.knowledge_base.insert_one(knowledge_doc)
        except Exception as db_err:
            logger.error(f"Failed to save fallback metadata to MongoDB: {str(db_err)}")
            file_id = "fallback_mock_id"
            
        return {
            "status": "partial_success",
            "filename": filename,
            "summary": "Image uploaded successfully.",
            "analysis": "Vision analysis unavailable.",
            "technologies_detected": [],
            "architecture_patterns": [],
            "components_detected": [],
            "security_findings": [],
            "recommendations": [],
            "memories_created": [],
            "file_id": file_id,
            "size": file_size
        }



@app.get("/knowledge/images")
async def get_knowledge_images(current_user: dict = Depends(auth.get_current_user)):
    """
    Returns previous image analyses for the authenticated user.
    """
    user_id = str(current_user["_id"])
    try:
        cursor = mongodb.db.knowledge_base.find({"user_id": user_id, "type": "image"}).sort("timestamp", -1)
        results = []
        for doc in cursor:
            results.append({
                "id": str(doc["_id"]),
                "filename": doc.get("filename", "unknown.png"),
                "size": doc.get("size", 0),
                "upload_date": doc.get("upload_date").isoformat() if isinstance(doc.get("upload_date"), datetime) else doc.get("upload_date"),
                "summary": doc.get("summary", ""),
                "technologies_detected": doc.get("technologies", []),
                "architecture_patterns": doc.get("architecture", []),
                "components_detected": doc.get("components_detected", []),
                "security_findings": doc.get("security_findings", []),
                "recommendations": doc.get("recommendations", []),
                "memories_created": doc.get("generated_memories", []),
                "vision_provider": doc.get("vision_provider", "gemini")
            })
        return results
    except Exception as e:
        logger.error(f"Failed to fetch previous image analyses: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/knowledge/image/{id}")
async def get_knowledge_image(id: str, current_user: dict = Depends(auth.get_current_user)):
    """
    Returns full details of a specific image analysis.
    """
    user_id = str(current_user["_id"])
    from bson import ObjectId
    query = {"user_id": user_id, "type": "image"}
    doc = None
    try:
        query["_id"] = ObjectId(id)
        doc = mongodb.db.knowledge_base.find_one(query)
        if not doc:
            query["_id"] = id
            doc = mongodb.db.knowledge_base.find_one(query)
    except Exception:
        query["_id"] = id
        doc = mongodb.db.knowledge_base.find_one(query)
        
    if not doc:
        raise HTTPException(status_code=404, detail="Image analysis record not found.")
        
    return {
        "id": str(doc["_id"]),
        "filename": doc.get("filename", ""),
        "size": doc.get("size", 0),
        "upload_date": doc.get("upload_date").isoformat() if isinstance(doc.get("upload_date"), datetime) else doc.get("upload_date"),
        "summary": doc.get("summary", ""),
        "technologies_detected": doc.get("technologies", []),
        "architecture_patterns": doc.get("architecture", []),
        "components_detected": doc.get("components_detected", []),
        "security_findings": doc.get("security_findings", []),
        "recommendations": doc.get("recommendations", []),
        "memories_created": doc.get("generated_memories", []),
        "vision_provider": doc.get("vision_provider", "gemini")
    }


@app.post("/upload/project")
async def upload_project(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(auth.get_current_user)
):
    """
    Accepts one or more uploaded project files/folders and stores them in a per-user workspace.
    ZIP archives are unpacked so the agent APIs can read and edit them directly.
    """
    if not files:
        raise HTTPException(status_code=400, detail="At least one file must be uploaded.")

    user_id = str(current_user["_id"])
    from tools import get_user_project_root

    # Determine a project name from the first upload so each user gets a dedicated workspace.
    first_filename = files[0].filename or "project"
    first_name = Path(first_filename).name
    project_name = Path(first_name).stem if first_name.lower().endswith(".zip") else first_name.split(".")[0] or "project"
    project_root = get_user_project_root(user_id, project_name)
    project_root_path = Path(project_root)

    # Reset the selected project folder so the latest upload fully determines the workspace contents.
    if project_root_path.exists():
        shutil.rmtree(project_root_path, ignore_errors=True)
    project_root_path.mkdir(parents=True, exist_ok=True)

    zip_bytes = None
    zip_filename = None
    total_bytes = 0

    try:
        for uploaded_file in files:
            filename = uploaded_file.filename or ""
            if not filename:
                continue

            normalized_filename = filename.replace('\\', '/')
            path_parts = PurePosixPath(normalized_filename).parts
            if any(part in ('.', '..') for part in path_parts):
                raise HTTPException(status_code=400, detail="Invalid file path detected.")

            raw_content = await uploaded_file.read()
            total_bytes += len(raw_content)
            if filename.lower().endswith(".zip"):
                zip_bytes = raw_content
                zip_filename = filename
                with zipfile.ZipFile(io.BytesIO(raw_content)) as archive:
                    for member in archive.infolist():
                        if member.filename.endswith('/'):
                            continue
                        rel_path = PurePosixPath(member.filename)
                        target_path = project_root_path / rel_path
                        if not str(target_path.resolve()).startswith(str(project_root_path.resolve())):
                            raise HTTPException(status_code=400, detail="Invalid archive path detected.")
                        target_path.parent.mkdir(parents=True, exist_ok=True)
                        with archive.open(member) as src, open(target_path, 'wb') as dst:
                            shutil.copyfileobj(src, dst)
            else:
                relative_path = PurePosixPath(*path_parts)
                target_path = project_root_path / relative_path
                if not str(target_path.resolve()).startswith(str(project_root_path.resolve())):
                    raise HTTPException(status_code=400, detail="Invalid upload path detected.")
                target_path.parent.mkdir(parents=True, exist_ok=True)
                with open(target_path, 'wb') as dst:
                    dst.write(raw_content)

        file_count = sum(1 for _ in project_root_path.rglob('*') if _.is_file())

        if zip_bytes and zip_filename:
            zip_content = file_parsers.parse_project_zip(zip_bytes)
            analysis = knowledge_extractor.extract_structured_knowledge(zip_filename, zip_content, "project")
        else:
            analysis = {
                "summary": f"Uploaded {file_count} files into the workspace for agent use.",
                "technologies": [],
                "architecture": "Unknown",
                "decisions": [],
                "dependencies": [],
                "security_findings": [],
                "memories": []
            }

        # Save to MongoDB 'uploaded_files'
        file_doc = {
            "filename": zip_filename or first_filename,
            "file_type": "project",
            "size": total_bytes,
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "project_root": str(project_root_path),
            "files_in_workspace": file_count
        }
        res_file = mongodb.db.uploaded_files.insert_one(file_doc)
        file_id = str(res_file.inserted_id)

        # Save metadata tables
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
            "title": f"Project Workspace: {zip_filename or first_filename}",
            "content": f"Uploaded project files and workspace contents for {zip_filename or first_filename}",
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "file_id": file_id
        })
        
        saved_memories = []
        for mem in analysis.get("memories", []):
            try:
                item = save_memory(mem.get("type", "architecture"), mem.get("content", ""), user_id=user_id)
                saved_memories.append(item)
            except Exception as mem_err:
                logger.error(f"Failed to ingest memory from uploaded project: {str(mem_err)}")
        
        return {
            "file_id": file_id,
            "filename": zip_filename or first_filename,
            "project_root": str(project_root_path),
            "files_in_workspace": file_count,
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


@app.get("/agent/files")
async def agent_list_files(directory: str = ".", current_user: dict = Depends(auth.get_current_user)):
    """
    Returns list of files and directories within the user's uploaded project workspace.
    """
    from tools import list_files
    user_id = str(current_user["_id"])
    project_root = get_user_workspace_root_for_request(user_id)
    res = list_files(directory, base_root=project_root)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["error"])
    return res["data"]


@app.get("/agent/file")
async def agent_read_file(path: str, current_user: dict = Depends(auth.get_current_user)):
    """
    Reads the content of a workspace file relative to the user's uploaded project root.
    """
    from tools import read_file
    user_id = str(current_user["_id"])
    project_root = get_user_workspace_root_for_request(user_id)
    res = read_file(path, base_root=project_root)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["error"])
    return {"content": res["data"]}


@app.post("/agent/file")
async def agent_write_file(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    """
    Writes updated code content into the specified workspace file.
    """
    path = payload.get("path")
    content = payload.get("content")
    if not path or content is None:
        raise HTTPException(status_code=400, detail="Path and content are required.")
    from tools import write_file
    user_id = str(current_user["_id"])
    project_root = get_user_workspace_root_for_request(user_id)
    res = write_file(path, content, base_root=project_root)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["error"])
    return {"message": res["data"]}


@app.post("/agent/command")
async def agent_run_command(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    """
    Runs a shell command inside the user's uploaded project directory and returns terminal logs.
    """
    command = payload.get("command")
    if not command:
        raise HTTPException(status_code=400, detail="Command is required.")
        
    dangerous = ["rm -rf /", "format", "mkfs", "dd", "shutdown", "reboot"]
    if any(d in command.lower() for d in dangerous):
        raise HTTPException(status_code=400, detail="Forbidden command: potentially destructive execution blocked.")
        
    import subprocess
    user_id = str(current_user["_id"])
    project_root = get_user_workspace_root_for_request(user_id)
    try:
        process = subprocess.run(
            command,
            shell=True,
            cwd=project_root,
            capture_output=True,
            text=True,
            timeout=15
        )
        return {
            "stdout": process.stdout,
            "stderr": process.stderr,
            "exit_code": process.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            "stdout": "",
            "stderr": "Command execution timed out (limit: 15s)",
            "exit_code": -1
        }
    except Exception as e:
        return {
            "stdout": "",
            "stderr": f"Error running command: {str(e)}",
            "exit_code": -1
        }


import os
import logging
from typing import Dict, List, Any, Optional
import pymongo
from pymongo import MongoClient
import bcrypt

logger = logging.getLogger("memoryforge_backend")

class MockCursor:
    def __init__(self, data: List[Dict[str, Any]]):
        self.data = data

    def __iter__(self):
        return iter(self.data)

    def sort(self, key_or_list, direction=None):
        key = key_or_list
        reverse = False
        if isinstance(key_or_list, list):
            if key_or_list:
                key, direction = key_or_list[0]
        if direction == -1:
            reverse = True
        try:
            from datetime import datetime
            self.data.sort(key=lambda x: x.get(key) if x.get(key) is not None else datetime.min, reverse=reverse)
        except Exception:
            self.data.sort(key=lambda x: str(x.get(key, '')), reverse=reverse)
        return self

    def limit(self, n: int):
        self.data = self.data[:n]
        return self

    def __len__(self):
        return len(self.data)

    def __getitem__(self, index):
        return self.data[index]

class MockCollection:
    def __init__(self, name: str):
        self.name = name
        self.data: List[Dict[str, Any]] = []

    def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for item in self.data:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                return dict(item)
        return None

    def find(self, query: Dict[str, Any] = None) -> MockCursor:
        if not query:
            return MockCursor([dict(item) for item in self.data])
        results = []
        for item in self.data:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                results.append(dict(item))
        return MockCursor(results)


    def insert_one(self, document: Dict[str, Any]) -> Any:
        doc = dict(document)
        if "_id" not in doc:
            import uuid
            doc["_id"] = str(uuid.uuid4())
        self.data.append(doc)
        class InsertOneResult:
            inserted_id = doc["_id"]
        return InsertOneResult()

    def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False) -> Any:
        doc = self.find_one(query)
        if not doc:
            if upsert:
                new_doc = {}
                if "$set" in update:
                    new_doc.update(update["$set"])
                for k, v in query.items():
                    if k not in new_doc:
                        new_doc[k] = v
                self.insert_one(new_doc)
            return
        
        for idx, item in enumerate(self.data):
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                if "$set" in update:
                    self.data[idx].update(update["$set"])
                if "$inc" in update:
                    for inc_k, inc_v in update["$inc"].items():
                        self.data[idx][inc_k] = self.data[idx].get(inc_k, 0) + inc_v
                break

    def count_documents(self, query: Dict[str, Any]) -> int:
        return len(self.find(query))

class MockDatabase:
    def __init__(self):
        self.collections: Dict[str, MockCollection] = {}

    def __getattr__(self, name: str) -> MockCollection:
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]

    def __getitem__(self, name: str) -> MockCollection:
        return getattr(self, name)

# Database client and database variables
db = None
is_fallback = False

def init_db():
    global db, is_fallback
    import config
    
    if not config.MONGODB_URI:
        logger.warning("[MONGODB FALLBACK ACTIVE] MONGODB_URI environment variable is missing. Using in-memory fallback database.")
        print("[MONGODB FALLBACK ACTIVE] MONGODB_URI environment variable is missing. Using in-memory fallback database.")
        db = MockDatabase()
        is_fallback = True
        seed_db()
        return db

    try:
        # Attempt to establish real MongoDB Client connection
        logger.info(f"Connecting to MongoDB at: {config.MONGODB_URI}")
        client = MongoClient(config.MONGODB_URI, serverSelectionTimeoutMS=3000)
        # Ping the server to check connectivity
        client.admin.command('ping')
        try:
            db = client.get_default_database()
            if db is None:
                db = client.get_database("memoryforge")
        except Exception:
            db = client.get_database("memoryforge")
        is_fallback = False
        logger.info("[MONGODB CONNECTED] Successfully connected to MongoDB Atlas.")
        print("[MONGODB CONNECTED] Successfully connected to MongoDB Atlas.")
        seed_db()
    except Exception as e:
        logger.warning(f"[MONGODB FALLBACK ACTIVE] Connection failed: {str(e)}. Falling back to in-memory database.")
        print(f"[MONGODB FALLBACK ACTIVE] Connection failed: {str(e)}. Falling back to in-memory database.")
        db = MockDatabase()
        is_fallback = True
        seed_db()

    return db

def seed_db():
    """
    Seed default database values for both Atlas and Fallback DB.
    """
    try:
        # Example Admin User: admin@example.com / admin123
        # Check if admin already exists
        admin_user = db.users.find_one({"email": "admin@example.com"})
        if not admin_user:
            hashed_password = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            db.users.insert_one({
                "name": "Default Admin",
                "email": "admin@example.com",
                "password": hashed_password,
                "role": "ADMIN"
            })
            
        # Example Normal User: user@example.com / user123
        normal_user = db.users.find_one({"email": "user@example.com"})
        if not normal_user:
            user_password = bcrypt.hashpw("user123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            db.users.insert_one({
                "name": "Default User",
                "email": "user@example.com",
                "password": user_password,
                "role": "USER"
            })

        # Seed some default memories in db.memories
        if db.memories.count_documents({}) == 0:
            db.memories.insert_one({"type": "architecture", "content": "Use MongoDB Atlas", "user_id": "default_user"})
            db.memories.insert_one({"type": "preference", "content": "Prefer Python for backend services", "user_id": "default_user"})
            db.memories.insert_one({"type": "coding_standard", "content": "Use type hints and descriptive variable names in all Python modules", "user_id": "default_user"})
            
        # Seed default knowledge items
        if db.knowledge_base.count_documents({}) == 0:
            db.knowledge_base.insert_one({
                "title": "Authentication Rules",
                "content": "Always use JWT Authentication.",
                "user_id": "default_user"
            })
            db.knowledge_base.insert_one({
                "title": "Design Aesthetics Guide",
                "content": "Design should feel premium and state of the art. Use smooth gradients and rich dark modes.",
                "user_id": "default_user"
            })

        # Initialize analytics counters
        if db.analytics.count_documents({"metric": "memory_retrieval_count"}) == 0:
            db.analytics.insert_one({"metric": "memory_retrieval_count", "value": 5})
            
    except Exception as e:
        logger.error(f"Error during seeding: {str(e)}")

def increment_retrieval_count(count: int = 1):
    try:
        db.analytics.update_one(
            {"metric": "memory_retrieval_count"},
            {"$inc": {"value": count}},
            upsert=True
        )
    except Exception as e:
        logger.error(f"Error incrementing retrieval count: {str(e)}")

def increment_topic_query(topic: str):
    try:
        db.analytics.update_one(
            {"metric": "topic_query", "topic": topic},
            {"$inc": {"value": 1}},
            upsert=True
        )
    except Exception as e:
        logger.error(f"Error incrementing topic query: {str(e)}")

# Initialize database on import
init_db()

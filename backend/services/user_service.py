"""
User Service - Handles user creation and management
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
import bcrypt


def generate_id() -> str:
    """Generate a unique ID"""
    return str(uuid.uuid4())


def get_timestamp() -> str:
    """Get current UTC timestamp in ISO format"""
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


class UserService:
    """Service class for user operations"""
    
    SUPPORTED_CURRENCIES = ["USD", "USDC", "USDT", "NGN"]
    
    def __init__(self, db):
        self.db = db
    
    async def email_exists(self, email: str) -> bool:
        """Check if email is already registered"""
        existing = await self.db.users.find_one({"email": email})
        return existing is not None
    
    async def create_user_record(
        self,
        email: str,
        password: str,
        full_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new user record in the database"""
        user_id = generate_id()
        user_doc = {
            "id": user_id,
            "email": email,
            "password_hash": hash_password(password),
            "full_name": full_name,
            "kyc_status": None,
            "biometric_enabled": False,
            "biometric_credentials": None,
            "push_token": None,
            "created_date": get_timestamp()
        }
        await self.db.users.insert_one(user_doc)
        return {k: v for k, v in user_doc.items() if k not in ("_id", "password_hash")}
    
    async def setup_user_wallets(self, email: str) -> List[Dict[str, Any]]:
        """Create initial wallets for a new user"""
        wallets = []
        for currency in self.SUPPORTED_CURRENCIES:
            wallet = {
                "id": generate_id(),
                "user_email": email,
                "currency": currency,
                "available_balance": 0,
                "pending_balance": 0,
                "created_date": get_timestamp()
            }
            await self.db.wallets.insert_one(wallet)
            wallets.append({k: v for k, v in wallet.items() if k != "_id"})
        return wallets
    
    async def setup_balance_snapshot(self, email: str) -> Dict[str, Any]:
        """Create initial balance snapshot for a new user"""
        balance = {
            "id": generate_id(),
            "user_email": email,
            "usd": 0,
            "usdc": 0,
            "usdt": 0,
            "ngn": 0,
            "last_updated": get_timestamp()
        }
        await self.db.balances.insert_one(balance)
        return {k: v for k, v in balance.items() if k != "_id"}
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        return await self.db.users.find_one({"email": email}, {"_id": 0})
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        return await self.db.users.find_one({"id": user_id}, {"_id": 0})
    
    async def update_user(self, user_id: str, update_data: Dict[str, Any]) -> bool:
        """Update user record"""
        result = await self.db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
        return result.modified_count > 0

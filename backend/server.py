"""
Pursible Backend - FastAPI Server
Replicates Base44 cloud functions for Emergent platform
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, Request, UploadFile, File, Response, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
import hmac
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx

# Import services
from services.wallet_service import WalletService
from services.transaction_service import TransactionService, ConversionRateService
from services.notification_service import NotificationService, NotificationTemplates
from services.kyc_service import KYCService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection - supports both MONGODB_URL (Atlas) and MONGO_URL (local)
mongo_url = os.environ.get('MONGODB_URL') or os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

# For MongoDB Atlas (SRV connections), use certifi for SSL
if 'mongodb+srv' in mongo_url or 'mongodb.net' in mongo_url:
    import certifi
    client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
else:
    client = AsyncIOMotorClient(mongo_url)

db = client[os.environ.get('DB_NAME', 'pursible')]

# Initialize services
wallet_service = WalletService(db)
transaction_service = TransactionService(db)
rate_service = ConversionRateService(db)
notification_service = NotificationService(db)
kyc_service = KYCService(db)

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'pursible-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Cookie Settings
COOKIE_NAME = "pursible_auth"
COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days in seconds
FRONTEND_ORIGIN = os.environ.get('FRONTEND_ORIGIN', '')
IS_SECURE = FRONTEND_ORIGIN.startswith('https')

# Third-party API Keys
FLUTTERWAVE_SECRET_KEY = os.environ.get('FLUTTERWAVE_SECRET_KEY', '')
FLUTTERWAVE_PUBLIC_KEY = os.environ.get('FLUTTERWAVE_PUBLIC_KEY', '')
DOJAH_API_KEY = os.environ.get('DOJAH_API_KEY', '')
DOJAH_SECRET_KEY = os.environ.get('DOJAH_SECRET_KEY', '')
DOJAH_APP_ID = os.environ.get('DOJAH_APP_ID', '')
BRIDGE_API_KEY = os.environ.get('BRIDGE_API_KEY', '')
WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET', '')

# API Base URLs
FLW_BASE = "https://api.flutterwave.com/v3"
DOJAH_BASE = "https://api.dojah.io"
BRIDGE_BASE = "https://api.bridge.xyz/v0"

# Create the main app
app = FastAPI(title="Pursible API", version="1.0.0")

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
entities_router = APIRouter(prefix="/entities", tags=["Entities"])
functions_router = APIRouter(prefix="/functions", tags=["Functions"])
webhooks_router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
biometric_router = APIRouter(prefix="/biometric", tags=["Biometric"])
push_router = APIRouter(prefix="/push", tags=["Push Notifications"])

security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════════
# PYDANTIC MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    kyc_status: Optional[str] = None
    role: Optional[str] = None
    biometric_enabled: bool = False
    created_date: str
    
class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class KYCData(BaseModel):
    full_name: str
    date_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    address: Optional[str] = None
    bvn: Optional[str] = None
    nin: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    id_document_url: Optional[str] = None
    selfie_url: Optional[str] = None

class WithdrawRequest(BaseModel):
    currency: str
    amount: float
    destination: Dict[str, Any]

class SwapRequest(BaseModel):
    fromCurrency: str
    toCurrency: str
    amount: float
    confirmed: bool = False

class BankVerifyRequest(BaseModel):
    accountNumber: str
    bankName: str

# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def generate_id() -> str:
    """Generate a unique UUID string."""
    return str(uuid.uuid4())

def get_timestamp() -> str:
    """Get current UTC timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat()

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_jwt_token(user_id: str, email: str) -> str:
    """Create a JWT token for a user."""
    payload: Dict[str, Any] = {
        'sub': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def set_auth_cookie(response: Response, token: str) -> None:
    """Set httpOnly secure auth cookie."""
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=IS_SECURE,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/"
    )

def clear_auth_cookie(response: Response) -> None:
    """Clear the auth cookie."""
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        httponly=True,
        secure=IS_SECURE,
        samesite="lax"
    )

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Get the current authenticated user from httpOnly cookie or Bearer token."""
    token = None
    
    # First, try to get token from httpOnly cookie
    token = request.cookies.get(COOKIE_NAME)
    
    # Fallback to Bearer token for backward compatibility during migration
    if not token and credentials:
        token = credentials.credentials
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = decode_jwt_token(token)
    user = await db.users.find_one({"id": payload['sub']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_optional_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Optional[Dict[str, Any]]:
    """Get the current user if authenticated, otherwise return None."""
    token = request.cookies.get(COOKIE_NAME)
    if not token and credentials:
        token = credentials.credentials
    
    if not token:
        return None
    try:
        payload = decode_jwt_token(token)
        user = await db.users.find_one({"id": payload['sub']}, {"_id": 0})
        return user
    except Exception:
        return None

async def get_admin_user(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency to ensure the user is an admin."""
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def log_error(
    function_name: str, 
    error_message: str, 
    user_email: Optional[str] = None, 
    provider: Optional[str] = None
) -> None:
    """Log errors to AppError collection."""
    try:
        await db.app_errors.insert_one({
            "id": generate_id(),
            "function_name": function_name,
            "error_message": error_message,
            "user_email": user_email,
            "provider": provider,
            "created_date": get_timestamp()
        })
    except Exception:
        logger.warning(f"Failed to log error: {function_name} - {error_message}")

# Nigerian bank codes
BANK_CODES = {
    'Access Bank': '044',
    'Carbon': '565',
    'Citibank Nigeria': '023',
    'Ecobank Nigeria': '050',
    'Fidelity Bank': '070',
    'First Bank of Nigeria': '011',
    'First City Monument Bank (FCMB)': '030',
    'Guaranty Trust Bank (GTBank)': '058',
    'Heritage Bank': '051',
    'Jaiz Bank': '089',
    'Keystone Bank': '082',
    'Kuda Bank': '090',
    'Moniepoint': '999993',
    'OPay': '999991',
    'PalmPay': '999992',
    'Parallex Bank': '526',
    'Polaris Bank': '076',
    'Providus Bank': '101',
    'Stanbic IBTC Bank': '039',
    'Standard Chartered Bank': '068',
    'Sterling Bank': '232',
    'SunTrust Bank': '100',
    'Union Bank': '032',
    'United Bank for Africa (UBA)': '033',
    'Unity Bank': '215',
    'Wema Bank': '035',
    'Zenith Bank': '057',
}

# ═══════════════════════════════════════════════════════════════════════════════
# AUTHENTICATION ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@auth_router.post("/register", response_model=TokenResponse)
async def register(data: UserCreate, response: Response):
    """Register a new user"""
    # Check if user exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = generate_id()
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "full_name": data.full_name,
        "kyc_status": None,
        "biometric_enabled": False,
        "biometric_credentials": None,
        "push_token": None,
        "created_date": get_timestamp()
    }
    await db.users.insert_one(user_doc)
    
    # Create initial wallets for the user
    currencies = ["USD", "USDC", "USDT", "NGN"]
    for currency in currencies:
        await db.wallets.insert_one({
            "id": generate_id(),
            "user_email": data.email,
            "currency": currency,
            "available_balance": 0,
            "pending_balance": 0,
            "created_date": get_timestamp()
        })
    
    # Create balance snapshot
    await db.balances.insert_one({
        "id": generate_id(),
        "user_email": data.email,
        "usd": 0,
        "usdc": 0,
        "usdt": 0,
        "ngn": 0,
        "last_updated": get_timestamp()
    })
    
    token = create_jwt_token(user_id, data.email)
    
    # Set httpOnly cookie
    set_auth_cookie(response, token)
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user_id,
            email=data.email,
            full_name=data.full_name,
            kyc_status=None,
            biometric_enabled=False,
            created_date=user_doc["created_date"]
        )
    )

@auth_router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, response: Response):
    """Login user"""
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_jwt_token(user["id"], user["email"])
    
    # Set httpOnly cookie
    set_auth_cookie(response, token)
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user.get("full_name"),
            kyc_status=user.get("kyc_status"),
            role=user.get("role"),
            biometric_enabled=user.get("biometric_enabled", False),
            created_date=user.get("created_date", get_timestamp())
        )
    )

@auth_router.post("/logout")
async def logout(response: Response):
    """Logout user - clear auth cookie"""
    clear_auth_cookie(response)
    return {"success": True, "message": "Logged out successfully"}

@auth_router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    """Refresh the auth token"""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = decode_jwt_token(token)
        user = await db.users.find_one({"id": payload['sub']}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Generate new token
        new_token = create_jwt_token(user["id"], user["email"])
        set_auth_cookie(response, new_token)
        
        return {"success": True, "message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        clear_auth_cookie(response)
        raise HTTPException(status_code=401, detail="Token expired, please login again")

class BiometricLoginRequest(BaseModel):
    email: EmailStr

@auth_router.post("/biometric-login", response_model=TokenResponse)
async def biometric_login(data: BiometricLoginRequest, response: Response):
    """Login user via biometric authentication (client-side verified)"""
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Verify biometric is enabled for this user
    if not user.get("biometric_enabled"):
        raise HTTPException(status_code=400, detail="Biometric login not enabled for this user")
    
    # Mark biometric login in user record
    await db.users.update_one(
        {"email": data.email},
        {"$set": {"last_biometric_login": get_timestamp()}}
    )
    
    token = create_jwt_token(user["id"], user["email"])
    
    # Set httpOnly cookie
    set_auth_cookie(response, token)
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user.get("full_name"),
            kyc_status=user.get("kyc_status"),
            role=user.get("role"),
            biometric_enabled=user.get("biometric_enabled", False),
            created_date=user.get("created_date", get_timestamp())
        )
    )

@auth_router.get("/me", response_model=UserResponse)
async def get_me(request: Request, user: dict = Depends(get_current_user)):
    """Get current user"""
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user.get("full_name"),
        kyc_status=user.get("kyc_status"),
        role=user.get("role"),
        biometric_enabled=user.get("biometric_enabled", False),
        created_date=user.get("created_date", get_timestamp())
    )

@auth_router.patch("/me")
async def update_me(data: dict, request: Request, user: dict = Depends(get_current_user)):
    """Update current user profile"""
    allowed_fields = ["full_name", "phone", "address", "date_of_birth", "nationality"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated_user

# ═══════════════════════════════════════════════════════════════════════════════
# GENERIC ENTITY ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

def get_collection_name(entity_name: str) -> str:
    """Map entity names to collection names."""
    return entity_name.lower().replace("-", "_")

@entities_router.get("/{entity_name}")
async def list_entities(
    entity_name: str,
    sort_by: Optional[str] = None,
    limit: int = Query(100, le=1000),
    user: dict = Depends(get_current_user)
):
    """List all entities of a type"""
    collection = db[get_collection_name(entity_name)]
    
    # Build query - filter by user_email for user-specific entities
    query = {}
    user_specific = ["wallets", "transactions", "kyc_records", "bank_accounts", 
                     "notifications", "balances", "rate_alerts", "goals", "referrals"]
    if entity_name.lower() in user_specific:
        query["user_email"] = user["email"]
    
    # Sort
    sort_order = []
    if sort_by:
        if sort_by.startswith("-"):
            sort_order = [(sort_by[1:], -1)]
        else:
            sort_order = [(sort_by, 1)]
    
    cursor = collection.find(query, {"_id": 0})
    if sort_order:
        cursor = cursor.sort(sort_order)
    cursor = cursor.limit(limit)
    
    return await cursor.to_list(limit)

@entities_router.get("/{entity_name}/filter")
async def filter_entities(
    entity_name: str,
    request: Request,
    sort_by: Optional[str] = None,
    limit: Optional[int] = None,
    user: dict = Depends(get_current_user)
):
    """Filter entities by criteria"""
    collection = db[get_collection_name(entity_name)]
    
    # Get filter params from query string
    query = {}
    for key, value in request.query_params.items():
        if key not in ["sort_by", "limit"]:
            # Handle boolean strings
            if value.lower() == "true":
                query[key] = True
            elif value.lower() == "false":
                query[key] = False
            else:
                query[key] = value
    
    # Sort
    sort_order = []
    if sort_by:
        if sort_by.startswith("-"):
            sort_order = [(sort_by[1:], -1)]
        else:
            sort_order = [(sort_by, 1)]
    
    cursor = collection.find(query, {"_id": 0})
    if sort_order:
        cursor = cursor.sort(sort_order)
    if limit:
        cursor = cursor.limit(limit)
    
    return await cursor.to_list(limit or 1000)

@entities_router.get("/{entity_name}/{entity_id}")
async def get_entity(
    entity_name: str,
    entity_id: str,
    user: dict = Depends(get_current_user)
):
    """Get a single entity by ID"""
    collection = db[get_collection_name(entity_name)]
    entity = await collection.find_one({"id": entity_id}, {"_id": 0})
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity

@entities_router.post("/{entity_name}")
async def create_entity(
    entity_name: str,
    data: dict,
    user: dict = Depends(get_current_user)
):
    """Create a new entity"""
    collection = db[get_collection_name(entity_name)]
    
    entity_id = data.get("id") or generate_id()
    doc = {
        "id": entity_id,
        **data,
        "created_date": get_timestamp()
    }
    
    # Auto-set user_email for user-specific entities
    user_specific = ["wallets", "transactions", "kyc_records", "bank_accounts", 
                     "notifications", "balances", "rate_alerts", "goals", "referrals"]
    if entity_name.lower() in user_specific and "user_email" not in doc:
        doc["user_email"] = user["email"]
    
    await collection.insert_one(doc)
    doc.pop("_id", None)
    return doc

@entities_router.patch("/{entity_name}/{entity_id}")
async def update_entity(
    entity_name: str,
    entity_id: str,
    data: dict,
    user: dict = Depends(get_current_user)
):
    """Update an entity"""
    collection = db[get_collection_name(entity_name)]
    
    # Remove id and _id from update data
    data.pop("id", None)
    data.pop("_id", None)
    
    result = await collection.update_one(
        {"id": entity_id},
        {"$set": data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    updated = await collection.find_one({"id": entity_id}, {"_id": 0})
    return updated

@entities_router.delete("/{entity_name}/{entity_id}")
async def delete_entity(
    entity_name: str,
    entity_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete an entity"""
    collection = db[get_collection_name(entity_name)]
    result = await collection.delete_one({"id": entity_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    return {"success": True, "deleted_id": entity_id}

# ═══════════════════════════════════════════════════════════════════════════════
# CLOUD FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

@functions_router.post("/getBalance")
async def get_balance(user: dict = Depends(get_current_user)):
    """Get user's wallet balances"""
    try:
        wallets = await db.wallets.find(
            {"user_email": user["email"]}, 
            {"_id": 0}
        ).to_list(10)
        
        balance = {
            "USD": 0,
            "USDC": 0,
            "USDT": 0,
            "NGN": 0
        }
        
        for wallet in wallets:
            currency = wallet.get("currency", "").upper()
            if currency in balance:
                balance[currency] = wallet.get("available_balance", 0)
        
        # Update balance snapshot
        await db.balances.update_one(
            {"user_email": user["email"]},
            {"$set": {
                "usd": balance["USD"],
                "usdc": balance["USDC"],
                "usdt": balance["USDT"],
                "ngn": balance["NGN"],
                "last_updated": get_timestamp()
            }},
            upsert=True
        )
        
        return {"success": True, "balance": balance}
    except Exception as e:
        await log_error("getBalance", str(e), user["email"])
        raise HTTPException(status_code=500, detail="Unable to fetch balance")

@functions_router.post("/submitKYC")
async def submit_kyc(data: dict, user: dict = Depends(get_current_user)):
    """Submit KYC verification"""
    try:
        kyc_data = data.get("kycData", {})
        
        if not kyc_data.get("full_name", "").strip():
            raise HTTPException(status_code=400, detail="Full name is required")
        
        # Check for existing KYC record
        existing = await db.kyc_records.find_one({"user_email": user["email"]})
        
        kyc_payload = {
            "user_email": user["email"],
            "full_name": kyc_data.get("full_name"),
            "date_of_birth": kyc_data.get("date_of_birth"),
            "nationality": kyc_data.get("nationality"),
            "address": kyc_data.get("address"),
            "bvn": kyc_data.get("bvn"),
            "nin": kyc_data.get("nin"),
            "id_type": kyc_data.get("id_type"),
            "id_number": kyc_data.get("id_number"),
            "id_document_url": kyc_data.get("id_document_url"),
            "selfie_url": kyc_data.get("selfie_url"),
            "status": "in_review",
            "updated_date": get_timestamp()
        }
        
        # In test mode (no Dojah keys), auto-approve
        if not DOJAH_API_KEY or not DOJAH_SECRET_KEY:
            kyc_payload["status"] = "approved"
            kyc_payload["timeline"] = [
                {"status": "in_review", "timestamp": get_timestamp(), "note": "Submitted for verification"},
                {"status": "approved", "timestamp": get_timestamp(), "note": "Auto-approved (test mode)"}
            ]
            
            # Update user KYC status
            await db.users.update_one(
                {"email": user["email"]},
                {"$set": {"kyc_status": "verified"}}
            )
            
            if existing:
                await db.kyc_records.update_one({"id": existing["id"]}, {"$set": kyc_payload})
            else:
                kyc_payload["id"] = generate_id()
                kyc_payload["created_date"] = get_timestamp()
                await db.kyc_records.insert_one(kyc_payload)
            
            # Create notification
            await db.notifications.insert_one({
                "id": generate_id(),
                "user_email": user["email"],
                "title": "Identity Verified",
                "message": "Your identity has been verified. You can now use all Pursible features.",
                "type": "kyc",
                "is_read": False,
                "created_date": get_timestamp()
            })
            
            return {
                "success": True,
                "approved": True,
                "status": "approved",
                "message": "Identity verified successfully (test mode)."
            }
        
        # TODO: Implement actual Dojah verification
        # For now, set to pending review
        kyc_payload["timeline"] = [
            {"status": "in_review", "timestamp": get_timestamp(), "note": "Submitted for verification"}
        ]
        
        if existing:
            await db.kyc_records.update_one({"id": existing["id"]}, {"$set": kyc_payload})
        else:
            kyc_payload["id"] = generate_id()
            kyc_payload["created_date"] = get_timestamp()
            await db.kyc_records.insert_one(kyc_payload)
        
        return {
            "success": True,
            "approved": False,
            "status": "in_review",
            "message": "Your documents are being reviewed."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_error("submitKYC", str(e), user["email"], "dojah")
        raise HTTPException(status_code=500, detail="Verification could not be completed")

@functions_router.post("/verifyBankAccount")
async def verify_bank_account(data: BankVerifyRequest, user: dict = Depends(get_current_user)):
    """Verify Nigerian bank account"""
    try:
        bank_code = BANK_CODES.get(data.bankName)
        if not bank_code:
            raise HTTPException(status_code=400, detail=f"Unrecognized bank: {data.bankName}")
        
        if len(data.accountNumber) != 10 or not data.accountNumber.isdigit():
            raise HTTPException(status_code=400, detail="Account number must be exactly 10 digits")
        
        # If no Flutterwave key, return mock success for testing
        if not FLUTTERWAVE_SECRET_KEY:
            return {
                "success": True,
                "accountName": f"TEST USER - {data.accountNumber[-4:]}",
                "verified": True,
                "note": "Test mode - verification simulated"
            }
        
        # Call Flutterwave API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{FLW_BASE}/accounts/resolve",
                params={
                    "account_number": data.accountNumber,
                    "account_bank": bank_code
                },
                headers={
                    "Authorization": f"Bearer {FLUTTERWAVE_SECRET_KEY}",
                    "Content-Type": "application/json"
                },
                timeout=10.0
            )
            
            result = response.json()
            
            if result.get("status") != "success" or not result.get("data", {}).get("account_name"):
                raise HTTPException(
                    status_code=400,
                    detail="Account could not be verified. Please check the details."
                )
            
            return {
                "success": True,
                "accountName": result["data"]["account_name"],
                "verified": True
            }
            
    except HTTPException:
        raise
    except Exception as e:
        await log_error("verifyBankAccount", str(e), user["email"], "flutterwave")
        raise HTTPException(status_code=500, detail="Verification unavailable")

@functions_router.post("/withdraw")
async def withdraw(data: WithdrawRequest, user: dict = Depends(get_current_user)):
    """Process withdrawal - Refactored to use services"""
    try:
        # Check KYC requirement
        kyc_check = await kyc_service.check_kyc_requirement(user["email"])
        if kyc_check["blocked"]:
            return kyc_check["response"]
        
        currency = data.currency.upper()
        amount = data.amount
        
        # Get wallet and validate balance
        wallet = await wallet_service.get_wallet(user["email"], currency)
        if not wallet:
            raise HTTPException(status_code=400, detail=f"No {currency} wallet found")
        
        # Calculate fee and total
        fee = 50 if currency == "NGN" else 0
        total_needed = amount + fee
        
        if wallet.get("available_balance", 0) < total_needed:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient {currency} balance. Need {total_needed}, have {wallet.get('available_balance', 0)}"
            )
        
        # Generate reference
        reference_id = transaction_service.generate_reference("WD", currency)
        
        # Debit wallet and move to pending
        await wallet_service.update_balance(
            wallet["id"],
            set_available=wallet["available_balance"] - total_needed,
            set_pending=wallet.get("pending_balance", 0) + amount
        )
        
        # Create transaction
        tx = await transaction_service.create_transaction(
            user_email=user["email"],
            tx_type="withdrawal",
            from_currency=currency,
            to_currency=currency,
            from_amount=amount,
            to_amount=amount,
            fee=fee,
            status="processing",
            provider="flutterwave" if currency == "NGN" else "manual",
            description=f"{currency} withdrawal",
            reference_id=reference_id,
            metadata={"bank_account_id": data.destination.get("bankAccountId")} if data.destination.get("bankAccountId") else None
        )
        
        # Update status to processing
        await transaction_service.update_status(tx["id"], "processing", "Processing withdrawal")
        
        # Create notification
        notif = NotificationTemplates.withdrawal_initiated(amount, currency)
        await notification_service.create_transaction_notification(
            user["email"], notif["title"], notif["message"], tx["id"]
        )
        
        # In test mode (no Flutterwave key), auto-complete
        if not FLUTTERWAVE_SECRET_KEY:
            await transaction_service.update_status(tx["id"], "completed", "Completed (test mode)")
            # Clear pending
            await wallet_service.update_balance(
                wallet["id"],
                set_pending=max(0, wallet.get("pending_balance", 0))
            )
        
        return {
            "success": True,
            "transaction": {
                "id": tx["id"],
                "referenceId": reference_id,
                "status": "processing",
                "amount": amount,
                "currency": currency,
                "fee": fee
            },
            "message": "Withdrawal initiated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_error("withdraw", str(e), user["email"])
        raise HTTPException(status_code=500, detail="Withdrawal failed")

@functions_router.post("/swapCurrency")
async def swap_currency(data: SwapRequest, user: dict = Depends(get_current_user)):
    """Swap between currencies - Refactored to use services"""
    try:
        # Check KYC requirement
        kyc_check = await kyc_service.check_kyc_requirement(user["email"])
        if kyc_check["blocked"]:
            return kyc_check["response"]
        
        from_currency = data.fromCurrency.upper()
        to_currency = data.toCurrency.upper()
        amount = data.amount
        
        # Validate source wallet and balance
        source_wallet = await wallet_service.get_wallet(user["email"], from_currency)
        if not source_wallet:
            raise HTTPException(status_code=400, detail=f"No {from_currency} wallet found")
        
        if source_wallet.get("available_balance", 0) < amount:
            raise HTTPException(status_code=400, detail=f"Insufficient {from_currency} balance")
        
        # Get conversion rate
        rate_info = await rate_service.get_rate(from_currency, to_currency)
        rate = rate_info["rate"]
        fee_percent = rate_info["fee_percent"]
        
        # Calculate conversion
        conversion = rate_service.calculate_conversion(amount, rate, fee_percent)
        
        # If not confirmed, return quote only
        if not data.confirmed:
            return {
                "success": True,
                "quote": {
                    "fromCurrency": from_currency,
                    "toCurrency": to_currency,
                    "fromAmount": amount,
                    "toAmount": conversion["to_amount"],
                    "rate": rate,
                    "feePercent": fee_percent,
                    "feeAmount": conversion["fee_amount"],
                    "provider": rate_info["provider"]
                }
            }
        
        # Execute swap - debit source wallet
        await wallet_service.debit_wallet(source_wallet["id"], amount)
        
        # Credit destination wallet
        dest_wallet = await wallet_service.get_or_create_wallet(user["email"], to_currency)
        await wallet_service.credit_wallet(dest_wallet["id"], conversion["to_amount"])
        
        # Create transaction record
        reference_id = transaction_service.generate_reference("SW")
        tx = await transaction_service.create_transaction(
            user_email=user["email"],
            tx_type="conversion",
            from_currency=from_currency,
            to_currency=to_currency,
            from_amount=amount,
            to_amount=conversion["to_amount"],
            fee=conversion["fee_amount"],
            status="completed",
            provider="pursible",
            description=f"{from_currency} to {to_currency} swap",
            reference_id=reference_id
        )
        
        # Update transaction status to completed
        await transaction_service.update_status(tx["id"], "completed", "Swap completed")
        
        # Send notification
        notif = NotificationTemplates.swap_completed(amount, from_currency, conversion["to_amount"], to_currency)
        await notification_service.create_transaction_notification(
            user["email"], notif["title"], notif["message"], tx["id"]
        )
        
        return {
            "success": True,
            "transaction": {
                "id": tx["id"],
                "referenceId": reference_id,
                "fromCurrency": from_currency,
                "toCurrency": to_currency,
                "fromAmount": amount,
                "toAmount": conversion["to_amount"],
                "fee": conversion["fee_amount"],
                "rate": rate,
                "status": "completed"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_error("swapCurrency", str(e), user["email"])
        raise HTTPException(status_code=500, detail="Swap failed")

@functions_router.post("/depositFiat")
async def deposit_fiat(data: dict, user: dict = Depends(get_current_user)):
    """Get deposit instructions"""
    try:
        # Check KYC
        kyc = await db.kyc_records.find_one({"user_email": user["email"]})
        if not kyc or kyc.get("status") != "approved":
            return {
                "success": False,
                "kycBlocked": True,
                "error": "Identity verification required",
                "redirectTo": "/kyc"
            }
        
        currency = data.get("currency", "").upper()
        
        if currency == "NGN":
            # Return virtual account details (demo)
            return {
                "success": True,
                "currency": "NGN",
                "provider": "flutterwave",
                "depositDetails": {
                    "bankName": "Wema Bank",
                    "accountNumber": f"99{user['email'][:8].replace('@', '').replace('.', '')[:8].ljust(8, '0')}",
                    "accountName": user.get("full_name") or user["email"],
                    "instructions": "Transfer NGN from any Nigerian bank. Balance updates within minutes."
                }
            }
        
        if currency == "USD":
            return {
                "success": True,
                "currency": "USD",
                "provider": "bridge",
                "depositDetails": {
                    "bankName": "Bridge Bank",
                    "accountNumber": "Demo Account",
                    "routingNumber": "Demo Routing",
                    "accountType": "checking",
                    "paymentRail": "ACH / Wire",
                    "reference": user["email"],
                    "instructions": "Send USD via ACH or wire. Include your email as reference."
                }
            }
        
        raise HTTPException(status_code=400, detail=f"Unsupported currency: {currency}")
        
    except HTTPException:
        raise
    except Exception as e:
        await log_error("depositFiat", str(e), user["email"])
        raise HTTPException(status_code=500, detail="Unable to load deposit details")

@functions_router.post("/createUserWallet")
async def create_user_wallet(user: dict = Depends(get_current_user)):
    """Initialize user wallets"""
    try:
        # Check if wallets already exist
        existing = await db.wallets.find({"user_email": user["email"]}).to_list(10)
        existing_currencies = {w["currency"] for w in existing}
        
        currencies = ["USD", "USDC", "USDT", "NGN"]
        created = []
        
        for currency in currencies:
            if currency not in existing_currencies:
                wallet_id = generate_id()
                await db.wallets.insert_one({
                    "id": wallet_id,
                    "user_email": user["email"],
                    "currency": currency,
                    "available_balance": 0,
                    "pending_balance": 0,
                    "created_date": get_timestamp()
                })
                created.append(currency)
        
        # Ensure balance snapshot exists
        balance = await db.balances.find_one({"user_email": user["email"]})
        if not balance:
            await db.balances.insert_one({
                "id": generate_id(),
                "user_email": user["email"],
                "usd": 0,
                "usdc": 0,
                "usdt": 0,
                "ngn": 0,
                "last_updated": get_timestamp()
            })
        
        return {
            "success": True,
            "created_wallets": created,
            "message": "Wallets initialized"
        }
        
    except Exception as e:
        await log_error("createUserWallet", str(e), user["email"])
        raise HTTPException(status_code=500, detail="Failed to create wallets")

# ═══════════════════════════════════════════════════════════════════════════════
# WEBHOOK HANDLERS
# ═══════════════════════════════════════════════════════════════════════════════

@webhooks_router.post("/flutterwave")
async def flutterwave_webhook(request: Request):
    """Handle Flutterwave webhooks - Refactored with separate handlers"""
    try:
        # Verify signature
        verif_hash = request.headers.get("verif-hash", "")
        if WEBHOOK_SECRET and verif_hash != WEBHOOK_SECRET:
            logger.warning("Invalid Flutterwave webhook signature")
            return {"received": True}
        
        body = await request.json()
        event_type = body.get("event")
        data = body.get("data", {})
        
        logger.info(f"Flutterwave webhook: {event_type}")
        
        # Handle different event types
        if event_type == "charge.completed":
            await _handle_deposit_webhook(data)
        elif event_type == "transfer.completed":
            await _handle_withdrawal_success_webhook(data)
        elif event_type == "transfer.failed":
            await _handle_withdrawal_failed_webhook(data)
        
        return {"received": True}
        
    except Exception as e:
        logger.error(f"Flutterwave webhook error: {e}")
        return {"received": True}


async def _handle_deposit_webhook(data: Dict[str, Any]) -> None:
    """Handle deposit completed webhook"""
    amount = float(data.get("amount", 0))
    customer_email = data.get("customer", {}).get("email")
    reference = data.get("flw_ref") or data.get("tx_ref")
    
    if not customer_email or amount <= 0:
        return
    
    # Credit wallet
    wallet = await wallet_service.get_or_create_wallet(customer_email, "NGN")
    await wallet_service.credit_wallet(wallet["id"], amount)
    
    # Create transaction
    await transaction_service.create_transaction(
        user_email=customer_email,
        tx_type="deposit",
        from_currency="NGN",
        to_currency="NGN",
        from_amount=amount,
        to_amount=amount,
        status="completed",
        provider="flutterwave",
        reference_id=reference,
        description="NGN deposit"
    )
    
    # Notification
    notif = NotificationTemplates.deposit_confirmed(amount, "NGN")
    await notification_service.create_transaction_notification(
        customer_email, notif["title"], notif["message"]
    )


async def _handle_withdrawal_success_webhook(data: Dict[str, Any]) -> None:
    """Handle withdrawal completed webhook"""
    flw_transfer_id = str(data.get("id"))
    tx = await transaction_service.find_by_provider_ref(flw_transfer_id)
    
    if not tx or tx.get("status") == "completed":
        return
    
    # Update transaction
    await transaction_service.update_status(tx["id"], "completed", "Withdrawal successful")
    
    # Clear pending balance
    wallet = await wallet_service.get_wallet(tx["user_email"], tx["from_currency"])
    if wallet:
        new_pending = max(0, wallet.get("pending_balance", 0) - tx["from_amount"])
        await wallet_service.update_balance(wallet["id"], set_pending=new_pending)
    
    # Notification
    notif = NotificationTemplates.withdrawal_completed(tx["from_amount"], tx["from_currency"])
    await notification_service.create_transaction_notification(
        tx["user_email"], notif["title"], notif["message"], tx["id"]
    )


async def _handle_withdrawal_failed_webhook(data: Dict[str, Any]) -> None:
    """Handle withdrawal failed webhook"""
    flw_transfer_id = str(data.get("id"))
    reason = data.get("complete_message") or "Transfer failed"
    
    tx = await transaction_service.find_by_provider_ref(flw_transfer_id)
    
    if not tx or tx.get("status") in ["completed", "failed"]:
        return
    
    # Refund wallet
    wallet = await wallet_service.get_wallet(tx["user_email"], tx["from_currency"])
    if wallet:
        refund = tx["from_amount"] + tx.get("fee", 0)
        await wallet_service.update_balance(
            wallet["id"],
            available_delta=refund,
            set_pending=max(0, wallet.get("pending_balance", 0) - tx["from_amount"])
        )
    
    # Update transaction
    await transaction_service.update_status(tx["id"], "failed", reason)
    
    # Notification
    notif = NotificationTemplates.withdrawal_failed(tx["from_amount"], tx["from_currency"], reason)
    await notification_service.create_transaction_notification(
        tx["user_email"], notif["title"], notif["message"], tx["id"]
    )

# ═══════════════════════════════════════════════════════════════════════════════
# FILE UPLOAD ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload a file and return its URL"""
    try:
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Use JPG, PNG, WEBP, or PDF.")
        
        # Validate file size (10MB max)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max size is 10MB.")
        
        # Generate unique filename
        ext = Path(file.filename).suffix or '.bin'
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = UPLOAD_DIR / unique_name
        
        # Save file
        with open(file_path, 'wb') as f:
            f.write(contents)
        
        # Generate public URL (using the API endpoint to serve files)
        file_url = f"/api/files/{unique_name}"
        
        # Log the upload
        await db.file_uploads.insert_one({
            "id": generate_id(),
            "user_email": user["email"],
            "filename": file.filename,
            "stored_name": unique_name,
            "content_type": file.content_type,
            "size": len(contents),
            "url": file_url,
            "created_date": get_timestamp()
        })
        
        return {"success": True, "file_url": file_url}
        
    except HTTPException:
        raise
    except Exception as e:
        await log_error("upload_file", str(e), user["email"])
        raise HTTPException(status_code=500, detail="Upload failed")

@api_router.get("/files/{filename}")
async def serve_file(filename: str):
    """Serve an uploaded file"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine content type
    ext = file_path.suffix.lower()
    content_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.heic': 'image/heic',
    }
    content_type = content_types.get(ext, 'application/octet-stream')
    
    return FileResponse(file_path, media_type=content_type)

# ═══════════════════════════════════════════════════════════════════════════════
# CONVERSION RATES ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@api_router.get("/rates")
async def get_conversion_rates():
    """Get all active conversion rates"""
    try:
        rates = await db.conversion_rates.find(
            {"is_active": True},
            {"_id": 0}
        ).to_list(50)
        
        # If no rates in DB, return defaults
        if not rates:
            rates = [
                {"from_currency": "USD", "to_currency": "NGN", "rate": 1550, "fee_percentage": 0.5},
                {"from_currency": "USD", "to_currency": "USDC", "rate": 1, "fee_percentage": 0.1},
                {"from_currency": "USD", "to_currency": "USDT", "rate": 1, "fee_percentage": 0.1},
                {"from_currency": "USDC", "to_currency": "NGN", "rate": 1550, "fee_percentage": 0.5},
                {"from_currency": "USDC", "to_currency": "USD", "rate": 1, "fee_percentage": 0.1},
                {"from_currency": "USDT", "to_currency": "NGN", "rate": 1550, "fee_percentage": 0.5},
                {"from_currency": "USDT", "to_currency": "USD", "rate": 1, "fee_percentage": 0.1},
                {"from_currency": "NGN", "to_currency": "USD", "rate": 0.000645, "fee_percentage": 0.5},
                {"from_currency": "NGN", "to_currency": "USDC", "rate": 0.000645, "fee_percentage": 0.5},
                {"from_currency": "NGN", "to_currency": "USDT", "rate": 0.000645, "fee_percentage": 0.5},
            ]
        
        return {"success": True, "rates": rates}
        
    except Exception as e:
        logger.error(f"Error fetching rates: {e}")
        return {"success": True, "rates": []}

@api_router.get("/rates/{from_currency}/{to_currency}")
async def get_specific_rate(from_currency: str, to_currency: str):
    """Get rate for a specific currency pair"""
    try:
        from_curr = from_currency.upper()
        to_curr = to_currency.upper()
        
        rate_doc = await db.conversion_rates.find_one({
            "from_currency": from_curr,
            "to_currency": to_curr,
            "is_active": True
        }, {"_id": 0})
        
        if rate_doc:
            return {
                "success": True,
                "rate": rate_doc.get("rate"),
                "fee_percentage": rate_doc.get("fee_percentage", 0.5),
                "from_currency": from_curr,
                "to_currency": to_curr
            }
        
        # Default rates
        default_rates = {
            "USD-NGN": 1550,
            "USD-USDC": 1,
            "USD-USDT": 1,
            "USDC-NGN": 1550,
            "USDC-USD": 1,
            "USDT-NGN": 1550,
            "USDT-USD": 1,
            "NGN-USD": 0.000645,
            "NGN-USDC": 0.000645,
            "NGN-USDT": 0.000645,
        }
        
        rate_key = f"{from_curr}-{to_curr}"
        if rate_key in default_rates:
            return {
                "success": True,
                "rate": default_rates[rate_key],
                "fee_percentage": 0.5,
                "from_currency": from_curr,
                "to_currency": to_curr
            }
        
        return {
            "success": False,
            "error": f"No rate available for {from_curr} to {to_curr}"
        }
        
    except Exception as e:
        logger.error(f"Error fetching specific rate: {e}")
        return {"success": False, "error": "Unable to fetch rate"}

# ═══════════════════════════════════════════════════════════════════════════════
# SEED DATA FOR DEMO
# ═══════════════════════════════════════════════════════════════════════════════

@api_router.post("/seed-demo-data")
async def seed_demo_data():
    """Seed demo conversion rates and deposit accounts"""
    # Seed conversion rates
    rates = [
        {"from_currency": "USD", "to_currency": "NGN", "rate": 1550, "fee_percentage": 0.5, "is_active": True},
        {"from_currency": "USD", "to_currency": "USDC", "rate": 1, "fee_percentage": 0.1, "is_active": True},
        {"from_currency": "USD", "to_currency": "USDT", "rate": 1, "fee_percentage": 0.1, "is_active": True},
        {"from_currency": "USDC", "to_currency": "NGN", "rate": 1550, "fee_percentage": 0.5, "is_active": True},
        {"from_currency": "USDC", "to_currency": "USD", "rate": 1, "fee_percentage": 0.1, "is_active": True},
        {"from_currency": "USDT", "to_currency": "NGN", "rate": 1550, "fee_percentage": 0.5, "is_active": True},
        {"from_currency": "USDT", "to_currency": "USD", "rate": 1, "fee_percentage": 0.1, "is_active": True},
        {"from_currency": "NGN", "to_currency": "USD", "rate": 0.000645, "fee_percentage": 0.5, "is_active": True},
        {"from_currency": "NGN", "to_currency": "USDC", "rate": 0.000645, "fee_percentage": 0.5, "is_active": True},
        {"from_currency": "NGN", "to_currency": "USDT", "rate": 0.000645, "fee_percentage": 0.5, "is_active": True},
    ]
    
    for rate in rates:
        existing = await db.conversion_rates.find_one({
            "from_currency": rate["from_currency"],
            "to_currency": rate["to_currency"]
        })
        if not existing:
            rate["id"] = generate_id()
            rate["created_date"] = get_timestamp()
            await db.conversion_rates.insert_one(rate)
    
    # Seed deposit accounts (these are the deposit channel configurations)
    deposit_accounts = [
        {
            "id": generate_id(),
            "type": "usd_wire",
            "label": "USD Wire Transfer",
            "is_active": True,
            "fields": [
                {"key": "bank_name", "label": "Bank Name", "value": "Bridge Bank"},
                {"key": "routing_number", "label": "Routing Number", "value": "Demo Routing"},
                {"key": "account_number", "label": "Account Number", "value": "Demo Account"},
                {"key": "account_type", "label": "Account Type", "value": "Checking"},
                {"key": "reference", "label": "Reference", "value": "Use your email"},
            ],
            "created_date": get_timestamp()
        },
        {
            "id": generate_id(),
            "type": "stable_wallet",
            "label": "USDT / Stablecoin",
            "is_active": True,
            "fields": [
                {"key": "network", "label": "Network", "value": "Ethereum / ERC-20"},
                {"key": "wallet_address", "label": "Wallet Address", "value": "0x1234567890abcdef1234567890abcdef12345678"},
                {"key": "supported_tokens", "label": "Supported Tokens", "value": "USDT, USDC"},
            ],
            "created_date": get_timestamp()
        },
        {
            "id": generate_id(),
            "type": "ngn_bank",
            "label": "NGN Bank Transfer",
            "is_active": True,
            "fields": [
                {"key": "bank_name", "label": "Bank Name", "value": "Wema Bank"},
                {"key": "account_number", "label": "Account Number", "value": "9900000001"},
                {"key": "account_name", "label": "Account Name", "value": "Pursible Ltd"},
            ],
            "created_date": get_timestamp()
        }
    ]
    
    for account in deposit_accounts:
        existing = await db.deposit_accounts.find_one({"type": account["type"]})
        if not existing:
            await db.deposit_accounts.insert_one(account)
    
    return {"success": True, "message": "Demo data seeded (rates + deposit accounts)"}

# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@api_router.post("/admin/promote")
async def promote_to_admin(data: dict, user: dict = Depends(get_admin_user)):
    """Promote a user to admin role (only admins can do this)"""
    target_email = data.get("email")
    
    if not target_email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Promote the target user
    result = await db.users.update_one(
        {"email": target_email},
        {"$set": {"role": "admin"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": f"User {target_email} is now an admin"}

@api_router.post("/admin/demote")
async def demote_from_admin(data: dict, user: dict = Depends(get_admin_user)):
    """Remove admin role from a user (only admins can do this)"""
    target_email = data.get("email")
    
    if not target_email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Can't demote yourself
    if target_email == user["email"]:
        raise HTTPException(status_code=400, detail="Cannot demote yourself")
    
    result = await db.users.update_one(
        {"email": target_email},
        {"$unset": {"role": ""}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": f"User {target_email} is no longer an admin"}

# Admin data endpoints
@api_router.get("/admin/users")
async def get_all_users(user: dict = Depends(get_admin_user)):
    """Get all users (admin only)"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return {"success": True, "users": users}

@api_router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(get_admin_user)):
    """Get admin dashboard stats (admin only)"""
    total_users = await db.users.count_documents({})
    pending_kyc = await db.kyc_records.count_documents({"status": {"$in": ["pending", "in_review"]}})
    total_transactions = await db.transactions.count_documents({})
    
    return {
        "success": True,
        "stats": {
            "total_users": total_users,
            "pending_kyc": pending_kyc,
            "total_transactions": total_transactions
        }
    }

# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════════

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": get_timestamp()}

@api_router.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Pursible API", "version": "1.0.0"}

# ═══════════════════════════════════════════════════════════════════════════════
# BIOMETRIC AUTHENTICATION ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

class BiometricRegisterRequest(BaseModel):
    credential_id: str
    credential_raw_id: str
    public_key: Optional[str] = None

class BiometricVerifyRequest(BaseModel):
    credential_id: str
    assertion_data: Optional[str] = None

@biometric_router.post("/register")
async def register_biometric(
    data: BiometricRegisterRequest,
    request: Request,
    user: dict = Depends(get_current_user)
):
    """Store biometric credential ID and public key for the user"""
    try:
        credential_data = {
            "credential_id": data.credential_id,
            "credential_raw_id": data.credential_raw_id,
            "public_key": data.public_key,
            "registered_at": get_timestamp()
        }
        
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "biometric_enabled": True,
                    "biometric_credentials": credential_data
                }
            }
        )
        
        return {"success": True, "message": "Biometric credential registered"}
    except Exception as e:
        logger.error(f"Biometric registration failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to register biometric")

@biometric_router.post("/verify")
async def verify_biometric(
    data: BiometricVerifyRequest,
    request: Request
):
    """Verify a biometric assertion - returns user email if valid"""
    try:
        # Find user by credential_id
        user = await db.users.find_one(
            {"biometric_credentials.credential_id": data.credential_id},
            {"_id": 0}
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="Biometric credential not found")
        
        if not user.get("biometric_enabled"):
            raise HTTPException(status_code=400, detail="Biometric login not enabled")
        
        # The actual WebAuthn verification happens client-side
        # Server just validates the credential exists
        return {
            "success": True,
            "email": user["email"],
            "verified": True
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Biometric verification failed: {e}")
        raise HTTPException(status_code=500, detail="Verification failed")

@biometric_router.delete("/credential")
async def delete_biometric(
    request: Request,
    user: dict = Depends(get_current_user)
):
    """Disable biometric authentication for the user"""
    try:
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "biometric_enabled": False,
                    "biometric_credentials": None
                }
            }
        )
        
        return {"success": True, "message": "Biometric credential removed"}
    except Exception as e:
        logger.error(f"Biometric deletion failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove biometric")

@biometric_router.get("/status")
async def get_biometric_status(
    request: Request,
    user: dict = Depends(get_current_user)
):
    """Get biometric status for the current user"""
    return {
        "biometric_enabled": user.get("biometric_enabled", False),
        "has_credentials": user.get("biometric_credentials") is not None
    }

# ═══════════════════════════════════════════════════════════════════════════════
# PUSH NOTIFICATION ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

class PushTokenRequest(BaseModel):
    token: str
    device_type: Optional[str] = "web"

class NotificationSettingsRequest(BaseModel):
    transactions: Optional[bool] = None
    rateAlerts: Optional[bool] = None
    security: Optional[bool] = None
    marketing: Optional[bool] = None

@push_router.post("/register-token")
async def register_push_token(
    data: PushTokenRequest,
    request: Request,
    user: dict = Depends(get_current_user)
):
    """Store FCM/push token for the user"""
    try:
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "push_token": data.token,
                    "push_device_type": data.device_type,
                    "push_token_updated": get_timestamp()
                }
            }
        )
        
        return {"success": True, "message": "Push token registered"}
    except Exception as e:
        logger.error(f"Push token registration failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to register push token")

@push_router.delete("/token")
async def delete_push_token(
    request: Request,
    user: dict = Depends(get_current_user)
):
    """Clear push token on logout"""
    try:
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "push_token": None,
                    "push_device_type": None
                }
            }
        )
        
        return {"success": True, "message": "Push token removed"}
    except Exception as e:
        logger.error(f"Push token deletion failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove push token")

@push_router.get("/settings")
async def get_notification_settings(
    request: Request,
    user: dict = Depends(get_current_user)
):
    """Get notification settings for the current user"""
    settings = user.get("notification_settings", {
        "transactions": True,
        "rateAlerts": True,
        "security": True,
        "marketing": False
    })
    
    return {
        "success": True,
        "settings": settings,
        "push_enabled": user.get("push_token") is not None
    }

@push_router.patch("/settings")
async def update_notification_settings(
    data: NotificationSettingsRequest,
    request: Request,
    user: dict = Depends(get_current_user)
):
    """Update notification settings for the current user"""
    try:
        current_settings = user.get("notification_settings", {
            "transactions": True,
            "rateAlerts": True,
            "security": True,
            "marketing": False
        })
        
        # Update only provided fields
        update_data = data.model_dump(exclude_none=True)
        current_settings.update(update_data)
        
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"notification_settings": current_settings}}
        )
        
        return {"success": True, "settings": current_settings}
    except Exception as e:
        logger.error(f"Notification settings update failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to update settings")

# Include routers
api_router.include_router(auth_router)
api_router.include_router(entities_router)
api_router.include_router(functions_router)
api_router.include_router(webhooks_router)
api_router.include_router(biometric_router)
api_router.include_router(push_router)
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize database indexes"""
    try:
        # Create indexes for better query performance
        await db.users.create_index("email", unique=True)
        await db.wallets.create_index([("user_email", 1), ("currency", 1)])
        await db.transactions.create_index("user_email")
        await db.transactions.create_index("reference_id")
        await db.kyc_records.create_index("user_email")
        await db.bank_accounts.create_index("user_email")
        await db.notifications.create_index([("user_email", 1), ("is_read", 1)])
        logger.info("Database indexes created")
    except Exception as e:
        logger.error(f"Index creation failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

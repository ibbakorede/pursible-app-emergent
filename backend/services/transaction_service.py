"""
Transaction Service - Handles transaction creation and updates
"""
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import uuid


class TransactionService:
    """Service class for transaction operations"""
    
    def __init__(self, db):
        self.db = db
    
    @staticmethod
    def generate_reference(prefix: str, currency: str = "") -> str:
        """Generate a unique transaction reference"""
        timestamp = int(datetime.now().timestamp())
        unique_part = uuid.uuid4().hex[:6].upper()
        if currency:
            return f"{prefix}-{currency}-{timestamp}-{unique_part}"
        return f"{prefix}-{timestamp}-{unique_part}"
    
    @staticmethod
    def get_timestamp() -> str:
        """Get current UTC timestamp in ISO format"""
        return datetime.now(timezone.utc).isoformat()
    
    async def create_transaction(
        self,
        user_email: str,
        tx_type: str,
        from_currency: str,
        to_currency: str,
        from_amount: float,
        to_amount: float,
        fee: float = 0,
        status: str = "pending",
        provider: str = "pursible",
        description: str = "",
        reference_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new transaction record"""
        tx_id = str(uuid.uuid4())
        timestamp = self.get_timestamp()
        
        transaction = {
            "id": tx_id,
            "user_email": user_email,
            "type": tx_type,
            "from_currency": from_currency.upper(),
            "to_currency": to_currency.upper(),
            "from_amount": from_amount,
            "to_amount": to_amount,
            "fee": round(fee, 6),
            "status": status,
            "provider": provider,
            "reference_id": reference_id or self.generate_reference(tx_type[:2].upper(), from_currency),
            "description": description or f"{tx_type.capitalize()} transaction",
            "timeline": [
                {"status": "initiated", "timestamp": timestamp, "note": f"{tx_type.capitalize()} initiated"}
            ],
            "created_date": timestamp
        }
        
        if metadata:
            transaction.update(metadata)
        
        await self.db.transactions.insert_one(transaction)
        return {k: v for k, v in transaction.items() if k != "_id"}
    
    async def update_status(
        self, 
        tx_id: str, 
        new_status: str, 
        note: str = "",
        additional_updates: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Update transaction status and add timeline entry"""
        tx = await self.db.transactions.find_one({"id": tx_id})
        if not tx:
            return False
        
        timestamp = self.get_timestamp()
        timeline = tx.get("timeline", [])
        timeline.append({
            "status": new_status,
            "timestamp": timestamp,
            "note": note or f"Status changed to {new_status}"
        })
        
        update_ops = {
            "status": new_status,
            "timeline": timeline,
            "updated_date": timestamp
        }
        
        if additional_updates:
            update_ops.update(additional_updates)
        
        result = await self.db.transactions.update_one(
            {"id": tx_id},
            {"$set": update_ops}
        )
        return result.modified_count > 0
    
    async def get_transaction(self, tx_id: str) -> Optional[Dict[str, Any]]:
        """Get a transaction by ID"""
        return await self.db.transactions.find_one({"id": tx_id}, {"_id": 0})
    
    async def get_user_transactions(
        self, 
        user_email: str, 
        tx_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get transactions for a user with optional filters"""
        query = {"user_email": user_email}
        if tx_type:
            query["type"] = tx_type
        if status:
            query["status"] = status
        
        cursor = self.db.transactions.find(query, {"_id": 0}).sort("created_date", -1).limit(limit)
        return await cursor.to_list(length=limit)
    
    async def find_by_provider_ref(self, provider_tx_id: str) -> Optional[Dict[str, Any]]:
        """Find transaction by provider transaction ID"""
        return await self.db.transactions.find_one(
            {"provider_transaction_id": provider_tx_id}, 
            {"_id": 0}
        )


class ConversionRateService:
    """Service for managing conversion rates"""
    
    DEFAULT_RATES = {
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
    
    DEFAULT_FEE_PERCENT = 0.5
    
    def __init__(self, db):
        self.db = db
    
    async def get_rate(self, from_currency: str, to_currency: str) -> Dict[str, Any]:
        """Get conversion rate between currencies"""
        from_curr = from_currency.upper()
        to_curr = to_currency.upper()
        
        rate_doc = await self.db.conversion_rates.find_one({
            "from_currency": from_curr,
            "to_currency": to_curr,
            "is_active": True
        })
        
        if rate_doc:
            return {
                "rate": rate_doc.get("rate", 1),
                "fee_percent": rate_doc.get("fee_percentage", self.DEFAULT_FEE_PERCENT),
                "provider": rate_doc.get("provider", "pursible")
            }
        
        # Fallback to default rates
        rate_key = f"{from_curr}-{to_curr}"
        return {
            "rate": self.DEFAULT_RATES.get(rate_key, 1),
            "fee_percent": self.DEFAULT_FEE_PERCENT,
            "provider": "pursible"
        }
    
    def calculate_conversion(
        self, 
        amount: float, 
        rate: float, 
        fee_percent: float
    ) -> Dict[str, float]:
        """Calculate conversion amounts including fees"""
        fee_amount = amount * (fee_percent / 100)
        net_amount = amount - fee_amount
        to_amount = round(net_amount * rate, 6)
        
        return {
            "fee_amount": round(fee_amount, 6),
            "net_amount": round(net_amount, 6),
            "to_amount": to_amount
        }

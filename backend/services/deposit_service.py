"""
Deposit Service - Handles fiat deposit operations
"""
from typing import Dict, Any, List
from datetime import datetime, timezone
import uuid


class DepositService:
    """Service for handling deposit operations"""
    
    SUPPORTED_CURRENCIES = ["USD", "USDC", "USDT", "NGN"]
    
    def __init__(self, db):
        self.db = db
    
    @staticmethod
    def get_timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()
    
    @staticmethod
    def generate_reference(currency: str) -> str:
        """Generate deposit reference"""
        timestamp = int(datetime.now().timestamp())
        unique = uuid.uuid4().hex[:6].upper()
        return f"DEP-{currency}-{timestamp}-{unique}"
    
    def validate_currency(self, currency: str) -> Dict[str, Any]:
        """Validate deposit currency"""
        curr = currency.upper()
        if curr not in self.SUPPORTED_CURRENCIES:
            return {"valid": False, "error": f"Unsupported currency: {curr}"}
        return {"valid": True, "currency": curr}
    
    async def get_deposit_instructions(self, currency: str, user_email: str) -> Dict[str, Any]:
        """Get deposit instructions for a currency"""
        currency = currency.upper()
        
        # Map currency to deposit type
        type_map = {
            "USD": "usd_wire",
            "USDC": "stable_wallet",
            "USDT": "stable_wallet",
            "NGN": "ngn_bank"
        }
        
        deposit_type = type_map.get(currency)
        
        # Get deposit account configuration
        account = await self.db.deposit_accounts.find_one({
            "type": deposit_type,
            "is_active": True
        }, {"_id": 0})
        
        if not account:
            return self._get_fallback_instructions(currency, user_email)
        
        reference = self.generate_reference(currency)
        
        return {
            "success": True,
            "currency": currency,
            "method": account.get("label", deposit_type),
            "fields": account.get("fields", []),
            "reference": reference,
            "note": f"Include reference '{reference}' in payment description"
        }
    
    def _get_fallback_instructions(self, currency: str, user_email: str) -> Dict[str, Any]:
        """Fallback deposit instructions if no account configured"""
        reference = self.generate_reference(currency)
        
        fallback_configs = {
            "USD": {
                "method": "USD Wire Transfer",
                "fields": [
                    {"key": "note", "label": "Notice", "value": "Contact support for wire transfer details"}
                ]
            },
            "USDC": {
                "method": "USDC Deposit",
                "fields": [
                    {"key": "network", "label": "Network", "value": "Ethereum / Polygon"},
                    {"key": "note", "label": "Notice", "value": "Contact support for wallet address"}
                ]
            },
            "USDT": {
                "method": "USDT Deposit",
                "fields": [
                    {"key": "network", "label": "Network", "value": "Ethereum / Tron"},
                    {"key": "note", "label": "Notice", "value": "Contact support for wallet address"}
                ]
            },
            "NGN": {
                "method": "NGN Bank Transfer",
                "fields": [
                    {"key": "note", "label": "Notice", "value": "Contact support for bank details"}
                ]
            }
        }
        
        config = fallback_configs.get(currency, {})
        
        return {
            "success": True,
            "currency": currency,
            "method": config.get("method", f"{currency} Deposit"),
            "fields": config.get("fields", []),
            "reference": reference,
            "note": f"Include reference '{reference}' in payment description"
        }
    
    async def record_pending_deposit(
        self,
        user_email: str,
        currency: str,
        amount: float,
        reference: str
    ) -> Dict[str, Any]:
        """Record a pending deposit for tracking"""
        deposit_id = str(uuid.uuid4())
        
        deposit = {
            "id": deposit_id,
            "user_email": user_email,
            "currency": currency,
            "amount": amount,
            "reference": reference,
            "status": "pending",
            "created_date": self.get_timestamp()
        }
        
        await self.db.pending_deposits.insert_one(deposit)
        
        return {"id": deposit_id, "status": "pending"}

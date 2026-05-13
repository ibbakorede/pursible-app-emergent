"""
Withdrawal Service - Handles withdrawal operations
"""
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
import uuid


class WithdrawalRequest(BaseModel):
    """Withdrawal request parameters"""
    currency: str
    amount: float
    destination: Dict[str, Any]
    user_email: str


class WithdrawalService:
    """Service for handling withdrawal operations"""
    
    FEE_PERCENTAGE: float = 0.5
    MIN_WITHDRAWAL: Dict[str, float] = {
        "NGN": 1000,
        "USD": 10,
        "USDC": 10,
        "USDT": 10,
    }
    
    def __init__(self, db, wallet_service, transaction_service):
        self.db = db
        self.wallet_service = wallet_service
        self.transaction_service = transaction_service
    
    @staticmethod
    def get_timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()
    
    def validate_withdrawal(self, currency: str, amount: float) -> Dict[str, Any]:
        """Validate withdrawal parameters"""
        currency = currency.upper()
        
        if currency not in self.MIN_WITHDRAWAL:
            return {"valid": False, "error": f"Unsupported currency: {currency}"}
        
        min_amount = self.MIN_WITHDRAWAL[currency]
        if amount < min_amount:
            return {"valid": False, "error": f"Minimum withdrawal is {min_amount} {currency}"}
        
        return {"valid": True, "currency": currency}
    
    def calculate_fee(self, amount: float) -> float:
        """Calculate withdrawal fee"""
        return round(amount * (self.FEE_PERCENTAGE / 100), 2)
    
    async def check_balance(self, user_email: str, currency: str, amount: float, fee: float) -> Dict[str, Any]:
        """Check if user has sufficient balance"""
        wallet = await self.db.wallets.find_one({
            "user_email": user_email,
            "currency": currency
        })
        
        if not wallet:
            return {"sufficient": False, "error": f"No {currency} wallet found"}
        
        available = wallet.get("available_balance", 0)
        total_needed = amount + fee
        
        if available < total_needed:
            return {
                "sufficient": False,
                "error": f"Insufficient {currency} balance. Need {total_needed}, have {available}"
            }
        
        return {"sufficient": True, "available": available, "wallet_id": wallet.get("id")}
    
    async def verify_bank_account(self, destination: Dict[str, Any], currency: str) -> Dict[str, Any]:
        """Verify withdrawal destination"""
        if currency == "NGN":
            bank_id = destination.get("bankAccountId")
            if not bank_id:
                return {"valid": False, "error": "Bank account ID required for NGN withdrawal"}
            
            bank_account = await self.db.bank_accounts.find_one({
                "id": bank_id,
                "is_verified": True
            })
            
            if not bank_account:
                return {"valid": False, "error": "Bank account not found or not verified"}
            
            return {"valid": True, "bank_account": bank_account}
        
        # For USD/USDC/USDT, no bank verification needed yet
        return {"valid": True}
    
    async def process_withdrawal(
        self,
        request: WithdrawalRequest,
        fee: float,
        reference_id: str
    ) -> Dict[str, Any]:
        """Process the withdrawal - deduct balance and create transaction"""
        from services.transaction_service import TransactionConfig
        
        # Deduct from wallet
        await self.wallet_service.deduct_balance(
            request.user_email,
            request.currency,
            request.amount + fee
        )
        
        # Create transaction
        tx_config = TransactionConfig(
            user_email=request.user_email,
            tx_type="withdrawal",
            from_currency=request.currency,
            to_currency=request.currency,
            from_amount=request.amount,
            to_amount=request.amount,
            fee=fee,
            status="processing",
            provider="flutterwave" if request.currency == "NGN" else "manual",
            description=f"{request.currency} withdrawal",
            reference_id=reference_id,
            metadata={"bank_account_id": request.destination.get("bankAccountId")}
        )
        
        return await self.transaction_service.create_transaction(tx_config)

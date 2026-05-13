"""
Swap/Conversion Service - Handles currency swap operations
"""
from typing import Dict, Any
from pydantic import BaseModel
from datetime import datetime, timezone


class SwapRequest(BaseModel):
    """Swap request parameters"""
    from_currency: str
    to_currency: str
    amount: float
    user_email: str
    confirmed: bool = False


class SwapService:
    """Service for handling currency swap operations"""
    
    SUPPORTED_CURRENCIES = ["USD", "USDC", "USDT", "NGN"]
    MIN_SWAP_AMOUNT = 1
    
    def __init__(self, db, wallet_service, transaction_service, rate_service):
        self.db = db
        self.wallet_service = wallet_service
        self.transaction_service = transaction_service
        self.rate_service = rate_service
    
    @staticmethod
    def get_timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()
    
    def validate_swap_request(self, from_currency: str, to_currency: str, amount: float) -> Dict[str, Any]:
        """Validate swap parameters"""
        from_curr = from_currency.upper()
        to_curr = to_currency.upper()
        
        if from_curr not in self.SUPPORTED_CURRENCIES:
            return {"valid": False, "error": f"Unsupported source currency: {from_curr}"}
        
        if to_curr not in self.SUPPORTED_CURRENCIES:
            return {"valid": False, "error": f"Unsupported target currency: {to_curr}"}
        
        if from_curr == to_curr:
            return {"valid": False, "error": "Cannot swap same currency"}
        
        if amount < self.MIN_SWAP_AMOUNT:
            return {"valid": False, "error": f"Minimum swap amount is {self.MIN_SWAP_AMOUNT}"}
        
        return {"valid": True, "from_currency": from_curr, "to_currency": to_curr}
    
    async def get_swap_quote(self, from_currency: str, to_currency: str, amount: float) -> Dict[str, Any]:
        """Get a swap quote with rate and fees"""
        rate_info = await self.rate_service.get_rate(from_currency, to_currency)
        
        rate = rate_info.get("rate", 1)
        fee_percent = rate_info.get("fee_percent", 0.5)
        
        conversion = self.rate_service.calculate_conversion(amount, rate, fee_percent)
        
        return {
            "from_currency": from_currency,
            "to_currency": to_currency,
            "from_amount": amount,
            "to_amount": conversion["to_amount"],
            "rate": rate,
            "fee_amount": conversion["fee_amount"],
            "fee_percent": fee_percent,
            "expires_at": self.get_timestamp()
        }
    
    async def check_balance(self, user_email: str, currency: str, amount: float) -> Dict[str, Any]:
        """Check if user has sufficient balance for swap"""
        wallet = await self.db.wallets.find_one({
            "user_email": user_email,
            "currency": currency
        })
        
        if not wallet:
            return {"sufficient": False, "error": f"No {currency} wallet found"}
        
        available = wallet.get("available_balance", 0)
        
        if available < amount:
            return {
                "sufficient": False,
                "error": f"Insufficient {currency} balance. Need {amount}, have {available}"
            }
        
        return {"sufficient": True, "available": available}
    
    async def execute_swap(self, request: SwapRequest, quote: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the swap - deduct source, credit target, create transaction"""
        from services.transaction_service import TransactionConfig
        
        # Deduct from source wallet
        await self.wallet_service.deduct_balance(
            request.user_email,
            request.from_currency,
            request.amount
        )
        
        # Credit to target wallet
        await self.wallet_service.add_balance(
            request.user_email,
            request.to_currency,
            quote["to_amount"]
        )
        
        # Create transaction record
        reference_id = self.transaction_service.generate_reference("SW")
        tx_config = TransactionConfig(
            user_email=request.user_email,
            tx_type="conversion",
            from_currency=request.from_currency,
            to_currency=request.to_currency,
            from_amount=request.amount,
            to_amount=quote["to_amount"],
            fee=quote["fee_amount"],
            status="completed",
            provider="pursible",
            description=f"{request.from_currency} to {request.to_currency} swap",
            reference_id=reference_id
        )
        
        tx = await self.transaction_service.create_transaction(tx_config)
        
        return {
            "success": True,
            "transaction": tx,
            "from_amount": request.amount,
            "to_amount": quote["to_amount"],
            "rate": quote["rate"]
        }

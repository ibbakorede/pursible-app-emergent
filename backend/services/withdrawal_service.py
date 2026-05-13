"""
Withdrawal Service - Handles withdrawal operations
"""
from typing import Dict, Any
from dataclasses import dataclass


@dataclass
class WithdrawalContext:
    """Groups withdrawal operation dependencies"""
    wallet_service: Any
    transaction_service: Any
    notification_service: Any


class WithdrawalService:
    """Service for handling withdrawal operations"""
    
    FLAT_FEES: Dict[str, float] = {"NGN": 50, "USD": 0, "USDC": 0, "USDT": 0}
    
    def __init__(self, db, wallet_service, transaction_service):
        self.db = db
        self.wallet_service = wallet_service
        self.transaction_service = transaction_service
    
    async def check_balance(self, user_email: str, currency: str, amount: float, fee: float) -> Dict[str, Any]:
        """Check if user has sufficient balance"""
        wallet = await self.db.wallets.find_one({"user_email": user_email, "currency": currency})
        if not wallet:
            return {"sufficient": False, "error": f"No {currency} wallet found"}
        
        available = wallet.get("available_balance", 0)
        if available < amount + fee:
            return {"sufficient": False, "error": f"Insufficient {currency} balance"}
        
        return {"sufficient": True, "available": available, "wallet_id": wallet.get("id")}
    
    async def process_full_withdrawal(
        self, user_email: str, currency: str, amount: float,
        destination: Dict[str, Any], ctx: WithdrawalContext
    ) -> Dict[str, Any]:
        """Full withdrawal flow: validate, debit, create tx, notify"""
        from services.transaction_service import TransactionConfig
        from services.notification_service import NotificationTemplates
        
        currency = currency.upper()
        fee = self.FLAT_FEES.get(currency, 0)
        
        # Check balance
        balance_check = await self.check_balance(user_email, currency, amount, fee)
        if not balance_check["sufficient"]:
            return {"success": False, "error": balance_check["error"]}
        
        # Debit wallet
        await ctx.wallet_service.update_balance(
            balance_check["wallet_id"],
            set_available=balance_check["available"] - (amount + fee),
            set_pending=0
        )
        
        # Create transaction
        reference_id = ctx.transaction_service.generate_reference("WD", currency)
        tx_config = TransactionConfig(
            user_email=user_email, tx_type="withdrawal",
            from_currency=currency, to_currency=currency,
            from_amount=amount, to_amount=amount, fee=fee,
            status="processing", provider="flutterwave" if currency == "NGN" else "manual",
            description=f"{currency} withdrawal", reference_id=reference_id
        )
        tx = await ctx.transaction_service.create_transaction(tx_config)
        
        # Notify
        notif = NotificationTemplates.withdrawal_initiated(amount, currency)
        await ctx.notification_service.create_transaction_notification(
            user_email, notif["title"], notif["message"], tx["id"]
        )
        
        return {
            "success": True,
            "transaction": {
                "id": tx["id"], "referenceId": reference_id, "status": "processing",
                "amount": amount, "currency": currency, "fee": fee
            },
            "message": "Withdrawal initiated successfully"
        }

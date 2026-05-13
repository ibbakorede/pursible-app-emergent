"""
Swap/Conversion Service - Handles currency swap operations
"""
from typing import Dict, Any


class SwapService:
    """Service for handling currency swap operations"""
    
    def __init__(self, db, wallet_service, transaction_service, rate_service):
        self.db = db
        self.wallet_service = wallet_service
        self.transaction_service = transaction_service
        self.rate_service = rate_service
    
    async def process_full_swap(
        self, user_email: str, from_currency: str, to_currency: str, amount: float,
        confirmed: bool, wallet_service, notification_service
    ) -> Dict[str, Any]:
        """Full swap flow: validate, get rate, optionally execute, notify"""
        from services.transaction_service import TransactionConfig
        from services.notification_service import NotificationTemplates
        
        from_curr = from_currency.upper()
        to_curr = to_currency.upper()
        
        # Check source wallet balance
        source_wallet = await wallet_service.get_wallet(user_email, from_curr)
        if not source_wallet:
            return {"success": False, "error": f"No {from_curr} wallet found"}
        if source_wallet.get("available_balance", 0) < amount:
            return {"success": False, "error": f"Insufficient {from_curr} balance"}
        
        # Get rate and calculate conversion
        rate_info = await self.rate_service.get_rate(from_curr, to_curr)
        rate, fee_percent = rate_info["rate"], rate_info["fee_percent"]
        conversion = self.rate_service.calculate_conversion(amount, rate, fee_percent)
        
        # Return quote only if not confirmed
        if not confirmed:
            return {
                "success": True,
                "quote": {
                    "fromCurrency": from_curr, "toCurrency": to_curr, "fromAmount": amount,
                    "toAmount": conversion["to_amount"], "rate": rate,
                    "feePercent": fee_percent, "feeAmount": conversion["fee_amount"],
                    "provider": rate_info["provider"]
                }
            }
        
        # Execute swap
        await wallet_service.debit_wallet(source_wallet["id"], amount)
        dest_wallet = await wallet_service.get_or_create_wallet(user_email, to_curr)
        await wallet_service.credit_wallet(dest_wallet["id"], conversion["to_amount"])
        
        # Create transaction
        reference_id = self.transaction_service.generate_reference("SW")
        tx_config = TransactionConfig(
            user_email=user_email, tx_type="conversion",
            from_currency=from_curr, to_currency=to_curr,
            from_amount=amount, to_amount=conversion["to_amount"],
            fee=conversion["fee_amount"], status="completed",
            provider="pursible", description=f"{from_curr} to {to_curr} swap",
            reference_id=reference_id
        )
        tx = await self.transaction_service.create_transaction(tx_config)
        await self.transaction_service.update_status(tx["id"], "completed", "Swap completed")
        
        # Notify
        notif = NotificationTemplates.swap_completed(amount, from_curr, conversion["to_amount"], to_curr)
        await notification_service.create_transaction_notification(user_email, notif["title"], notif["message"], tx["id"])
        
        return {
            "success": True,
            "transaction": {
                "id": tx["id"], "referenceId": reference_id,
                "fromCurrency": from_curr, "toCurrency": to_curr,
                "fromAmount": amount, "toAmount": conversion["to_amount"],
                "fee": conversion["fee_amount"], "rate": rate, "status": "completed"
            }
        }

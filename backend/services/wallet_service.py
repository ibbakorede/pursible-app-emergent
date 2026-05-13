"""
Wallet Service - Handles wallet operations
"""
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import uuid


class WalletService:
    """Service class for wallet operations"""
    
    def __init__(self, db):
        self.db = db
    
    async def get_wallet(self, user_email: str, currency: str) -> Optional[Dict[str, Any]]:
        """Get a user's wallet for a specific currency"""
        return await self.db.wallets.find_one({
            "user_email": user_email,
            "currency": currency.upper()
        }, {"_id": 0})
    
    async def get_all_wallets(self, user_email: str) -> list:
        """Get all wallets for a user"""
        cursor = self.db.wallets.find({"user_email": user_email}, {"_id": 0})
        return await cursor.to_list(length=10)
    
    async def create_wallet(self, user_email: str, currency: str, initial_balance: float = 0) -> Dict[str, Any]:
        """Create a new wallet for a user"""
        wallet = {
            "id": str(uuid.uuid4()),
            "user_email": user_email,
            "currency": currency.upper(),
            "available_balance": initial_balance,
            "pending_balance": 0,
            "created_date": datetime.now(timezone.utc).isoformat()
        }
        await self.db.wallets.insert_one(wallet)
        return {k: v for k, v in wallet.items() if k != "_id"}
    
    async def get_or_create_wallet(self, user_email: str, currency: str) -> Dict[str, Any]:
        """Get existing wallet or create new one"""
        wallet = await self.get_wallet(user_email, currency)
        if not wallet:
            wallet = await self.create_wallet(user_email, currency)
        return wallet
    
    async def update_balance(
        self, 
        wallet_id: str, 
        available_delta: float = 0, 
        pending_delta: float = 0,
        set_available: Optional[float] = None,
        set_pending: Optional[float] = None
    ) -> bool:
        """Update wallet balances"""
        update_ops = {}
        
        if set_available is not None:
            update_ops["available_balance"] = set_available
        elif available_delta != 0:
            wallet = await self.db.wallets.find_one({"id": wallet_id})
            if wallet:
                update_ops["available_balance"] = wallet.get("available_balance", 0) + available_delta
        
        if set_pending is not None:
            update_ops["pending_balance"] = max(0, set_pending)
        elif pending_delta != 0:
            wallet = await self.db.wallets.find_one({"id": wallet_id})
            if wallet:
                update_ops["pending_balance"] = max(0, wallet.get("pending_balance", 0) + pending_delta)
        
        if update_ops:
            result = await self.db.wallets.update_one(
                {"id": wallet_id},
                {"$set": update_ops}
            )
            return result.modified_count > 0
        return False
    
    async def debit_wallet(self, wallet_id: str, amount: float, move_to_pending: bool = False) -> bool:
        """Debit amount from wallet"""
        wallet = await self.db.wallets.find_one({"id": wallet_id})
        if not wallet:
            return False
        
        new_available = wallet.get("available_balance", 0) - amount
        if new_available < 0:
            return False
        
        update_ops = {"available_balance": new_available}
        if move_to_pending:
            update_ops["pending_balance"] = wallet.get("pending_balance", 0) + amount
        
        await self.db.wallets.update_one({"id": wallet_id}, {"$set": update_ops})
        return True
    
    async def credit_wallet(self, wallet_id: str, amount: float, from_pending: bool = False) -> bool:
        """Credit amount to wallet"""
        wallet = await self.db.wallets.find_one({"id": wallet_id})
        if not wallet:
            return False
        
        update_ops = {"available_balance": wallet.get("available_balance", 0) + amount}
        if from_pending:
            update_ops["pending_balance"] = max(0, wallet.get("pending_balance", 0) - amount)
        
        await self.db.wallets.update_one({"id": wallet_id}, {"$set": update_ops})
        return True
    
    async def has_sufficient_balance(self, user_email: str, currency: str, amount: float) -> bool:
        """Check if user has sufficient balance"""
        wallet = await self.get_wallet(user_email, currency)
        if not wallet:
            return False
        return wallet.get("available_balance", 0) >= amount
    
    async def get_total_balance_in_usd(self, user_email: str, rates: Dict[str, float]) -> float:
        """Calculate total balance across all wallets in USD"""
        wallets = await self.get_all_wallets(user_email)
        total = 0.0
        
        for wallet in wallets:
            currency = wallet.get("currency", "USD")
            balance = wallet.get("available_balance", 0)
            
            if currency == "USD":
                total += balance
            elif currency in ["USDC", "USDT"]:
                total += balance  # Stablecoins = 1:1 with USD
            else:
                rate_key = f"{currency}_USD"
                rate = rates.get(rate_key, rates.get(f"{currency}-USD", 0))
                total += balance * rate
        
        return round(total, 2)

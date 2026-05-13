"""
Notification Service - Handles user notifications
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid


class NotificationService:
    """Service class for notification operations"""
    
    def __init__(self, db):
        self.db = db
    
    @staticmethod
    def get_timestamp() -> str:
        """Get current UTC timestamp in ISO format"""
        return datetime.now(timezone.utc).isoformat()
    
    async def create(
        self,
        user_email: str,
        title: str,
        message: str,
        notification_type: str = "general",
        reference_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new notification"""
        notification = {
            "id": str(uuid.uuid4()),
            "user_email": user_email,
            "title": title,
            "message": message,
            "type": notification_type,
            "is_read": False,
            "created_date": self.get_timestamp()
        }
        
        if reference_id:
            notification["reference_id"] = reference_id
        
        await self.db.notifications.insert_one(notification)
        return {k: v for k, v in notification.items() if k != "_id"}
    
    async def create_transaction_notification(
        self,
        user_email: str,
        title: str,
        message: str,
        tx_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a transaction-related notification"""
        return await self.create(
            user_email=user_email,
            title=title,
            message=message,
            notification_type="transaction",
            reference_id=tx_id
        )
    
    async def create_kyc_notification(
        self,
        user_email: str,
        title: str,
        message: str
    ) -> Dict[str, Any]:
        """Create a KYC-related notification"""
        return await self.create(
            user_email=user_email,
            title=title,
            message=message,
            notification_type="kyc"
        )
    
    async def create_security_notification(
        self,
        user_email: str,
        title: str,
        message: str
    ) -> Dict[str, Any]:
        """Create a security-related notification"""
        return await self.create(
            user_email=user_email,
            title=title,
            message=message,
            notification_type="security"
        )
    
    async def get_user_notifications(
        self, 
        user_email: str, 
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get notifications for a user"""
        query = {"user_email": user_email}
        if unread_only:
            query["is_read"] = False
        
        cursor = self.db.notifications.find(query, {"_id": 0}).sort("created_date", -1).limit(limit)
        return await cursor.to_list(length=limit)
    
    async def mark_as_read(self, notification_id: str) -> bool:
        """Mark a notification as read"""
        result = await self.db.notifications.update_one(
            {"id": notification_id},
            {"$set": {"is_read": True, "read_date": self.get_timestamp()}}
        )
        return result.modified_count > 0
    
    async def mark_all_as_read(self, user_email: str) -> int:
        """Mark all notifications as read for a user"""
        result = await self.db.notifications.update_many(
            {"user_email": user_email, "is_read": False},
            {"$set": {"is_read": True, "read_date": self.get_timestamp()}}
        )
        return result.modified_count
    
    async def get_unread_count(self, user_email: str) -> int:
        """Get count of unread notifications"""
        return await self.db.notifications.count_documents({
            "user_email": user_email,
            "is_read": False
        })


# Notification templates for common scenarios
class NotificationTemplates:
    """Pre-defined notification templates"""
    
    @staticmethod
    def swap_completed(from_amount: float, from_currency: str, to_amount: float, to_currency: str) -> Dict[str, str]:
        return {
            "title": "Swap Completed",
            "message": f"Swapped {from_amount} {from_currency} to {to_amount} {to_currency}"
        }
    
    @staticmethod
    def withdrawal_initiated(amount: float, currency: str) -> Dict[str, str]:
        return {
            "title": "Withdrawal Initiated",
            "message": f"Your {currency} withdrawal of {amount:,.2f} has been initiated."
        }
    
    @staticmethod
    def withdrawal_completed(amount: float, currency: str) -> Dict[str, str]:
        return {
            "title": "Withdrawal Completed",
            "message": f"Your {currency} withdrawal of {amount:,.2f} has been completed."
        }
    
    @staticmethod
    def withdrawal_failed(amount: float, currency: str, reason: str = "") -> Dict[str, str]:
        msg = f"Your {currency} withdrawal of {amount:,.2f} could not be processed."
        if reason:
            msg += f" Reason: {reason}"
        return {
            "title": "Withdrawal Failed",
            "message": msg
        }
    
    @staticmethod
    def deposit_confirmed(amount: float, currency: str) -> Dict[str, str]:
        return {
            "title": "Deposit Confirmed",
            "message": f"{currency} {amount:,.2f} has been credited to your wallet."
        }
    
    @staticmethod
    def kyc_approved() -> Dict[str, str]:
        return {
            "title": "Identity Verified",
            "message": "Your identity has been verified. You can now use all Pursible features."
        }
    
    @staticmethod
    def kyc_rejected(reason: str = "") -> Dict[str, str]:
        msg = "Your identity verification was unsuccessful."
        if reason:
            msg += f" Reason: {reason}"
        return {
            "title": "Verification Failed",
            "message": msg
        }

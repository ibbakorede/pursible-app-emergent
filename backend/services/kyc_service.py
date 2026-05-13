"""
KYC Service - Handles KYC verification operations
"""
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import uuid


class KYCService:
    """Service class for KYC operations"""
    
    def __init__(self, db):
        self.db = db
    
    @staticmethod
    def get_timestamp() -> str:
        """Get current UTC timestamp in ISO format"""
        return datetime.now(timezone.utc).isoformat()
    
    async def get_kyc_record(self, user_email: str) -> Optional[Dict[str, Any]]:
        """Get KYC record for a user"""
        return await self.db.kyc_records.find_one(
            {"user_email": user_email}, 
            {"_id": 0}
        )
    
    async def is_verified(self, user_email: str) -> bool:
        """Check if user has approved KYC"""
        kyc = await self.get_kyc_record(user_email)
        return kyc is not None and kyc.get("status") == "approved"
    
    async def check_kyc_requirement(self, user_email: str) -> Dict[str, Any]:
        """Check KYC status and return blocking response if not verified"""
        if not await self.is_verified(user_email):
            return {
                "blocked": True,
                "response": {
                    "success": False,
                    "kycBlocked": True,
                    "error": "Identity verification required",
                    "redirectTo": "/kyc"
                }
            }
        return {"blocked": False}
    
    def validate_kyc_data(self, kyc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate KYC submission data"""
        errors = []
        
        required_fields = ["full_name"]
        for field in required_fields:
            value = kyc_data.get(field, "")
            if not value or not str(value).strip():
                errors.append(f"{field.replace('_', ' ').title()} is required")
        
        if errors:
            return {"valid": False, "errors": errors}
        return {"valid": True, "errors": []}
    
    def build_kyc_payload(self, user_email: str, kyc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build KYC record payload from submission data"""
        return {
            "user_email": user_email,
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
            "updated_date": self.get_timestamp()
        }
    
    async def submit_kyc(
        self, 
        user_email: str, 
        kyc_data: Dict[str, Any],
        auto_approve: bool = False
    ) -> Dict[str, Any]:
        """Submit KYC for verification"""
        timestamp = self.get_timestamp()
        
        # Check for existing record
        existing = await self.get_kyc_record(user_email)
        
        # Build payload
        payload = self.build_kyc_payload(user_email, kyc_data)
        
        if auto_approve:
            payload["status"] = "approved"
            payload["timeline"] = [
                {"status": "in_review", "timestamp": timestamp, "note": "Submitted for verification"},
                {"status": "approved", "timestamp": timestamp, "note": "Auto-approved (test mode)"}
            ]
        else:
            payload["status"] = "in_review"
            payload["timeline"] = [
                {"status": "in_review", "timestamp": timestamp, "note": "Submitted for verification"}
            ]
        
        if existing:
            await self.db.kyc_records.update_one(
                {"id": existing["id"]}, 
                {"$set": payload}
            )
            kyc_id = existing["id"]
        else:
            payload["id"] = str(uuid.uuid4())
            payload["created_date"] = timestamp
            await self.db.kyc_records.insert_one(payload)
            kyc_id = payload["id"]
        
        return {
            "id": kyc_id,
            "status": payload["status"],
            "approved": payload["status"] == "approved"
        }
    
    async def approve_kyc(self, user_email: str, note: str = "Verification approved") -> bool:
        """Approve a user's KYC"""
        timestamp = self.get_timestamp()
        
        kyc = await self.get_kyc_record(user_email)
        if not kyc:
            return False
        
        timeline = kyc.get("timeline", [])
        timeline.append({
            "status": "approved",
            "timestamp": timestamp,
            "note": note
        })
        
        await self.db.kyc_records.update_one(
            {"user_email": user_email},
            {"$set": {
                "status": "approved",
                "timeline": timeline,
                "updated_date": timestamp
            }}
        )
        
        # Update user's KYC status
        await self.db.users.update_one(
            {"email": user_email},
            {"$set": {"kyc_status": "verified"}}
        )
        
        return True
    
    async def reject_kyc(self, user_email: str, reason: str) -> bool:
        """Reject a user's KYC"""
        timestamp = self.get_timestamp()
        
        kyc = await self.get_kyc_record(user_email)
        if not kyc:
            return False
        
        timeline = kyc.get("timeline", [])
        timeline.append({
            "status": "rejected",
            "timestamp": timestamp,
            "note": reason
        })
        
        await self.db.kyc_records.update_one(
            {"user_email": user_email},
            {"$set": {
                "status": "rejected",
                "rejection_reason": reason,
                "timeline": timeline,
                "updated_date": timestamp
            }}
        )
        
        return True
    
    async def update_user_kyc_status(self, user_email: str, status: str) -> bool:
        """Update user's KYC status field"""
        result = await self.db.users.update_one(
            {"email": user_email},
            {"$set": {"kyc_status": status}}
        )
        return result.modified_count > 0

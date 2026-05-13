"""
Admin Audit Service
Provides centralized audit logging for all admin actions.

DESIGN PRINCIPLE: Log BEFORE mutation, fail if logging fails.
This ensures no admin action can succeed without being logged.
"""
import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import Request, HTTPException


class AuditService:
    """
    Service for logging admin actions.
    
    Usage:
        # In an admin endpoint:
        audit_id = await audit_service.log_admin_action(
            admin=user,
            action_type="kyc.approve",
            target_resource_type="KYCRecord",
            target_resource_id=kyc_id,
            reason="Documents verified successfully",
            metadata={"before": {"status": "pending"}, "after": {"status": "approved"}},
            request=request
        )
        # Only proceed with mutation if logging succeeds
        await kyc_service.approve_kyc(...)
    """
    
    def __init__(self, db):
        self.db = db
        self.collection = db.admin_audit_logs
    
    async def ensure_indexes(self):
        """Create indexes for efficient queries. Call on startup."""
        await self.collection.create_index([("admin_user_id", 1), ("created_at", -1)])
        await self.collection.create_index([("target_resource_type", 1), ("target_resource_id", 1)])
        await self.collection.create_index([("action_type", 1)])
        await self.collection.create_index([("created_at", -1)])
    
    async def log_admin_action(
        self,
        admin: Dict[str, Any],
        action_type: str,
        target_resource_type: str,
        target_resource_id: str,
        reason: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None,
    ) -> str:
        """
        Write an admin audit log entry. Returns the audit log ID.
        
        CRITICAL: This function NEVER fails silently. If logging fails,
        it raises an exception. Admin endpoints should call this BEFORE
        performing the mutation. If logging fails, the mutation aborts.
        
        Args:
            admin: The admin user dict (must have 'id' and 'email')
            action_type: Action identifier (e.g., "kyc.approve", "user.freeze")
            target_resource_type: Entity type being affected
            target_resource_id: ID of the entity being affected
            reason: Human-readable reason for the action
            metadata: Optional dict with before/after state, extra context
            request: Optional FastAPI Request for IP/user-agent extraction
        
        Returns:
            The audit log entry ID (UUID string)
        
        Raises:
            HTTPException: If logging fails for any reason
        """
        if not admin or not admin.get("id") or not admin.get("email"):
            raise HTTPException(
                status_code=500, 
                detail="Audit logging failed: invalid admin context"
            )
        
        audit_id = str(uuid.uuid4())
        
        # Extract request metadata
        ip_address = None
        user_agent = None
        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
        
        entry = {
            "id": audit_id,
            "admin_user_id": admin["id"],
            "admin_email": admin["email"],
            "action_type": action_type,
            "target_resource_type": target_resource_type,
            "target_resource_id": target_resource_id,
            "reason": reason,
            "metadata": metadata or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        try:
            await self.collection.insert_one(entry)
        except Exception as e:
            # Never fail silently - if we can't log, abort the operation
            raise HTTPException(
                status_code=500,
                detail=f"Audit logging failed: {str(e)}. Operation aborted."
            )
        
        return audit_id
    
    async def get_audit_logs(
        self,
        admin_user_id: Optional[str] = None,
        action_type: Optional[str] = None,
        target_resource_type: Optional[str] = None,
        target_resource_id: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Dict[str, Any]:
        """
        Fetch audit logs with filtering and pagination.
        
        Returns:
            {
                "items": [...],
                "total": int,
                "page": int,
                "page_size": int
            }
        """
        query = {}
        
        if admin_user_id:
            query["admin_user_id"] = admin_user_id
        if action_type:
            query["action_type"] = action_type
        if target_resource_type:
            query["target_resource_type"] = target_resource_type
        if target_resource_id:
            query["target_resource_id"] = target_resource_id
        if from_date:
            query["created_at"] = {"$gte": from_date.isoformat()}
        if to_date:
            if "created_at" in query:
                query["created_at"]["$lte"] = to_date.isoformat()
            else:
                query["created_at"] = {"$lte": to_date.isoformat()}
        
        # Get total count
        total = await self.collection.count_documents(query)
        
        # Calculate skip
        skip = (page - 1) * page_size
        
        # Fetch items
        cursor = self.collection.find(query, {"_id": 0})
        cursor = cursor.sort("created_at", -1)  # Most recent first
        cursor = cursor.skip(skip).limit(page_size)
        
        items = await cursor.to_list(page_size)
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    
    async def get_audit_log_by_id(self, audit_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single audit log entry by ID."""
        return await self.collection.find_one({"id": audit_id}, {"_id": 0})

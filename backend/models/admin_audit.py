"""
Admin Audit Log Model
Tracks all admin actions for compliance and security auditing.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime, timezone


class AdminAuditLog(BaseModel):
    """Schema for admin audit log entries"""
    id: str = Field(..., description="Unique audit log ID (UUID)")
    admin_user_id: str = Field(..., description="ID of the admin performing the action")
    admin_email: str = Field(..., description="Email of the admin performing the action")
    action_type: str = Field(..., description="Action type, e.g. 'kyc.approve', 'withdrawal.reject', 'user.freeze'")
    target_resource_type: str = Field(..., description="Resource type, e.g. 'KYCRecord', 'Transaction', 'User'")
    target_resource_id: str = Field(..., description="ID of the affected resource")
    reason: Optional[str] = Field(None, description="Reason for the action (required for most actions)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Before/after snapshots, flexible data")
    ip_address: Optional[str] = Field(None, description="IP address of the admin")
    user_agent: Optional[str] = Field(None, description="User agent string")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AuditLogQuery(BaseModel):
    """Query parameters for fetching audit logs"""
    admin_user_id: Optional[str] = None
    action_type: Optional[str] = None
    target_resource_type: Optional[str] = None
    target_resource_id: Optional[str] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=200)


class AuditLogResponse(BaseModel):
    """Paginated response for audit log queries"""
    items: list
    total: int
    page: int
    page_size: int

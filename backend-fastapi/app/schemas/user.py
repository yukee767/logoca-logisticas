"""
app/schemas/user.py
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.CUSTOMER
    company_id: Optional[UUID] = None
    phone: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    company_id: Optional[UUID] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: UUID
    name: str
    email: str
    role: UserRole
    company_id: Optional[UUID] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

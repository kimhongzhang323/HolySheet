from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum as SQLEnum, ARRAY, JSON
from sqlalchemy.dialects.postgresql import UUID
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

from ..db import Base


class UserRole(str, Enum):
    USER = "user"
    VOLUNTEER = "volunteer"
    STAFF = "staff"
    ADMIN = "admin"


class MembershipTier(str, Enum):
    AD_HOC = "ad-hoc"
    WEEKLY = "weekly"
    ONCE_A_WEEK = "once-a-week"
    TWICE_A_WEEK = "twice-a-week"
    THREE_PLUS_A_WEEK = "three-plus-a-week"


# SQLAlchemy ORM Model
class UserDB(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    password = Column(String(255), nullable=True)  # Hashed password
    image = Column(String(500), nullable=True)
    role = Column(String(50), default="user")
    tier = Column(String(50), default="ad-hoc")
    skills = Column(ARRAY(String), default=[])
    phone_number = Column(String(50), nullable=True)
    is_verified = Column(Boolean, default=False)
    address = Column(JSON, nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(255), default="Singapore")
    profile_deadline = Column(DateTime, nullable=True)
    email_verified = Column(DateTime, nullable=True)
    otp = Column(String(10), nullable=True)
    otp_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # User Stats
    total_events = Column(Integer, default=0)
    volunteer_count = Column(Integer, default=0)
    meetups_count = Column(Integer, default=0)
    volunteer_hours = Column(Integer, default=0)

    # Achievements Progress (JSON array of achievement objects)
    achievements = Column(JSON, default=[])


# Pydantic Models for API
class Address(BaseModel):
    street: Optional[str] = None
    unit: Optional[str] = None
    postalCode: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None


class UserBase(BaseModel):
    name: str
    email: EmailStr
    image: Optional[str] = None
    role: str = "user"
    tier: str = "ad-hoc"
    skills: List[str] = []
    phoneNumber: Optional[str] = Field(None, alias="phone_number")
    isVerified: bool = Field(False, alias="is_verified")
    address: Optional[dict] = None  # Changed to dict for JSON compatibility
    bio: Optional[str] = None
    location: str = "Singapore"
    profileDeadline: Optional[datetime] = Field(None, alias="profile_deadline")
    emailVerified: Optional[datetime] = None
    
    # New Stats & Achievements
    total_events: int = 0
    volunteer_count: int = 0
    meetups_count: int = 0
    volunteer_hours: int = 0
    achievements: List[dict] = []


class UserCreate(UserBase):
    password: str


class UserInDB(UserBase):
    id: Optional[str] = None
    password: Optional[str] = None
    otp: Optional[str] = None
    otpExpires: Optional[datetime] = None


class UserResponse(UserBase):
    id: Optional[str] = None

    class Config:
        from_attributes = True

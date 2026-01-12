from pydantic import BaseModel, EmailStr, Field, BeforeValidator
from typing import Optional, List, Annotated
from datetime import datetime
from enum import Enum

# Helper to handle ObjectId as string
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserRole(str, Enum):
    USER = "user"
    VOLUNTEER = "volunteer"
    STAFF = "staff"
    ADMIN = "admin"

class MembershipTier(str, Enum):
    AD_HOC = "ad-hoc"
    WEEKLY = "weekly"  # Legacy - for backward compatibility
    ONCE_A_WEEK = "once-a-week"
    TWICE_A_WEEK = "twice-a-week"
    THREE_PLUS_A_WEEK = "three-plus-a-week"

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
    role: UserRole = UserRole.USER
    tier: MembershipTier = MembershipTier.AD_HOC
    skills: List[str] = []
    phoneNumber: Optional[str] = None
    isVerified: bool = False
    address: Optional[Address] = None
    profileDeadline: Optional[datetime] = None
    emailVerified: Optional[datetime] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    password: Optional[str] = None  # Hashed
    otp: Optional[str] = None
    otpExpires: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class UserResponse(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

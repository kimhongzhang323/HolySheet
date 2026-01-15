from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from typing import Optional, List, Dict, Annotated
from datetime import datetime
from enum import Enum
from .user import MembershipTier

PyObjectId = Annotated[str, BeforeValidator(str)]

class ActivityBase(BaseModel):
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    location: str
    capacity: int
    organiser: Optional[str] = None  # Event organiser name
    volunteers_needed: int = 0
    needs_help: bool = False
    metadata: Optional[Dict[str, str]] = None
    allowed_tiers: Optional[List[MembershipTier]] = None
    volunteers_registered: int = 0  # Track current volunteer count
    attendees: Optional[List[str]] = []  # List of user IDs who attended
    qr_code: Optional[str] = None  # QR code data for check-in
    skills_required: Optional[List[str]] = []  # Required skills for volunteers

class ActivityCreate(ActivityBase):
    pass

class ActivityInDB(ActivityBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )

class ActivityResponse(ActivityBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

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
    volunteers_needed: int = 0
    needs_help: bool = False
    metadata: Optional[Dict[str, str]] = None
    allowed_tiers: Optional[List[MembershipTier]] = None

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

"""
Staff Assignment Model

Links staff members (identified by Google email) to activities/events.
"""

from pydantic import BaseModel, EmailStr, Field, BeforeValidator, ConfigDict
from typing import Optional, Annotated
from datetime import datetime
from enum import Enum

PyObjectId = Annotated[str, BeforeValidator(str)]


class StaffRole(str, Enum):
    COORDINATOR = "coordinator"
    ASSISTANT = "assistant"
    VOLUNTEER = "volunteer"


class StaffAssignmentBase(BaseModel):
    staff_email: EmailStr
    staff_name: str
    activity_id: PyObjectId
    role: StaffRole = StaffRole.ASSISTANT


class StaffAssignmentCreate(BaseModel):
    staff_email: EmailStr
    staff_name: str
    activity_id: str
    role: StaffRole = StaffRole.ASSISTANT


class StaffAssignmentInDB(StaffAssignmentBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_by: Optional[PyObjectId] = None  # Admin who made the assignment

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class StaffAssignmentResponse(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    staff_email: EmailStr
    staff_name: str
    activity_id: str
    role: StaffRole
    assigned_at: datetime

    model_config = ConfigDict(populate_by_name=True)

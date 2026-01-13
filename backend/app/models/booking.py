from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from typing import Optional, Dict, Any, Annotated
from datetime import datetime
from enum import Enum

PyObjectId = Annotated[str, BeforeValidator(str)]


class BookingStatus(str, Enum):
    CONFIRMED = "confirmed"
    ATTENDED = "attended"
    CANCELLED = "cancelled"


class BookingBase(BaseModel):
    user_id: PyObjectId
    activity_id: PyObjectId
    status: BookingStatus = BookingStatus.CONFIRMED
    timestamp: datetime = Field(default_factory=datetime.now)
    # Form responses for custom registration fields (wheelchair, caregiver, etc.)
    form_responses: Optional[Dict[str, Any]] = None


class BookingCreate(BaseModel):
    activity_id: str
    form_responses: Optional[Dict[str, Any]] = None  # Custom form data


class BookingInDB(BookingBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class BookingResponse(BookingBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(populate_by_name=True)

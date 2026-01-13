from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from typing import Optional, List, Dict, Any, Annotated
from datetime import datetime
from enum import Enum
from .user import MembershipTier

PyObjectId = Annotated[str, BeforeValidator(str)]


class FormFieldType(str, Enum):
    BOOLEAN = "boolean"
    TEXT = "text"
    SELECT = "select"
    NUMBER = "number"
    DATE = "date"


class CustomFormField(BaseModel):
    """Custom form field for activity registration (e.g., wheelchair access, dietary needs)."""
    field_name: str  # Internal identifier, e.g., "wheelchair_access"
    field_type: FormFieldType = FormFieldType.BOOLEAN
    label: str  # Display label, e.g., "Do you require wheelchair access?"
    required: bool = False
    options: Optional[List[str]] = None  # For SELECT type
    placeholder: Optional[str] = None  # For TEXT type


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
    # New fields for staff and registration forms
    assigned_staff: List[str] = []  # List of staff emails assigned to this activity
    custom_form_fields: Optional[List[CustomFormField]] = None  # Registration form fields


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    """Partial update model for activities."""
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    organiser: Optional[str] = None
    volunteers_needed: Optional[int] = None
    needs_help: Optional[bool] = None
    metadata: Optional[Dict[str, str]] = None
    allowed_tiers: Optional[List[MembershipTier]] = None
    assigned_staff: Optional[List[str]] = None
    custom_form_fields: Optional[List[CustomFormField]] = None


class ActivityInDB(ActivityBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class ActivityResponse(ActivityBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

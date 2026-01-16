from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ARRAY, JSON, Float
from sqlalchemy.dialects.postgresql import UUID
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime
import uuid

from ..db import Base


# SQLAlchemy ORM Model
class ActivityDB(Base):
    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    location = Column(String(500), nullable=True)
    capacity = Column(Integer, default=20)
    volunteers_needed = Column(Integer, default=5)
    volunteers_registered = Column(Integer, default=0)
    needs_help = Column(Boolean, default=False)
    attendees = Column(ARRAY(String), default=[])
    skills_required = Column(ARRAY(String), default=[])
    image_url = Column(String(500), nullable=True)
    organiser = Column(String(255), nullable=True)
    activity_type = Column(String(50), default="volunteer") # volunteer, meetup
    status = Column(String(50), default="published")
    created_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    volunteer_form = Column(JSON, nullable=True) # JSON structure for custom application form
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)


# Pydantic Models for API
class ActivityBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: int = 20
    volunteers_needed: int = 5
    volunteers_registered: int = 0
    needs_help: bool = False
    attendees: List[str] = []
    skills_required: List[str] = []
    image_url: Optional[str] = None
    organiser: Optional[str] = None
    activity_type: str = "volunteer"
    status: str = "published"
    volunteer_form: Optional[Dict] = None


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: Optional[int] = None
    volunteers_needed: Optional[int] = None
    needs_help: Optional[bool] = None
    skills_required: Optional[List[str]] = None
    image_url: Optional[str] = None
    organiser: Optional[str] = None
    activity_type: Optional[str] = None
    status: Optional[str] = None
    volunteer_form: Optional[Dict] = None


class ActivityInDB(ActivityBase):
    id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ActivityResponse(ActivityBase):
    id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )

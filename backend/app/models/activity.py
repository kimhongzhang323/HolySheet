from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ARRAY, JSON
from sqlalchemy.dialects.postgresql import UUID
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
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
    status = Column(String(50), default="published")
    created_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Pydantic Models for API
class ActivityBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    capacity: int = 20
    volunteers_needed: int = 5
    volunteers_registered: int = 0
    needs_help: bool = False
    attendees: List[str] = []
    skills_required: List[str] = []
    image_url: Optional[str] = None
    organiser: Optional[str] = None
    status: str = "published"


class ActivityCreate(ActivityBase):
    pass


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

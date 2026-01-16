from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid

from ..db import Base

class VolunteerDB(Base):
    __tablename__ = "event_volunteers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_id = Column(UUID(as_uuid=True), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(100), default="Volunteer") # e.g., Senior Volunteer, Coordinator
    status = Column(String(50), default="pending") # pending, confirmed, withdrawn
    applied_at = Column(DateTime, default=datetime.utcnow)
    skills_offered = Column(ARRAY(String), default=[])

class VolunteerBase(BaseModel):
    activity_id: str
    role: str = "Volunteer"
    skills_offered: List[str] = []

class VolunteerCreate(VolunteerBase):
    pass

class VolunteerResponse(VolunteerBase):
    id: str
    user_id: str
    status: str
    applied_at: datetime

    model_config = ConfigDict(from_attributes=True)

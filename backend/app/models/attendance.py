from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
import uuid

from ..db import Base

class AttendanceDB(Base):
    __tablename__ = "attendance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_id = Column(UUID(as_uuid=True), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False, index=True)
    check_in_time = Column(DateTime, default=datetime.utcnow)
    verified_by = Column(UUID(as_uuid=True), nullable=True) # ID of admin/staff who verified
    hours_earned = Column(Integer, default=0)

class AttendanceBase(BaseModel):
    user_id: str
    activity_id: str

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: str
    check_in_time: datetime
    hours_earned: int

    model_config = ConfigDict(from_attributes=True)

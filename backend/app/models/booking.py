from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from ..db import Base


# SQLAlchemy ORM Model
class BookingDB(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    activity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    status = Column(String(50), default="confirmed")  # confirmed, cancelled, attended
    booked_at = Column(DateTime, default=datetime.utcnow)
    cancelled_at = Column(DateTime, nullable=True)
    attended = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)


# Pydantic Models for API
class BookingBase(BaseModel):
    activity_id: str
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingResponse(BookingBase):
    id: Optional[str] = None
    user_id: Optional[str] = None
    status: str = "confirmed"
    booked_at: Optional[datetime] = None

    class Config:
        from_attributes = True

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime
import uuid

from ..db import Base

class FormResponseDB(Base):
    __tablename__ = "form_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    activity_id = Column(UUID(as_uuid=True), ForeignKey("activities.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    responses = Column(JSON, nullable=False) # Store Q&A as JSON
    submitted_at = Column(DateTime, default=datetime.utcnow)

class FormResponseCreate(BaseModel):
    activity_id: str
    responses: Dict

class FormResponseRead(FormResponseCreate):
    id: str
    user_id: str
    submitted_at: datetime

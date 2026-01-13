"""
AI Memory Model

Stores past event forms and requirements for RAG-based form generation.
The AI uses this memory to suggest better form fields based on similar past events.
"""

from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from typing import Optional, List, Dict, Any, Annotated
from datetime import datetime
from enum import Enum

PyObjectId = Annotated[str, BeforeValidator(str)]


class EventCategory(str, Enum):
    """Categories for event memory classification."""
    ARTS_CRAFTS = "arts_crafts"
    MUSIC = "music"
    SPORTS = "sports"
    COOKING = "cooking"
    WELLNESS = "wellness"
    SOCIAL = "social"
    OUTDOOR = "outdoor"
    EDUCATIONAL = "educational"
    THERAPY = "therapy"
    OTHER = "other"


class FormFieldMemory(BaseModel):
    """A remembered form field from a past event."""
    field_name: str
    field_type: str
    label: str
    required: bool = False
    options: Optional[List[str]] = None
    usage_count: int = 1  # How many times this field was used


class EventMemory(BaseModel):
    """
    Memory of a past event and its registration form.
    Used for RAG to improve form generation for similar events.
    """
    event_title: str
    event_description: str
    category: EventCategory
    keywords: List[str]  # Extracted keywords for similarity matching
    form_fields: List[FormFieldMemory]
    
    # Metadata
    source_activity_id: Optional[str] = None  # Original activity ID if applicable
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used: datetime = Field(default_factory=datetime.utcnow)
    usage_count: int = 1  # How many times this memory was referenced
    success_rate: float = 1.0  # How often users completed forms with these fields
    
    # Context for better matching
    location_type: Optional[str] = None  # "indoor", "outdoor", "virtual"
    target_audience: Optional[str] = None  # "elderly", "youth", "all"
    accessibility_flags: List[str] = []  # ["wheelchair", "hearing_aid", etc.]


class EventMemoryInDB(EventMemory):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class EventMemoryCreate(BaseModel):
    """Schema for creating a new event memory."""
    event_title: str
    event_description: str
    category: EventCategory
    keywords: List[str]
    form_fields: List[FormFieldMemory]
    location_type: Optional[str] = None
    target_audience: Optional[str] = None
    accessibility_flags: List[str] = []


class MemorySearchResult(BaseModel):
    """Result from memory search."""
    memory: EventMemoryInDB
    similarity_score: float
    matched_keywords: List[str]

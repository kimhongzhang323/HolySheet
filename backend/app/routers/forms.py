"""
Forms Router

API endpoints for AI-powered form generation and form response handling.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
from google import genai
from ..config import get_settings
from ..db import get_database
from ..models.user import UserResponse, UserRole
from ..dependencies import get_current_user
from ..services.form_generator import (
    generate_form_questions,
    parse_form_responses,
    save_form_to_activity,
    FormQuestion,
    GeneratedForm
)

settings = get_settings()
router = APIRouter(prefix="/forms", tags=["Forms"])

# Initialize Gemini client
client = None
if settings.GOOGLE_GENERATIVE_AI_API_KEY:
    client = genai.Client(api_key=settings.GOOGLE_GENERATIVE_AI_API_KEY)


class GenerateFormRequest(BaseModel):
    activity_id: str
    custom_context: Optional[str] = None  # Additional context for AI
    save_to_activity: bool = False  # Whether to save generated form to activity


class ParseFormRequest(BaseModel):
    activity_id: str
    responses: Dict[str, Any]


class FormQuestionResponse(BaseModel):
    field_name: str
    field_type: str
    label: str
    required: bool
    options: Optional[List[str]] = None
    placeholder: Optional[str] = None


class GeneratedFormResponse(BaseModel):
    activity_id: str
    activity_title: str
    form_title: str
    form_description: str
    questions: List[FormQuestionResponse]
    generated_at: datetime
    ai_confidence: float


@router.post("/generate", response_model=GeneratedFormResponse)
async def generate_activity_form(
    request: GenerateFormRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Generate form questions for an activity using AI.
    
    The AI analyzes the activity description and generates relevant
    registration questions in JSON format.
    
    - **activity_id**: ID of the activity to generate form for
    - **custom_context**: Optional additional context for the AI
    - **save_to_activity**: If true, saves generated form to activity (staff/admin only)
    """
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured"
        )
    
    if not ObjectId.is_valid(request.activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    activity = await db.activities.find_one({"_id": ObjectId(request.activity_id)})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Generate form using AI with RAG from past events
    generated_form = await generate_form_questions(
        client=client,
        activity=activity,
        custom_context=request.custom_context,
        db=db  # Pass db for RAG queries
    )
    
    # Optionally save to activity (staff/admin only)
    if request.save_to_activity:
        if current_user.role not in [UserRole.STAFF, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only staff/admin can save forms to activities"
            )
        await save_form_to_activity(db, request.activity_id, generated_form)
    
    return GeneratedFormResponse(
        activity_id=generated_form.activity_id,
        activity_title=generated_form.activity_title,
        form_title=generated_form.form_title,
        form_description=generated_form.form_description,
        questions=[FormQuestionResponse(**q.model_dump()) for q in generated_form.questions],
        generated_at=generated_form.generated_at,
        ai_confidence=generated_form.ai_confidence
    )


@router.get("/{activity_id}", response_model=GeneratedFormResponse)
async def get_activity_form(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get the registration form for an activity.
    
    Returns saved form if exists, or generates a new one.
    """
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Check if activity has saved form questions
    saved_questions = activity.get("custom_form_fields", [])
    
    if saved_questions:
        # Return saved form
        return GeneratedFormResponse(
            activity_id=str(activity["_id"]),
            activity_title=activity.get("title", "Unknown"),
            form_title="Registration Form",
            form_description="Please complete the following questions",
            questions=[FormQuestionResponse(**q) for q in saved_questions],
            generated_at=activity.get("form_generated_at", datetime.utcnow()),
            ai_confidence=activity.get("form_ai_confidence", 1.0)
        )
    
    # Generate new form if no saved form exists
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured and no saved form exists"
        )
    
    generated_form = await generate_form_questions(
        client=client,
        activity=activity,
        db=db  # Pass db for RAG queries
    )
    
    return GeneratedFormResponse(
        activity_id=generated_form.activity_id,
        activity_title=generated_form.activity_title,
        form_title=generated_form.form_title,
        form_description=generated_form.form_description,
        questions=[FormQuestionResponse(**q.model_dump()) for q in generated_form.questions],
        generated_at=generated_form.generated_at,
        ai_confidence=generated_form.ai_confidence
    )


@router.post("/validate")
async def validate_form_responses(
    request: ParseFormRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Validate form responses against the activity's form questions.
    
    Returns validation result with any errors.
    """
    if not ObjectId.is_valid(request.activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    activity = await db.activities.find_one({"_id": ObjectId(request.activity_id)})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Get form questions
    saved_questions = activity.get("custom_form_fields", [])
    
    if not saved_questions:
        # No form questions defined, accept any responses
        return {
            "valid": True,
            "data": request.responses,
            "errors": []
        }
    
    # Convert to FormQuestion objects
    questions = [FormQuestion(**q) for q in saved_questions]
    
    # Parse and validate
    result = parse_form_responses(questions, request.responses)
    
    return result


@router.post("/{activity_id}/submit")
async def submit_form_and_book(
    activity_id: str,
    responses: Dict[str, Any],
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Submit form responses and create a booking.
    
    Validates responses, creates booking with form data.
    """
    from ..services.tier import can_user_book
    from ..services.calendar import generate_google_calendar_link
    
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Validate form responses
    saved_questions = activity.get("custom_form_fields", [])
    if saved_questions:
        questions = [FormQuestion(**q) for q in saved_questions]
        validation = parse_form_responses(questions, responses)
        
        if not validation["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"errors": validation["errors"]}
            )
        
        form_data = validation["data"]
    else:
        form_data = responses
    
    # Check tier limits
    from ..models.user import MembershipTier
    user_tier = current_user.tier or MembershipTier.AD_HOC
    allowed_tiers = activity.get("allowed_tiers", [])
    
    tier_check = await can_user_book(
        user_tier,
        str(current_user.id),
        [MembershipTier(t) for t in allowed_tiers] if allowed_tiers else None,
        db
    )
    
    if not tier_check["allowed"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=tier_check["message"]
        )
    
    # Create booking with form responses
    booking = {
        "user_id": str(current_user.id),
        "activity_id": str(activity["_id"]),
        "status": "confirmed",
        "timestamp": datetime.utcnow(),
        "form_responses": form_data if form_data else None
    }
    
    result = await db.bookings.insert_one(booking)
    
    # Generate calendar link
    from datetime import timedelta
    calendar_link = generate_google_calendar_link(
        activity.get("title", "Activity"),
        activity.get("description", ""),
        activity.get("location", ""),
        activity["start_time"],
        activity.get("end_time", activity["start_time"] + timedelta(hours=1))
    )
    
    return {
        "message": "Booking successful!",
        "booking_id": str(result.inserted_id),
        "activity": activity.get("title"),
        "date": activity["start_time"].isoformat(),
        "form_responses_saved": bool(form_data),
        "calendar_link": calendar_link
    }


# ==================== MEMORY ENDPOINTS ====================

@router.get("/memory/stats")
async def get_memory_stats(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get statistics about the event memory store.
    Shows how many memories are available for RAG.
    """
    from ..services.memory import get_memory_stats
    stats = await get_memory_stats(db)
    return stats


@router.get("/memory/search")
async def search_event_memories(
    query: str,
    limit: int = 5,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Search event memories for similar past events.
    Used for debugging RAG functionality.
    """
    from ..services.memory import search_memories
    
    results = await search_memories(db, query, limit=limit)
    
    return {
        "query": query,
        "results_count": len(results),
        "results": [
            {
                "event_title": r.memory.event_title,
                "category": r.memory.category,
                "similarity_score": r.similarity_score,
                "matched_keywords": r.matched_keywords,
                "form_fields": [f.field_name for f in r.memory.form_fields]
            }
            for r in results
        ]
    }

from fastapi import APIRouter, Depends, HTTPException, status, Body
from datetime import datetime, timedelta
from collections import defaultdict
from time import time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from uuid import UUID

from ..db import get_database
from ..models.user import UserDB, UserResponse
from ..models.activity import ActivityDB
from ..dependencies import get_current_user
from ..services import ai as ai_service

router = APIRouter()

request_counts = defaultdict(list)
RATE_LIMIT = 10
RATE_WINDOW = 60


def is_admin_or_staff(role: str) -> bool:
    return role in ["admin", "staff"]


def check_rate_limit(user_id: str) -> bool:
    now = time()
    request_counts[user_id] = [t for t in request_counts[user_id] if now - t < RATE_WINDOW]
    if len(request_counts[user_id]) >= RATE_LIMIT:
        return False
    request_counts[user_id].append(now)
    return True


@router.post("/admin/ai/summarize-feedback")
async def summarize_feedback(
    start_date: str = Body(None),
    end_date: str = Body(None),
    activity_id: str = Body(None),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if not check_rate_limit(str(current_user.id)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # Mock feedback
    feedback_list = [
        "The AC in Hall B is too cold.",
        "Great yoga session.",
        "Need more vegetarian options."
    ]
    
    summary = await ai_service.summarize_feedback(feedback_list)
    
    return {
        "summary": summary,
        "total_feedback": len(feedback_list),
        "date_range": {"start": start_date, "end": end_date}
    }


@router.post("/admin/ai/match-volunteers")
async def match_volunteers_for_activity(
    activity_id: str = Body(..., embed=True),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if not check_rate_limit(str(current_user.id)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        uuid_id = UUID(activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    result = await db.execute(select(ActivityDB).where(ActivityDB.id == uuid_id))
    activity = result.scalar_one_or_none()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    vol_result = await db.execute(select(UserDB).where(UserDB.role == "volunteer"))
    volunteers = vol_result.scalars().all()
    
    # Format for AI service
    vol_dicts = [{"name": v.name, "skills": v.skills or []} for v in volunteers]
    act_dict = {"title": activity.title, "skills_required": activity.skills_required or []}
    
    matches = await ai_service.match_volunteers(act_dict, vol_dicts)
    
    return {
        "activity_id": str(activity.id),
        "activity_title": activity.title,
        "skills_required": activity.skills_required or [],
        "total_volunteers_found": len(volunteers),
        "matches": matches[:10]
    }


@router.post("/admin/ai/query")
async def process_natural_language_query(
    query: str = Body(..., embed=True),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if not check_rate_limit(str(current_user.id)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    now = datetime.utcnow()
    week_from_now = now + timedelta(days=7)
    
    # Get counts
    upcoming_result = await db.execute(
        select(func.count()).select_from(ActivityDB).where(
            and_(ActivityDB.start_time >= now, ActivityDB.start_time <= week_from_now)
        )
    )
    upcoming_count = upcoming_result.scalar() or 0
    
    vol_result = await db.execute(
        select(func.count()).select_from(UserDB).where(UserDB.role == "volunteer")
    )
    volunteer_count = vol_result.scalar() or 0
    
    context = {
        "current_date": now.strftime("%Y-%m-%d"),
        "upcoming_activities_this_week": upcoming_count,
        "total_volunteers": volunteer_count
    }
    
    answer = await ai_service.process_query(query, context)
    
    return {"query": query, "answer": answer, "context_used": context}


@router.post("/admin/ai/chat")
async def chat_copilot(
    query: str = Body(..., embed=True),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    response = await ai_service.chat_with_tools(query)
    
    if not response or not response.candidates:
        return {"answer": "Sorry, I'm having trouble."}
    
    part = response.candidates[0].content.parts[0]
    
    if part.text:
        return {"answer": part.text}
    
    return {"answer": "I understood that, but I'm not sure what to do."}


@router.post("/admin/ai/generate-form")
async def generate_form_endpoint(
    topic: str = Body(..., embed=True),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    form_structure = await ai_service.generate_form(topic)
    return form_structure


@router.post("/admin/ai/generate-field")
async def generate_field_endpoint(
    prompt: str = Body(..., embed=True),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    field_structure = await ai_service.generate_field(prompt)
    return field_structure


@router.post("/admin/ai/save-form")
async def save_form_endpoint(
    activity_id: str = Body(..., embed=True),
    form_structure: dict = Body(..., embed=True),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    try:
        uuid_id = UUID(activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    result = await db.execute(select(ActivityDB).where(ActivityDB.id == uuid_id))
    activity = result.scalar_one_or_none()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    activity.volunteer_form = form_structure
    await db.commit()
    
    return {"message": "Form saved successfully", "form": form_structure}


@router.post("/admin/ai/analyze-responses")
async def analyze_responses_endpoint(
    activity_id: str = Body(..., embed=True),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    try:
        uuid_id = UUID(activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    # Get Activity Context
    act_result = await db.execute(select(ActivityDB).where(ActivityDB.id == uuid_id))
    activity = act_result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Get Responses
    from ..models.form_response import FormResponseDB
    resp_result = await db.execute(select(FormResponseDB).where(FormResponseDB.activity_id == uuid_id))
    responses = resp_result.scalars().all()
    
    # Format for AI
    resp_dicts = [{"responses": r.responses} for r in responses]
    act_dict = {"title": activity.title, "description": activity.description}
    
    analysis = await ai_service.analyze_responses(resp_dicts, act_dict)
    return analysis


from pydantic import BaseModel

class AutofillRequest(BaseModel):
    user_id: str
    activity_id: str

@router.post("/ai/autofill")
async def autofill_endpoint(
    request: AutofillRequest,
    db: AsyncSession = Depends(get_database)
):
    try:
        user_uuid = UUID(request.user_id)
        act_uuid = UUID(request.activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    # 1. Fetch User
    u_result = await db.execute(select(UserDB).where(UserDB.id == user_uuid))
    user = u_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Fetch Activity
    a_result = await db.execute(select(ActivityDB).where(ActivityDB.id == act_uuid))
    activity = a_result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # 3. Prepare Context
    user_profile = {
        "name": user.name,
        "bio": user.bio,
        "skills": user.skills or [],
        "resume_summary": user.resume_json.get("summary") if user.resume_json else "",
        "experience": user.resume_json.get("experience") if user.resume_json else [],
        "achievements": user.achievements or []
    }

    form_fields = []
    if activity.volunteer_form and "fields" in activity.volunteer_form:
        form_fields = [f.get("label") for f in activity.volunteer_form["fields"]]

    activity_details = {
        "title": activity.title,
        "organizer": activity.organizer,
        "description": activity.description,
        "requirements": activity.requirements or [],
        "form_fields": form_fields
    }

    # 4. Generate
    suggestions = await ai_service.generate_autofill_suggestions(user_profile, activity_details)
    
    return {"success": True, "suggestions": suggestions}

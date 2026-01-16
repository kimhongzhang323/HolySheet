from fastapi import APIRouter, Depends, HTTPException, status, Body
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from uuid import UUID

from ..db import get_database
from ..models.user import UserDB, UserResponse
from ..models.activity import ActivityDB
from ..models.volunteer import VolunteerDB, VolunteerCreate
from ..models.form_response import FormResponseDB
from ..dependencies import get_current_user

router = APIRouter()

@router.post("/volunteers/register")
async def register_as_volunteer(
    register_req: VolunteerCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Register the current user as a volunteer for an activity"""
    try:
        activity_uuid = UUID(register_req.activity_id)
        user_uuid = UUID(current_user.id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    # Check if activity exists
    result = await db.execute(select(ActivityDB).where(ActivityDB.id == activity_uuid))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Check if already registered
    vol_result = await db.execute(
        select(VolunteerDB).where(
            VolunteerDB.activity_id == activity_uuid,
            VolunteerDB.user_id == user_uuid
        )
    )
    if vol_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already registered for this activity")

    # Create volunteer record
    new_volunteer = VolunteerDB(
        user_id=user_uuid,
        activity_id=activity_uuid,
        role=register_req.role,
        skills_offered=register_req.skills_offered,
        status="confirmed" # Auto-confirm for now or set to pending
    )

    # Increment activity volunteer count
    activity.volunteers_registered = (activity.volunteers_registered or 0) + 1

    db.add(new_volunteer)
    await db.commit()
    await db.refresh(new_volunteer)

    return {
        "message": "Registration successful",
        "volunteer_id": str(new_volunteer.id),
        "status": new_volunteer.status
    }

@router.get("/admin/activities/{activity_id}/volunteers")
async def get_activity_volunteers(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get list of volunteers registered for an activity"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can view volunteers"
        )
    
    try:
        activity_uuid = UUID(activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Activity ID")
    
    # Query VolunteerDB joined with UserDB
    query = select(VolunteerDB, UserDB).join(UserDB, VolunteerDB.user_id == UserDB.id).where(
        VolunteerDB.activity_id == activity_uuid
    )
    result = await db.execute(query)
    rows = result.all()
    
    volunteers = []
    for vol_rec, user_rec in rows:
        volunteers.append({
            "id": str(user_rec.id),
            "name": user_rec.name,
            "email": user_rec.email,
            "role": vol_rec.role,
            "status": vol_rec.status,
            "applied_at": vol_rec.applied_at.isoformat() if vol_rec.applied_at else None,
            "skills": vol_rec.skills_offered
        })
    
    return volunteers


@router.get("/admin/activities/{activity_id}/form-responses")
async def get_activity_form_responses(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get list of form responses for an activity"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )
    
    try:
        activity_uuid = UUID(activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Activity ID")
    
    # Query FormResponseDB joined with UserDB
    query = select(FormResponseDB, UserDB).join(UserDB, FormResponseDB.user_id == UserDB.id).where(
        FormResponseDB.activity_id == activity_uuid
    )
    result = await db.execute(query)
    rows = result.all()
    
    responses = []
    for resp_rec, user_rec in rows:
        responses.append({
            "id": str(resp_rec.id),
            "user_id": str(user_rec.id),
            "user_name": user_rec.name,
            "user_email": user_rec.email,
            "responses": resp_rec.responses,
            "submitted_at": resp_rec.submitted_at.isoformat() if resp_rec.submitted_at else None
        })
    
    return responses

def is_admin_or_staff(role: str) -> bool:
    return role in ["admin", "staff"]


@router.get("/admin/volunteers/by-skills")
async def get_volunteers_by_skills(
    skills: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Find volunteers with specific skills"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can access volunteer management"
        )
    
    skill_list = [s.strip() for s in skills.split(",")]
    
    # Get all volunteers
    result = await db.execute(select(UserDB).where(UserDB.role == "volunteer"))
    all_volunteers = result.scalars().all()
    
    # Filter by skills in Python (since ARRAY contains is complex in SQLAlchemy)
    volunteers = []
    for vol in all_volunteers:
        vol_skills = vol.skills or []
        matching = [s for s in vol_skills if s in skill_list]
        if matching:
            volunteers.append({
                "id": str(vol.id),
                "name": vol.name,
                "email": vol.email,
                "phone": vol.phone_number,
                "skills": vol_skills,
                "matching_skills": matching,
                "tier": vol.tier
            })
    
    return {
        "requested_skills": skill_list,
        "total_found": len(volunteers),
        "volunteers": volunteers
    }


@router.get("/admin/volunteers/crisis-dashboard")
async def get_crisis_dashboard(
    days_ahead: int = 7,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get activities with unmet volunteer quotas"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can access crisis dashboard"
        )
    
    now = datetime.utcnow()
    future_date = now + timedelta(days=days_ahead)
    
    query = select(ActivityDB).where(
        and_(
            ActivityDB.start_time >= now,
            ActivityDB.start_time <= future_date,
            ActivityDB.volunteers_needed > 0
        )
    ).order_by(ActivityDB.start_time)
    
    result = await db.execute(query)
    activities = result.scalars().all()
    
    crisis_items = []
    for activity in activities:
        volunteers_needed = activity.volunteers_needed or 0
        volunteers_registered = activity.volunteers_registered or 0
        shortage = max(0, volunteers_needed - volunteers_registered)
        
        fill_percentage = 0
        if volunteers_needed > 0:
            fill_percentage = int((volunteers_registered / volunteers_needed) * 100)
        
        status_label = "ok"
        if fill_percentage < 50:
            status_label = "critical"
        elif fill_percentage < 100:
            status_label = "warning"
        
        hours_until = (activity.start_time - now).total_seconds() / 3600 if activity.start_time else 0
        
        crisis_items.append({
            "activity_id": str(activity.id),
            "title": activity.title,
            "start_time": activity.start_time.isoformat() if activity.start_time else None,
            "hours_until": int(hours_until),
            "location": activity.location,
            "volunteers_needed": volunteers_needed,
            "volunteers_registered": volunteers_registered,
            "shortage": shortage,
            "fill_percentage": fill_percentage,
            "status": status_label,
            "skills_required": activity.skills_required or [],
            "needs_help": activity.needs_help
        })
    
    # Sort by urgency
    crisis_items.sort(key=lambda x: (
        0 if x["status"] == "critical" else 1 if x["status"] == "warning" else 2,
        x["hours_until"]
    ))
    
    return {
        "total_activities": len(crisis_items),
        "critical_count": len([i for i in crisis_items if i["status"] == "critical"]),
        "warning_count": len([i for i in crisis_items if i["status"] == "warning"]),
        "activities": crisis_items
    }


@router.post("/admin/volunteers/generate-blast")
async def generate_volunteer_blast(
    activity_id: str = Body(..., embed=True),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Generate WhatsApp blast message for volunteer recruitment"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can generate blast messages"
        )
    
    try:
        activity_uuid = UUID(activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    result = await db.execute(select(ActivityDB).where(ActivityDB.id == activity_uuid))
    activity = result.scalar_one_or_none()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Get all volunteers
    vol_result = await db.execute(select(UserDB).where(UserDB.role == "volunteer"))
    volunteers = vol_result.scalars().all()
    
    shortage = (activity.volunteers_needed or 0) - (activity.volunteers_registered or 0)
    activity_date = activity.start_time.strftime("%A, %B %d at %I:%M %p") if activity.start_time else "TBA"
    
    message_template = f"""Hi {{name}}! 👋

We need {shortage} more volunteer(s) for:
📅 {activity.title}
🕐 {activity_date}
📍 {activity.location or 'TBA'}

Would you be available to help? Your support makes a difference! 🙌

Reply YES to confirm."""
    
    blast_targets = []
    for vol in volunteers:
        phone = vol.phone_number or ""
        if phone:
            clean_phone = ''.join(filter(str.isdigit, phone))
            personalized_msg = message_template.replace("{name}", vol.name or "there")
            
            blast_targets.append({
                "volunteer_id": str(vol.id),
                "name": vol.name,
                "phone": phone,
                "skills": vol.skills or [],
                "whatsapp_link": f"https://wa.me/{clean_phone}?text={personalized_msg}"
            })
    
    return {
        "activity_id": str(activity.id),
        "activity_title": activity.title,
        "shortage": shortage,
        "message_template": message_template,
        "total_targets": len(blast_targets),
        "targets": blast_targets
    }

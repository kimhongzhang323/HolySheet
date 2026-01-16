from fastapi import APIRouter, Depends, HTTPException, status, Body
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from uuid import UUID

from ..db import get_database
from ..models.user import UserDB, UserResponse
from ..models.activity import ActivityDB
from ..dependencies import get_current_user

router = APIRouter()


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

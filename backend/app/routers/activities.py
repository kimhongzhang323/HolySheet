from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, delete
from uuid import UUID

from ..db import get_database
from ..models.activity import ActivityDB, ActivityResponse, ActivityCreate, ActivityBase
from ..models.user import UserResponse
from ..dependencies import get_current_user

router = APIRouter()

def is_admin_or_staff(role: str) -> bool:
    return role in ["admin", "staff"]

@router.get("/activities/feed")
async def get_activity_feed(
    db: AsyncSession = Depends(get_database)
):
    now = datetime.utcnow()
    query = select(ActivityDB).where(ActivityDB.start_time >= now).order_by(ActivityDB.start_time)
    
    result = await db.execute(query)
    activities = result.scalars().all()
    
    data = [
        {
            "id": str(a.id),
            "title": a.title,
            "description": a.description,
            "start_time": a.start_time.isoformat() if a.start_time else None,
            "end_time": a.end_time.isoformat() if a.end_time else None,
            "location": a.location,
            "capacity": a.capacity,
            "volunteers_needed": a.volunteers_needed,
            "volunteers_registered": a.volunteers_registered,
            "needs_help": a.needs_help,
            "attendees": a.attendees or [],
            "skills_required": a.skills_required or [],
            "image_url": a.image_url,
            "organiser": a.organiser,
            "status": a.status
        }
        for a in activities[:100]
    ]
    
    return data


@router.get("/activities/filter")
async def filter_activities(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    time_slot: Optional[str] = None,
    keyword: Optional[str] = None,
    db: AsyncSession = Depends(get_database)
):
    """
    Filter activities by date range, time slot, and keyword.
    """
    query = select(ActivityDB).where(ActivityDB.start_time >= datetime.utcnow())
    
    # Date range filter
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.where(ActivityDB.start_time >= start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.where(ActivityDB.start_time < end)
        except ValueError:
            pass
    
    # Keyword filter
    if keyword:
        query = query.where(
            or_(
                ActivityDB.title.ilike(f"%{keyword}%"),
                ActivityDB.description.ilike(f"%{keyword}%"),
                ActivityDB.organiser.ilike(f"%{keyword}%")
            )
        )
    
    query = query.order_by(ActivityDB.start_time)
    result = await db.execute(query)
    activities = result.scalars().all()
    
    # Time slot filter (in Python)
    if time_slot and activities:
        filtered = []
        for act in activities:
            hour = act.start_time.hour if act.start_time else 0
            if time_slot == "morning" and hour < 12:
                filtered.append(act)
            elif time_slot == "afternoon" and 12 <= hour < 17:
                filtered.append(act)
            elif time_slot == "evening" and hour >= 17:
                filtered.append(act)
        activities = filtered
    
    return [
        {
            "id": str(a.id),
            "title": a.title,
            "description": a.description,
            "start_time": a.start_time.isoformat() if a.start_time else None,
            "end_time": a.end_time.isoformat() if a.end_time else None,
            "location": a.location,
            "capacity": a.capacity,
            "volunteers_needed": a.volunteers_needed,
            "volunteers_registered": a.volunteers_registered,
            "needs_help": a.needs_help,
            "attendees": a.attendees or [],
            "skills_required": a.skills_required or [],
            "image_url": a.image_url,
            "organiser": a.organiser,
            "status": a.status
        }
        for a in activities
    ]

# --- Admin Routes ---

@router.post("/admin/activities", response_model=ActivityResponse)
async def create_activity(
    activity: ActivityCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Create a new activity (Admin/Staff only)"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can create activities"
        )
    
    new_activity = ActivityDB(
        title=activity.title,
        description=activity.description,
        start_time=activity.start_time,
        end_time=activity.end_time,
        location=activity.location,
        capacity=activity.capacity,
        volunteers_needed=activity.volunteers_needed,
        volunteers_registered=activity.volunteers_registered,
        needs_help=activity.needs_help,
        attendees=activity.attendees,
        skills_required=activity.skills_required,
        image_url=activity.image_url,
        organiser=activity.organiser,
        status=activity.status,
        created_by=UUID(current_user.id) if current_user.id else None,
        created_at=datetime.utcnow()
    )
    
    db.add(new_activity)
    await db.commit()
    await db.refresh(new_activity)
    
    return ActivityResponse(
        id=str(new_activity.id),
        title=new_activity.title,
        description=new_activity.description,
        start_time=new_activity.start_time,
        end_time=new_activity.end_time,
        location=new_activity.location,
        capacity=new_activity.capacity,
        volunteers_needed=new_activity.volunteers_needed,
        volunteers_registered=new_activity.volunteers_registered,
        needs_help=new_activity.needs_help,
        attendees=new_activity.attendees or [],
        skills_required=new_activity.skills_required or [],
        image_url=new_activity.image_url,
        organiser=new_activity.organiser,
        activity_type=new_activity.activity_type,
        status=new_activity.status,
        volunteer_form=new_activity.volunteer_form,
        created_by=str(new_activity.created_by) if new_activity.created_by else None,
        created_at=new_activity.created_at
    )

@router.get("/admin/activities/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get a single activity by ID (Admin/Staff only)"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        uuid_id = UUID(activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    result = await db.execute(select(ActivityDB).where(ActivityDB.id == uuid_id))
    activity = result.scalar_one_or_none()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    return ActivityResponse(
        id=str(activity.id),
        title=activity.title,
        description=activity.description,
        start_time=activity.start_time,
        end_time=activity.end_time,
        location=activity.location,
        capacity=activity.capacity,
        volunteers_needed=activity.volunteers_needed,
        volunteers_registered=activity.volunteers_registered,
        needs_help=activity.needs_help,
        attendees=activity.attendees or [],
        skills_required=activity.skills_required or [],
        image_url=activity.image_url,
        organiser=activity.organiser,
        activity_type=activity.activity_type,
        status=activity.status,
        volunteer_form=activity.volunteer_form,
        created_by=str(activity.created_by) if activity.created_by else None,
        created_at=activity.created_at
    )


@router.put("/admin/activities/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: str,
    activity: ActivityBase,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Update an activity (Admin/Staff only)"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can update activities"
        )
    
    try:
        uuid_id = UUID(activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    result = await db.execute(select(ActivityDB).where(ActivityDB.id == uuid_id))
    existing = result.scalar_one_or_none()
    
    if not existing:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Update fields
    for field, value in activity.model_dump(exclude_unset=True).items():
        setattr(existing, field, value)
    existing.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(existing)
    
    return ActivityResponse(
        id=str(existing.id),
        title=existing.title,
        description=existing.description,
        start_time=existing.start_time,
        end_time=existing.end_time,
        location=existing.location,
        capacity=existing.capacity,
        volunteers_needed=existing.volunteers_needed,
        volunteers_registered=existing.volunteers_registered,
        needs_help=existing.needs_help,
        attendees=existing.attendees or [],
        skills_required=existing.skills_required or [],
        image_url=existing.image_url,
        organiser=existing.organiser,
        status=existing.status,
        volunteer_form=existing.volunteer_form,
        created_by=str(existing.created_by) if existing.created_by else None,
        created_at=existing.created_at
    )


@router.delete("/admin/activities/{activity_id}")
async def delete_activity(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Delete an activity (Admin/Staff only)"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can delete activities"
        )
    
    try:
        uuid_id = UUID(activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    result = await db.execute(select(ActivityDB).where(ActivityDB.id == uuid_id))
    existing = result.scalar_one_or_none()
    
    if not existing:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    await db.execute(delete(ActivityDB).where(ActivityDB.id == uuid_id))
    await db.commit()
    
    return {"message": "Activity deleted successfully"}


@router.get("/admin/activities")
async def get_all_activities(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get all activities with volunteer status (Admin/Staff only)"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can view all activities"
        )
    
    query = select(ActivityDB)
    
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.where(ActivityDB.start_time >= start)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.where(ActivityDB.start_time < end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
    
    query = query.order_by(ActivityDB.start_time)
    result = await db.execute(query)
    activities = result.scalars().all()
    
    return [
        {
            "id": str(a.id),
            "title": a.title,
            "description": a.description,
            "start_time": a.start_time.isoformat() if a.start_time else None,
            "end_time": a.end_time.isoformat() if a.end_time else None,
            "location": a.location,
            "capacity": a.capacity,
            "volunteers_needed": a.volunteers_needed,
            "volunteers_registered": a.volunteers_registered,
            "needs_help": a.needs_help,
            "attendees": a.attendees or [],
            "skills_required": a.skills_required or [],
            "image_url": a.image_url,
            "organiser": a.organiser,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in activities
    ]


@router.get("/admin/activities/{activity_id}/volunteer-status")
async def get_volunteer_status(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get detailed volunteer status for an activity"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can view volunteer status"
        )
    
    try:
        uuid_id = UUID(activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    result = await db.execute(select(ActivityDB).where(ActivityDB.id == uuid_id))
    activity = result.scalar_one_or_none()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    volunteers_needed = activity.volunteers_needed or 0
    volunteers_registered = activity.volunteers_registered or 0
    shortage = max(0, volunteers_needed - volunteers_registered)
    
    fill_percentage = 0
    if volunteers_needed > 0:
        fill_percentage = int((volunteers_registered / volunteers_needed) * 100)
    
    status_label = "filled"
    if fill_percentage < 50:
        status_label = "critical"
    elif fill_percentage < 100:
        status_label = "warning"
    
    return {
        "activity_id": str(activity.id),
        "title": activity.title,
        "start_time": activity.start_time.isoformat() if activity.start_time else None,
        "volunteers_needed": volunteers_needed,
        "volunteers_registered": volunteers_registered,
        "shortage": shortage,
        "fill_percentage": fill_percentage,
        "status": status_label,
        "skills_required": activity.skills_required or []
    }

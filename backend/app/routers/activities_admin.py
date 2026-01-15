from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from ..db import get_database
from ..models.activity import ActivityCreate, ActivityResponse, ActivityBase
from ..models.user import UserResponse, UserRole
from ..dependencies import get_current_user

router = APIRouter()

@router.post("/admin/activities", response_model=ActivityResponse)
async def create_activity(
    activity: ActivityCreate,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new activity (Admin/Staff only)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can create activities"
        )
    
    activity_dict = activity.model_dump()
    activity_dict["created_by"] = str(current_user.id)
    activity_dict["created_at"] = datetime.utcnow()
    
    result = await db.activities.insert_one(activity_dict)
    created_activity = await db.activities.find_one({"_id": result.inserted_id})
    
    return created_activity


@router.put("/admin/activities/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: str,
    activity: ActivityBase,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update an activity (Admin/Staff only)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can update activities"
        )
    
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    existing_activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
    if not existing_activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    activity_dict = activity.model_dump(exclude_unset=True)
    activity_dict["updated_at"] = datetime.utcnow()
    
    await db.activities.update_one(
        {"_id": ObjectId(activity_id)},
        {"$set": activity_dict}
    )
    
    updated_activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
    return updated_activity


@router.delete("/admin/activities/{activity_id}")
async def delete_activity(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete an activity (Admin/Staff only)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can delete activities"
        )
    
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    result = await db.activities.delete_one({"_id": ObjectId(activity_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    return {"message": "Activity deleted successfully"}


@router.get("/admin/activities", response_model=List[ActivityResponse])
async def get_all_activities(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all activities with volunteer status (Admin/Staff only)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can view all activities"
        )
    
    query = {}
    
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            query["start_time"] = {"$gte": start}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    
    if end_date:
        try:
            from datetime import timedelta
            end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            if "start_time" in query:
                query["start_time"]["$lt"] = end
            else:
                query["start_time"] = {"$lt": end}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
    
    cursor = db.activities.find(query).sort("start_time", 1)
    activities = await cursor.to_list(length=500)
    
    return activities


@router.get("/admin/activities/{activity_id}/volunteer-status")
async def get_volunteer_status(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get detailed volunteer status for an activity"""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can view volunteer status"
        )
    
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    volunteers_needed = activity.get("volunteers_needed", 0)
    volunteers_registered = activity.get("volunteers_registered", 0)
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
        "activity_id": str(activity["_id"]),
        "title": activity["title"],
        "start_time": activity["start_time"],
        "volunteers_needed": volunteers_needed,
        "volunteers_registered": volunteers_registered,
        "shortage": shortage,
        "fill_percentage": fill_percentage,
        "status": status_label,
        "skills_required": activity.get("skills_required", [])
    }

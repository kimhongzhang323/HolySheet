"""
Staff Management Router

Endpoints for assigning staff to activities and managing staff-event relationships.
Staff are identified by their Google email address.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId
from ..db import get_database
from ..models.staff import StaffAssignmentCreate, StaffAssignmentInDB, StaffAssignmentResponse, StaffRole
from ..models.user import UserResponse, UserRole
from ..dependencies import get_current_user

router = APIRouter(prefix="/staff", tags=["Staff"])


async def require_admin(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    """Dependency to require admin role."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can manage staff assignments"
        )
    return current_user


@router.post("/assign", response_model=StaffAssignmentResponse)
async def assign_staff_to_activity(
    assignment: StaffAssignmentCreate,
    current_user: UserResponse = Depends(require_admin),
    db = Depends(get_database)
):
    """
    Assign a staff member to an activity.
    
    - **staff_email**: Google email of the staff member
    - **staff_name**: Display name of the staff member
    - **activity_id**: ID of the activity to assign to
    - **role**: Staff role (coordinator, assistant, volunteer)
    """
    # Validate activity exists
    if not ObjectId.is_valid(assignment.activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    activity = await db.activities.find_one({"_id": ObjectId(assignment.activity_id)})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Check if already assigned
    existing = await db.staff_assignments.find_one({
        "staff_email": assignment.staff_email,
        "activity_id": assignment.activity_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Staff already assigned to this activity")
    
    # Create assignment
    new_assignment = StaffAssignmentInDB(
        staff_email=assignment.staff_email,
        staff_name=assignment.staff_name,
        activity_id=assignment.activity_id,
        role=assignment.role,
        assigned_at=datetime.utcnow(),
        assigned_by=str(current_user.id)
    )
    
    result = await db.staff_assignments.insert_one(
        new_assignment.model_dump(by_alias=True, exclude={"id"})
    )
    
    # Also update the activity's assigned_staff list
    await db.activities.update_one(
        {"_id": ObjectId(assignment.activity_id)},
        {"$addToSet": {"assigned_staff": assignment.staff_email}}
    )
    
    created = await db.staff_assignments.find_one({"_id": result.inserted_id})
    return StaffAssignmentResponse(**created)


@router.delete("/unassign")
async def unassign_staff_from_activity(
    staff_email: str,
    activity_id: str,
    current_user: UserResponse = Depends(require_admin),
    db = Depends(get_database)
):
    """Remove a staff member from an activity."""
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    result = await db.staff_assignments.delete_one({
        "staff_email": staff_email,
        "activity_id": activity_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Also update the activity's assigned_staff list
    await db.activities.update_one(
        {"_id": ObjectId(activity_id)},
        {"$pull": {"assigned_staff": staff_email}}
    )
    
    return {"message": "Staff unassigned successfully"}


@router.get("/my-events", response_model=List[dict])
async def get_my_assigned_events(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get all activities assigned to the current logged-in staff member.
    Matches based on the user's email.
    """
    # Find assignments for this user's email
    cursor = db.staff_assignments.find({"staff_email": current_user.email})
    assignments = await cursor.to_list(length=100)
    
    events = []
    for assignment in assignments:
        activity_id = assignment.get("activity_id")
        if ObjectId.is_valid(activity_id):
            activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
            if activity:
                events.append({
                    "assignment_id": str(assignment["_id"]),
                    "role": assignment.get("role", "assistant"),
                    "assigned_at": assignment.get("assigned_at"),
                    "activity": {
                        "id": str(activity["_id"]),
                        "title": activity.get("title"),
                        "description": activity.get("description"),
                        "start_time": activity.get("start_time"),
                        "end_time": activity.get("end_time"),
                        "location": activity.get("location"),
                        "capacity": activity.get("capacity", 0)
                    }
                })
    
    return events


@router.get("/activities/{activity_id}", response_model=List[StaffAssignmentResponse])
async def get_activity_staff(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all staff assigned to a specific activity."""
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    cursor = db.staff_assignments.find({"activity_id": activity_id})
    assignments = await cursor.to_list(length=100)
    
    return [StaffAssignmentResponse(**a) for a in assignments]

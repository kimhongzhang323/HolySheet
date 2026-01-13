"""
Calendar Router

Provides calendar-friendly API endpoints for staff to view joint attendance
in monthly/weekly format. Supports visual calendar integrations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from pydantic import BaseModel
from ..db import get_database
from ..models.user import UserResponse, UserRole
from ..models.booking import BookingStatus
from ..dependencies import get_current_user

router = APIRouter(prefix="/calendar", tags=["Calendar"])


class CalendarEvent(BaseModel):
    """Calendar-friendly event format for frontend libraries like FullCalendar."""
    id: str
    title: str
    start: datetime
    end: datetime
    location: str
    attendee_count: int  # Total bookings
    confirmed_count: int  # Confirmed bookings
    attended_count: int  # Actually attended
    assigned_staff: List[str]  # Staff emails


class AttendanceRecord(BaseModel):
    """Individual attendance record."""
    booking_id: str
    user_id: str
    user_name: str
    user_email: str
    status: str
    booked_at: datetime
    form_responses: Optional[dict] = None


@router.get("/monthly", response_model=List[CalendarEvent])
async def get_monthly_calendar(
    year: int = Query(..., description="Year (e.g., 2026)"),
    month: int = Query(..., ge=1, le=12, description="Month (1-12)"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get all activities and their attendance counts for a specific month.
    Returns data in a calendar-friendly format.
    
    Staff/Admin users can see all events; regular users see only their booked events.
    """
    # Calculate date range for the month
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    # Build query based on user role
    query = {
        "start_time": {"$gte": start_date, "$lt": end_date}
    }
    
    # Staff/Admin see all, users see only activities they're assigned to or booked
    if current_user.role in [UserRole.STAFF, UserRole.ADMIN]:
        # Staff/Admin: Show all activities, optionally filter to assigned ones
        pass  # No additional filter
    else:
        # Regular users: Show only activities they've booked
        user_bookings = await db.bookings.find({
            "user_id": str(current_user.id),
            "status": {"$ne": BookingStatus.CANCELLED}
        }).to_list(length=1000)
        booked_activity_ids = [b.get("activity_id") for b in user_bookings]
        
        if booked_activity_ids:
            query["_id"] = {"$in": [ObjectId(aid) for aid in booked_activity_ids if ObjectId.is_valid(aid)]}
        else:
            return []  # No bookings
    
    cursor = db.activities.find(query).sort("start_time", 1)
    activities = await cursor.to_list(length=500)
    
    result = []
    for activity in activities:
        activity_id = str(activity["_id"])
        
        # Count bookings by status
        booking_counts = await _get_booking_counts(db, activity_id)
        
        result.append(CalendarEvent(
            id=activity_id,
            title=activity.get("title", "Untitled"),
            start=activity["start_time"],
            end=activity.get("end_time", activity["start_time"] + timedelta(hours=1)),
            location=activity.get("location", "TBD"),
            attendee_count=booking_counts["total"],
            confirmed_count=booking_counts["confirmed"],
            attended_count=booking_counts["attended"],
            assigned_staff=activity.get("assigned_staff", [])
        ))
    
    return result


@router.get("/weekly", response_model=List[CalendarEvent])
async def get_weekly_calendar(
    year: int = Query(..., description="Year (e.g., 2026)"),
    week: int = Query(..., ge=1, le=53, description="ISO week number (1-53)"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get all activities and their attendance counts for a specific ISO week.
    Returns data in a calendar-friendly format.
    """
    # Calculate date range for the ISO week
    start_date = datetime.strptime(f"{year}-W{week:02d}-1", "%Y-W%W-%w")
    end_date = start_date + timedelta(days=7)
    
    query = {
        "start_time": {"$gte": start_date, "$lt": end_date}
    }
    
    # Apply role-based filtering (same as monthly)
    if current_user.role not in [UserRole.STAFF, UserRole.ADMIN]:
        user_bookings = await db.bookings.find({
            "user_id": str(current_user.id),
            "status": {"$ne": BookingStatus.CANCELLED}
        }).to_list(length=1000)
        booked_activity_ids = [b.get("activity_id") for b in user_bookings]
        
        if booked_activity_ids:
            query["_id"] = {"$in": [ObjectId(aid) for aid in booked_activity_ids if ObjectId.is_valid(aid)]}
        else:
            return []
    
    cursor = db.activities.find(query).sort("start_time", 1)
    activities = await cursor.to_list(length=200)
    
    result = []
    for activity in activities:
        activity_id = str(activity["_id"])
        booking_counts = await _get_booking_counts(db, activity_id)
        
        result.append(CalendarEvent(
            id=activity_id,
            title=activity.get("title", "Untitled"),
            start=activity["start_time"],
            end=activity.get("end_time", activity["start_time"] + timedelta(hours=1)),
            location=activity.get("location", "TBD"),
            attendee_count=booking_counts["total"],
            confirmed_count=booking_counts["confirmed"],
            attended_count=booking_counts["attended"],
            assigned_staff=activity.get("assigned_staff", [])
        ))
    
    return result


@router.get("/attendance/{activity_id}", response_model=List[AttendanceRecord])
async def get_activity_attendance(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get detailed attendance list for a specific activity.
    Staff/Admin only - includes user details and form responses.
    """
    if current_user.role not in [UserRole.STAFF, UserRole.ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Only staff and admins can view attendance details"
        )
    
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    # Get all bookings for this activity
    cursor = db.bookings.find({"activity_id": activity_id})
    bookings = await cursor.to_list(length=500)
    
    result = []
    for booking in bookings:
        # Get user details
        user = await db.users.find_one({"_id": ObjectId(booking["user_id"])}) if ObjectId.is_valid(booking.get("user_id", "")) else None
        
        result.append(AttendanceRecord(
            booking_id=str(booking["_id"]),
            user_id=booking.get("user_id", ""),
            user_name=user.get("name", "Unknown") if user else "Unknown",
            user_email=user.get("email", "") if user else "",
            status=booking.get("status", "confirmed"),
            booked_at=booking.get("timestamp", datetime.utcnow()),
            form_responses=booking.get("form_responses")
        ))
    
    return result


@router.patch("/attendance/{booking_id}/status")
async def update_attendance_status(
    booking_id: str,
    status: BookingStatus,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Update a booking's attendance status (e.g., mark as attended).
    Staff/Admin only.
    """
    if current_user.role not in [UserRole.STAFF, UserRole.ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Only staff and admins can update attendance"
        )
    
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    
    result = await db.bookings.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"status": status.value}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": f"Attendance status updated to {status.value}"}


async def _get_booking_counts(db, activity_id: str) -> dict:
    """Helper to get booking counts by status for an activity."""
    pipeline = [
        {"$match": {"activity_id": activity_id}},
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1}
        }}
    ]
    
    cursor = db.bookings.aggregate(pipeline)
    counts = await cursor.to_list(length=10)
    
    result = {"total": 0, "confirmed": 0, "attended": 0, "cancelled": 0}
    for item in counts:
        status = item["_id"]
        count = item["count"]
        result["total"] += count
        if status == "confirmed":
            result["confirmed"] = count
        elif status == "attended":
            result["attended"] = count
        elif status == "cancelled":
            result["cancelled"] = count
            result["total"] -= count  # Don't count cancelled in total
    
    return result

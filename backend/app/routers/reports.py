from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime, timedelta
import io
import csv
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID

from ..db import get_database
from ..models.user import UserDB, UserResponse
from ..models.activity import ActivityDB
from ..dependencies import get_current_user

router = APIRouter()


def is_admin_or_staff(role: str) -> bool:
    return role in ["admin", "staff"]


@router.get("/admin/reports/weekly")
async def generate_weekly_report(
    start_date: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Generate weekly summary report"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can generate reports"
        )
    
    # Default to current week if no start_date provided
    if start_date:
        try:
            week_start = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        today = datetime.utcnow()
        week_start = today - timedelta(days=today.weekday())
    
    week_end = week_start + timedelta(days=7)
    
    # Get activities for the week
    query = select(ActivityDB).where(
        and_(
            ActivityDB.start_time >= week_start,
            ActivityDB.start_time < week_end
        )
    ).order_by(ActivityDB.start_time)
    
    result = await db.execute(query)
    activities = result.scalars().all()
    
    # Calculate stats
    total_activities = len(activities)
    total_capacity = sum(act.capacity or 0 for act in activities)
    total_attended = sum(len(act.attendees or []) for act in activities)
    
    # Volunteer stats
    total_volunteers_needed = sum(act.volunteers_needed or 0 for act in activities)
    total_volunteers_registered = sum(act.volunteers_registered or 0 for act in activities)
    
    # Average attendance rate
    avg_attendance_rate = (total_attended / total_capacity * 100) if total_capacity > 0 else 0
    
    # Volunteer fulfillment rate
    volunteer_fulfillment_rate = (total_volunteers_registered / total_volunteers_needed * 100) if total_volunteers_needed > 0 else 0
    
    return {
        "week_start": week_start.strftime("%Y-%m-%d"),
        "week_end": week_end.strftime("%Y-%m-%d"),
        "total_activities": total_activities,
        "total_capacity": total_capacity,
        "total_attended": total_attended,
        "avg_attendance_rate": round(avg_attendance_rate, 1),
        "total_volunteers_needed": total_volunteers_needed,
        "total_volunteers_registered": total_volunteers_registered,
        "volunteer_fulfillment_rate": round(volunteer_fulfillment_rate, 1),
        "activities": [
            {
                "title": act.title,
                "date": act.start_time.strftime("%Y-%m-%d %H:%M") if act.start_time else None,
                "location": act.location,
                "capacity": act.capacity or 0,
                "attended": len(act.attendees or []),
                "volunteers_needed": act.volunteers_needed or 0,
                "volunteers_registered": act.volunteers_registered or 0
            }
            for act in activities
        ]
    }


@router.get("/admin/reports/activity/{activity_id}/export")
async def export_activity_csv(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Export activity details as CSV"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can export reports"
        )
    
    try:
        uuid_id = UUID(activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    result = await db.execute(select(ActivityDB).where(ActivityDB.id == uuid_id))
    activity = result.scalar_one_or_none()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Get attendee details
    attendee_ids = activity.attendees or []
    attendees = []
    
    for attendee_id in attendee_ids:
        try:
            user_uuid = UUID(attendee_id)
            user_result = await db.execute(select(UserDB).where(UserDB.id == user_uuid))
            user = user_result.scalar_one_or_none()
            if user:
                attendees.append({
                    "name": user.name,
                    "email": user.email,
                    "phone": user.phone_number or "N/A"
                })
        except ValueError:
            pass
    
    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([f"Activity Report: {activity.title}"])
    writer.writerow([f"Date: {activity.start_time.strftime('%Y-%m-%d %H:%M') if activity.start_time else 'N/A'}"])
    writer.writerow([f"Location: {activity.location or 'N/A'}"])
    writer.writerow([])
    writer.writerow(["Name", "Email", "Phone"])
    
    for attendee in attendees:
        writer.writerow([attendee["name"], attendee["email"], attendee["phone"]])
    
    output.seek(0)
    headers = {
        'Content-Disposition': f'attachment; filename="activity_{activity_id}.csv"'
    }
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers=headers
    )


@router.get("/admin/reports/volunteers/export")
async def export_volunteers_excel(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Export volunteer roster as CSV (simplified)"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can export reports"
        )
    
    # Get all volunteers
    result = await db.execute(select(UserDB).where(UserDB.role == "volunteer"))
    volunteers = result.scalars().all()
    
    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Name", "Email", "Phone", "Skills", "Tier"])
    
    for vol in volunteers:
        writer.writerow([
            vol.name,
            vol.email,
            vol.phone_number or "",
            ", ".join(vol.skills or []),
            vol.tier or ""
        ])
    
    output.seek(0)
    headers = {
        'Content-Disposition': 'attachment; filename="volunteers_roster.csv"'
    }
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers=headers
    )

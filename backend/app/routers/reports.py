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

from sqlalchemy import func, desc

@router.get("/admin/reports/stats")
async def get_dashboard_stats(
    time_range: str = "6m",
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get aggregated stats for dashboard charts with time range"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can view stats"
        )
    
    # 1. Overall Stats
    total_volunteers = (await db.execute(select(func.count(UserDB.id)).where(UserDB.role == 'volunteer'))).scalar() or 0
    total_activities = (await db.execute(select(func.count(ActivityDB.id)))).scalar() or 0
    
    # 2. Activity Distribution (by Type)
    type_query = select(ActivityDB.activity_type, func.count(ActivityDB.id)).group_by(ActivityDB.activity_type)
    type_result = await db.execute(type_query)
    activity_distribution = [{"name": row[0] or "Unspecified", "value": row[1]} for row in type_result.all()]
    
    # 3. Trends Logic
    today = datetime.utcnow()
    trends_map = {}
    chart_keys = []
    
    if time_range == "7d":
        start_date = today - timedelta(days=6) # 0 to 6 = 7 days
        # Generate last 7 days keys
        for i in range(7):
             d = start_date + timedelta(days=i)
             k = d.strftime("%a") # Mon, Tue
             chart_keys.append(k)
             trends_map[k] = {"name": k, "total_events": 0, "volunteers_needed": 0, "volunteers_registered": 0}
        date_format = "%a"
        
    elif time_range == "30d":
        start_date = today - timedelta(days=29)
        # Generate last 30 days keys
        for i in range(30):
             d = start_date + timedelta(days=i)
             k = d.strftime("%d %b") # 12 Jan
             chart_keys.append(k)
             # Initialize if not exists (handling potential duplicate keys if simple format, but day-month is unique enough for 30d)
             if k not in trends_map:
                trends_map[k] = {"name": k, "total_events": 0, "volunteers_needed": 0, "volunteers_registered": 0}
        date_format = "%d %b"
        
    else: # 6m default
        start_date = today - timedelta(days=180)
        # Generate last 6 months keys
        # Simple approach: iterate monthly approx
        # Better approach: iterate by month
        for i in range(5, -1, -1):
            d = today - timedelta(days=i*30)
            k = d.strftime("%b")
            if k not in trends_map:
                 chart_keys.append(k)
                 trends_map[k] = {"name": k, "total_events": 0, "volunteers_needed": 0, "volunteers_registered": 0}
        date_format = "%b"

    trend_query = select(ActivityDB).where(ActivityDB.start_time >= start_date)
    trend_result = await db.execute(trend_query)
    recent_activities = trend_result.scalars().all()
    
    for act in recent_activities:
        if not act.start_time: continue
        key = act.start_time.strftime(date_format)
        
        # Handle 6m edge case where simple %b might collide if we go back 1 year, but here we limited to 180 days.
        # However, for 6m, we want to ensure we match the generated keys.
        # If the key exists (it should if generated correctly), add to it.
        if key in trends_map:
            trends_map[key]["total_events"] += 1
            trends_map[key]["volunteers_needed"] += (act.volunteers_needed or 0)
            trends_map[key]["volunteers_registered"] += (act.volunteers_registered or 0)
    
    # Return list in order of chart_keys
    chart_data = [trends_map[k] for k in chart_keys if k in trends_map]
    
    return {
        "stats": {
            "total_volunteers": total_volunteers,
            "total_activities": total_activities,
            "active_now": 5, 
        },
        "activity_distribution": activity_distribution,
        "participation_trends": chart_data
    }

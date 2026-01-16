from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
import qrcode
import io
import base64
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from ..db import get_database
from ..models.user import UserDB, UserResponse
from ..models.activity import ActivityDB
from ..dependencies import get_current_user

router = APIRouter()


def is_admin_or_staff(role: str) -> bool:
    return role in ["admin", "staff"]


@router.post("/admin/attendance/mark")
async def mark_attendance(
    activity_id: str,
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Mark a user as attended for an activity"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can mark attendance"
        )
    
    try:
        activity_uuid = UUID(activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    result = await db.execute(select(ActivityDB).where(ActivityDB.id == activity_uuid))
    activity = result.scalar_one_or_none()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Check if user exists
    try:
        user_uuid = UUID(user_id)
        user_result = await db.execute(select(UserDB).where(UserDB.id == user_uuid))
        user = user_result.scalar_one_or_none()
    except ValueError:
        # Try by email
        user_result = await db.execute(select(UserDB).where(UserDB.email == user_id))
        user = user_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id_str = str(user.id)
    attendees = activity.attendees or []
    
    if user_id_str in attendees:
        return {
            "message": "User already marked as attended",
            "activity_id": str(activity.id),
            "user_id": user_id_str,
            "user_name": user.name,
            "already_attended": True
        }
    
    # Add to attendees list
    new_attendees = attendees + [user_id_str]
    activity.attendees = new_attendees
    await db.commit()
    
    return {
        "message": "Attendance marked successfully",
        "activity_id": str(activity.id),
        "user_id": user_id_str,
        "user_name": user.name,
        "already_attended": False,
        "total_attended": len(new_attendees)
    }


@router.get("/admin/activities/{activity_id}/attendance")
async def get_attendance(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get live attendance count and list for an activity"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can view attendance"
        )
    
    try:
        activity_uuid = UUID(activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    result = await db.execute(select(ActivityDB).where(ActivityDB.id == activity_uuid))
    activity = result.scalar_one_or_none()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    attendee_ids = activity.attendees or []
    capacity = activity.capacity or 0
    
    # Get attendee details
    attendees = []
    for attendee_id in attendee_ids:
        try:
            user_uuid = UUID(attendee_id)
            user_result = await db.execute(select(UserDB).where(UserDB.id == user_uuid))
            user = user_result.scalar_one_or_none()
            if user:
                attendees.append({
                    "id": str(user.id),
                    "name": user.name,
                    "email": user.email
                })
        except ValueError:
            pass
    
    return {
        "activity_id": str(activity.id),
        "title": activity.title,
        "total_attended": len(attendee_ids),
        "capacity": capacity,
        "attendance_percentage": int((len(attendee_ids) / capacity * 100)) if capacity > 0 else 0,
        "attendees": attendees
    }


@router.get("/admin/activities/{activity_id}/qr")
async def generate_qr_code(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Generate QR code for activity check-in"""
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can generate QR codes"
        )
    
    try:
        activity_uuid = UUID(activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    result = await db.execute(select(ActivityDB).where(ActivityDB.id == activity_uuid))
    activity = result.scalar_one_or_none()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    qr_data = f"HOLYSHEET:ACTIVITY:{activity_id}:{datetime.utcnow().isoformat()}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "activity_id": str(activity.id),
        "title": activity.title,
        "qr_code": f"data:image/png;base64,{img_base64}",
        "qr_data": qr_data
    }

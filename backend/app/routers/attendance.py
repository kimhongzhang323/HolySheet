from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
import qrcode
import io
import base64
from ..db import get_database
from ..models.user import UserResponse, UserRole
from ..dependencies import get_current_user

router = APIRouter()

@router.post("/admin/attendance/mark")
async def mark_attendance(
    activity_id: str,
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Mark a user as attended for an activity"""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can mark attendance"
        )
    
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Check if user exists
    if ObjectId.is_valid(user_id):
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    else:
        user = await db.users.find_one({"email": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id_str = str(user["_id"])
    
    # Check if already attended
    attendees = activity.get("attendees", [])
    if user_id_str in attendees:
        return {
            "message": "User already marked as attended",
            "activity_id": str(activity["_id"]),
            "user_id": user_id_str,
            "user_name": user.get("name"),
            "already_attended": True
        }
    
    # Add to attendees list
    await db.activities.update_one(
        {"_id": ObjectId(activity_id)},
        {"$push": {"attendees": user_id_str}}
    )
    
    return {
        "message": "Attendance marked successfully",
        "activity_id": str(activity["_id"]),
        "user_id": user_id_str,
        "user_name": user.get("name"),
        "already_attended": False,
        "total_attended": len(attendees) + 1
    }


@router.get("/admin/activities/{activity_id}/attendance")
async def get_attendance(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get live attendance count and list for an activity"""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can view attendance"
        )
    
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    attendee_ids = activity.get("attendees", [])
    capacity = activity.get("capacity", 0)
    
    # Get attendee details
    attendees = []
    for attendee_id in attendee_ids:
        if ObjectId.is_valid(attendee_id):
            user = await db.users.find_one({"_id": ObjectId(attendee_id)})
            if user:
                attendees.append({
                    "id": str(user["_id"]),
                    "name": user.get("name"),
                    "email": user.get("email")
                })
    
    return {
        "activity_id": str(activity["_id"]),
        "title": activity["title"],
        "total_attended": len(attendee_ids),
        "capacity": capacity,
        "attendance_percentage": int((len(attendee_ids) / capacity * 100)) if capacity > 0 else 0,
        "attendees": attendees
    }


@router.get("/admin/activities/{activity_id}/qr")
async def generate_qr_code(
    activity_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Generate QR code for activity check-in"""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can generate QR codes"
        )
    
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Create QR code data (simple format for demo - in production, use encryption)
    qr_data = f"HOLYSHEET:ACTIVITY:{activity_id}:{datetime.utcnow().isoformat()}"
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "activity_id": str(activity["_id"]),
        "title": activity["title"],
        "qr_code": f"data:image/png;base64,{img_base64}",
        "qr_data": qr_data
    }

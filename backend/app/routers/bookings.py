from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from ..db import get_database
from ..models.booking import BookingDB, BookingCreate
from ..models.activity import ActivityDB
from ..models.user import UserResponse
from ..dependencies import get_current_user
from ..services.calendar import generate_google_calendar_link, generate_ics_content

router = APIRouter()


@router.post("/bookings")
async def create_booking(
    booking_req: BookingCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    try:
        activity_id = UUID(booking_req.activity_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Activity ID")
    
    # Find activity
    result = await db.execute(select(ActivityDB).where(ActivityDB.id == activity_id))
    activity = result.scalar_one_or_none()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Create Booking
    new_booking = BookingDB(
        user_id=UUID(current_user.id),
        activity_id=activity_id,
        status="confirmed",
        booked_at=datetime.utcnow(),
        notes=booking_req.notes
    )
    
    db.add(new_booking)
    await db.commit()
    await db.refresh(new_booking)
    
    # Generate Links
    google_link = generate_google_calendar_link(
        activity.title,
        activity.description or "",
        activity.location or "",
        activity.start_time,
        activity.end_time
    )
    
    ics_content = generate_ics_content(
        activity.title,
        activity.description or "",
        activity.location or "",
        activity.start_time,
        activity.end_time
    )
    
    return {
        "message": "Booking successful",
        "bookingId": str(new_booking.id),
        "links": {
            "googleCalendar": google_link,
            "ics": ics_content
        }
    }

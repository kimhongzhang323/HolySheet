from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from ..db import get_database
from ..models.booking import BookingCreate, BookingInDB, BookingStatus
from ..models.activity import ActivityInDB, ActivityResponse
from ..models.user import UserResponse
from ..dependencies import get_current_user
from ..services.tier import can_user_book
from ..services.calendar import generate_google_calendar_link, generate_ics_content

router = APIRouter()

async def check_conflict(user_id: str, new_start: datetime, new_end: datetime, db) -> bool:
    # Find all confirmed bookings for user
    cursor = db.bookings.find({"user_id": user_id, "status": BookingStatus.CONFIRMED})
    user_bookings = await cursor.to_list(length=1000)
    
    for booking in user_bookings:
        # We need activity details. In Mongo, usually separate collection.
        # So we must fetch activity for each booking or use aggregation.
        # Doing manual fetch for now (N+1 but simple for migration).
        activity = await db.activities.find_one({"_id": booking["activity_id"]})  # activity_id is ObjectId or str?
        # Note: In Pydantic we used str/PyObjectId. In Motor it might be ObjectId. 
        # We need to handle ObjectId conversion carefully.
        # Assuming activity_id stored as ObjectId in DB.
        
        if not activity: continue
        
        start = activity["start_time"]
        end = activity["end_time"]
        
        # Overlap check
        if start < new_end and end > new_start:
            return True
            
    return False

@router.post("/bookings")
async def create_booking(
    booking_req: BookingCreate,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    from bson import ObjectId
    
    activity_id = booking_req.activity_id
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid Activity ID")
        
    activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    target_activity = ActivityInDB(**activity)
    
    # Tier Check
    tier_check = await can_user_book(
        current_user.tier,
        str(current_user.id),
        target_activity.allowed_tiers,
        db
    )
    
    if not tier_check["allowed"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": tier_check["message"],
                "code": tier_check["reason"],
                "currentCount": tier_check.get("currentCount"),
                "limit": tier_check.get("limit")
            }
        )

    # Conflict Check
    if await check_conflict(str(current_user.id), target_activity.start_time, target_activity.end_time, db):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "You are already busy at this time.", "code": "CONFLICT"}
        )
        
    # Create Booking
    new_booking = BookingInDB(
        user_id=str(current_user.id),
        activity_id=str(target_activity.id),
        status=BookingStatus.CONFIRMED,
        timestamp=datetime.utcnow()
    )
    
    result = await db.bookings.insert_one(new_booking.model_dump(by_alias=True, exclude=["id"]))
    
    # Generate Links
    google_link = generate_google_calendar_link(
        target_activity.title,
        target_activity.description,
        target_activity.location,
        target_activity.start_time,
        target_activity.end_time
    )
    
    ics_content = generate_ics_content(
        target_activity.title,
        target_activity.description,
        target_activity.location,
        target_activity.start_time,
        target_activity.end_time
    )
    
    return {
        "message": "Booking successful",
        "bookingId": str(result.inserted_id),
        "links": {
            "googleCalendar": google_link,
            "ics": ics_content
        }
    }

from datetime import datetime, timedelta
from typing import Optional, Dict
from ..models.user import MembershipTier
from ..models.booking import BookingStatus

TIER_LIMITS: Dict[MembershipTier, Optional[int]] = {
    MembershipTier.AD_HOC: None,           # Unlimited
    MembershipTier.ONCE_A_WEEK: 1,
    MembershipTier.TWICE_A_WEEK: 2,
    MembershipTier.THREE_PLUS_A_WEEK: None # Unlimited
}

def get_week_boundaries(date: datetime = None):
    if date is None:
        date = datetime.now()
    
    # Monday is 0, Sunday is 6
    day = date.weekday()
    diff_to_monday = 0 - day # e.g. if Tue(1), diff is -1. 
    
    # Wait, JS getDay() 0 is Sunday. Python weekday() 0 is Monday.
    # Logic in TS was: day===0(Sun)? -6 : 1-day. 
    # Python: Monday=0. So Start is today - weekday.
    
    week_start = date.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=day)
    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)
    
    return week_start, week_end

async def get_user_weekly_booking_count(user_id: str, week_start: datetime, week_end: datetime, db) -> int:
    count = await db.bookings.count_documents({
        "user_id": user_id,
        "status": BookingStatus.CONFIRMED,
        "timestamp": {"$gte": week_start, "$lte": week_end}
    })
    return count

async def can_user_book(
    user_tier: MembershipTier,
    user_id: str,
    activity_allowed_tiers: Optional[list[MembershipTier]],
    db
) -> dict:
    # 1. Check tier eligibility
    if activity_allowed_tiers and len(activity_allowed_tiers) > 0:
        if user_tier not in activity_allowed_tiers:
            return {
                "allowed": False,
                "reason": "TIER_NOT_ALLOWED",
                "message": f"This activity is only available for: {', '.join([t.value for t in activity_allowed_tiers])}"
            }

    # 2. Check weekly limits
    limit = TIER_LIMITS.get(user_tier)
    
    if limit is None:
        return {"allowed": True}

    week_start, week_end = get_week_boundaries()
    current_count = await get_user_weekly_booking_count(user_id, week_start, week_end, db)

    if current_count >= limit:
        return {
            "allowed": False,
            "reason": "TIER_LIMIT_EXCEEDED",
            "message": f"You have reached your weekly booking limit of {limit}. Current bookings: {current_count}",
            "currentCount": current_count,
            "limit": limit
        }

    return {"allowed": True, "currentCount": current_count, "limit": limit}

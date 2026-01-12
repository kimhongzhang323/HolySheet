from fastapi import APIRouter, Depends
from typing import List, Optional
from datetime import datetime
from ..db import get_database
from ..models.activity import ActivityResponse
from ..models.user import UserResponse, UserRole, MembershipTier
from ..dependencies import get_current_user

router = APIRouter()

@router.get("/activities/feed", response_model=List[ActivityResponse])
async def get_activity_feed(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    now = datetime.utcnow()
    base_query = {"start_time": {"$gte": now}}
    
    query = {}
    
    if current_user.role == UserRole.VOLUNTEER:
        # Volunteers see "Needs Help" (and maybe others? Logic said prioritize needs_help)
        # Original: query = { ...baseQuery, needs_help: true };
        query = {**base_query, "needs_help": True}
    else:
        # Participants sees allowed tiers
        user_tier = current_user.tier or MembershipTier.AD_HOC
        
        # Logic: allowed_tiers doesnt exist, OR allows_tiers is empty, OR allowed_tiers contains user_tier
        query = {
            **base_query,
            "$or": [
                {"allowed_tiers": {"$exists": False}},
                {"allowed_tiers": {"$size": 0}},
                {"allowed_tiers": {"$in": [user_tier]}}
            ]
        }
        
    cursor = db.activities.find(query).sort("start_time", 1)
    activities = await cursor.to_list(length=100)
    return activities


@router.get("/activities/filter", response_model=List[ActivityResponse])
async def filter_activities(
    start_date: Optional[str] = None,  # YYYY-MM-DD
    end_date: Optional[str] = None,    # YYYY-MM-DD
    time_slot: Optional[str] = None,   # morning, afternoon, evening
    keyword: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Filter activities by date range, time slot, and keyword.
    
    - **start_date**: Start date (YYYY-MM-DD)
    - **end_date**: End date (YYYY-MM-DD)
    - **time_slot**: morning (before 12pm), afternoon (12pm-5pm), evening (after 5pm)
    - **keyword**: Search in title and description
    """
    from datetime import timedelta
    
    query = {"start_time": {"$gte": datetime.utcnow()}}
    
    # Date range filter
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            query["start_time"] = {"$gte": start}
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            if "start_time" in query:
                query["start_time"]["$lt"] = end
            else:
                query["start_time"] = {"$lt": end}
        except ValueError:
            pass
    
    # Keyword filter (case-insensitive) - searches title, description, and organiser
    if keyword:
        query["$or"] = [
            {"title": {"$regex": keyword, "$options": "i"}},
            {"description": {"$regex": keyword, "$options": "i"}},
            {"organiser": {"$regex": keyword, "$options": "i"}}
        ]
    
    # Tier filter for participants
    user_tier = current_user.tier or MembershipTier.AD_HOC
    if current_user.role != UserRole.VOLUNTEER:
        tier_filter = {
            "$or": [
                {"allowed_tiers": {"$exists": False}},
                {"allowed_tiers": {"$size": 0}},
                {"allowed_tiers": {"$in": [user_tier]}}
            ]
        }
        query = {"$and": [query, tier_filter]}
    
    cursor = db.activities.find(query).sort("start_time", 1)
    activities = await cursor.to_list(length=100)
    
    # Time slot filter (in Python since MongoDB time comparison is complex)
    if time_slot and activities:
        filtered = []
        for act in activities:
            hour = act["start_time"].hour
            if time_slot == "morning" and hour < 12:
                filtered.append(act)
            elif time_slot == "afternoon" and 12 <= hour < 17:
                filtered.append(act)
            elif time_slot == "evening" and hour >= 17:
                filtered.append(act)
        activities = filtered
    
    return activities


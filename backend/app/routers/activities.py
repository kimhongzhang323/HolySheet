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

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
from datetime import datetime

from .config import get_settings
from .db import get_database
from .models.user import UserDB, UserResponse

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

async def _get_user_response(user: UserDB, db: AsyncSession) -> UserResponse:
    # Calculate Dynamic Stats
    from .models.attendance import AttendanceDB
    from .models.volunteer import VolunteerDB
    from .models.activity import ActivityDB
    from sqlalchemy import func

    # Total events attended
    events_result = await db.execute(select(func.count(AttendanceDB.id)).where(AttendanceDB.user_id == user.id))
    total_events = events_result.scalar() or 0

    # Volunteer hours earned
    hours_result = await db.execute(select(func.sum(AttendanceDB.hours_earned)).where(AttendanceDB.user_id == user.id))
    volunteer_hours = hours_result.scalar() or 0

    # Volunteer count (specific activities of type 'volunteer')
    vol_query = select(func.count(AttendanceDB.id)).join(ActivityDB, AttendanceDB.activity_id == ActivityDB.id).where(
        AttendanceDB.user_id == user.id,
        ActivityDB.activity_type == "volunteer"
    )
    vol_count_result = await db.execute(vol_query)
    volunteer_count = vol_count_result.scalar() or 0

    # Meetups count (specific activities of type 'meetup')
    meetup_query = select(func.count(AttendanceDB.id)).join(ActivityDB, AttendanceDB.activity_id == ActivityDB.id).where(
        AttendanceDB.user_id == user.id,
        ActivityDB.activity_type == "meetup"
    )
    meetup_count_result = await db.execute(meetup_query)
    meetups_count = meetup_count_result.scalar() or 0

    # Dynamically build achievements based on real stats
    achievements = [
        {
            "id": "community-star", 
            "title": "Community Star", 
            "description": "Participate in community events", 
            "current": total_events, 
            "max": 10, 
            "color": "orange", 
            "icon": "star"
        },
        {
            "id": "green-warrior", 
            "title": "Green Warrior", 
            "description": "Join environment focused drives", 
            "current": volunteer_count, # Using volunteer count as proxy for now
            "max": 3, 
            "color": "green", 
            "icon": "leaf"
        },
        {
            "id": "time-keeper", 
            "title": "Time Keeper", 
            "description": "Accumulate volunteer hours", 
            "current": volunteer_hours, 
            "max": 50, 
            "color": "blue", 
            "icon": "clock"
        },
        {
            "id": "social-butterfly", 
            "title": "Social Butterfly", 
            "description": "Attend networking meetups", 
            "current": meetups_count, 
            "max": 10, 
            "color": "purple", 
            "icon": "users"
        }
    ]

    # Convert SQLAlchemy model to Pydantic response
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        image=user.image,
        role=user.role,
        tier=user.tier,
        skills=user.skills or [],
        phoneNumber=user.phone_number,
        isVerified=user.is_verified,
        address=user.address,
        profileDeadline=user.profile_deadline,
        emailVerified=user.email_verified,
        # Dynamic fields
        total_events=total_events,
        volunteer_count=volunteer_count,
        meetups_count=meetups_count,
        volunteer_hours=volunteer_hours,
        achievements=achievements
    )

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_database)
) -> UserResponse:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception

    # --- LOCAL DB AUTH (Bypass Supabase) ---
    # First, try to see if token is a direct user ID or email exists in our DB
    # This matches the user's request to "just check it with users table"
    try:
        from uuid import UUID
        is_uuid = False
        try:
            UUID(token)
            is_uuid = True
        except:
            pass

        if is_uuid:
            query = select(UserDB).where(UserDB.id == token)
        else:
            query = select(UserDB).where(UserDB.email == token)
            
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if user:
            return await _get_user_response(user, db)
    except Exception as e:
        print(f"[AUTH] Local DB check error: {e}")

    # --- SUPABASE FALLBACK ---
    supabase_url = settings.NEXT_PUBLIC_SUPABASE_URL
    anon_key = settings.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if not supabase_url or not anon_key:
        print("[AUTH] Supabase configuration missing.")
        raise HTTPException(status_code=500, detail="Server Auth Configuration Error")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": anon_key
                }
            )
            
            if response.status_code == 200:
                user_data = response.json()
                user_email = user_data.get("email")
                meta = user_data.get("user_metadata", {})
                user_name = meta.get("name") or meta.get("full_name") or user_email.split("@")[0]
                user_pic = meta.get("picture") or meta.get("avatar_url")
                user_id = user_data.get("id")

                from .services.auth import sync_supabase_user
                user = await sync_supabase_user(user_id, user_email, user_name, user_pic, db)
                return await _get_user_response(user, db)

    except Exception as e:
        print(f"[AUTH] Error verifying token with Supabase: {e}")

    raise credentials_exception


async def get_current_user_optional(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_database)
) -> Optional[UserResponse]:
    if not token:
        return None
    
    try:
        return await get_current_user(token, db)
    except HTTPException:
        return None

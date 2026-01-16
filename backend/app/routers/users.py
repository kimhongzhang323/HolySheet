from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from ..db import get_database
from ..models.user import UserDB, UserResponse
from ..dependencies import get_current_user

router = APIRouter()

def is_admin_or_staff(role: str) -> bool:
    return role in ["admin", "staff"]

class ProfileUpdate(BaseModel):
    phoneNumber: Optional[str] = None
    address: Optional[dict] = None

@router.post("/user/profile", response_model=UserResponse)
async def update_profile(
    update_data: ProfileUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    user_id = UUID(current_user.id)
    
    result = await db.execute(select(UserDB).where(UserDB.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if update_data.phoneNumber:
        user.phone_number = update_data.phoneNumber
    if update_data.address:
        user.address = update_data.address  # Already a dict
    
    await db.commit()
    await db.refresh(user)
    
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
        # New fields
        total_events=user.total_events or 0,
        volunteer_count=user.volunteer_count or 0,
        meetups_count=user.meetups_count or 0,
        volunteer_hours=user.volunteer_hours or 0,
        achievements=user.achievements or []
    )

@router.get("/user/profile", response_model=UserResponse)
async def get_profile(current_user: UserResponse = Depends(get_current_user)):
    return current_user

# --- Admin Routes for Users ---

@router.patch("/admin/users/{user_id}/tier")
async def update_user_tier(
    user_id: str,
    tier: str = Body(..., embed=True),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can update roles"
        )
    
    try:
        uuid_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid User ID")
    
    result = await db.execute(select(UserDB).where(UserDB.id == uuid_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.tier = tier
    await db.commit()
    await db.refresh(user)
    
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "tier": user.tier,
        "role": user.role
    }


@router.get("/admin/users/{user_id}/tier")
async def get_user_tier(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    if not is_admin_or_staff(current_user.role):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        uuid_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid User ID")
    
    result = await db.execute(select(UserDB).where(UserDB.id == uuid_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "userId": str(user.id),
        "name": user.name,
        "email": user.email,
        "tier": user.tier
    }

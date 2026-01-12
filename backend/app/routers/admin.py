from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import Optional
from bson import ObjectId
from ..db import get_database
from ..models.user import UserResponse, MembershipTier, UserRole
from ..dependencies import get_current_user

router = APIRouter()

@router.patch("/admin/users/{user_id}/tier", response_model=UserResponse)
async def update_user_tier(
    user_id: str,
    tier: MembershipTier = Body(..., embed=True), # Expect JSON { "tier": "..." }
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    # Authorization Check
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can update roles"
        )
        
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid User ID")
        
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"tier": tier}}
    )
    
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    return updated_user

@router.get("/admin/users/{user_id}/tier")
async def get_user_tier(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid User ID")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "userId": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "tier": user.get("tier", MembershipTier.AD_HOC)
    }

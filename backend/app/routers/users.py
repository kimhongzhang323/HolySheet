from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from ..db import get_database
from ..models.user import UserResponse, Address
from ..dependencies import get_current_user

router = APIRouter()

class ProfileUpdate(BaseModel):
    phoneNumber: Optional[str] = None
    address: Optional[Address] = None

@router.post("/user/profile", response_model=UserResponse)
async def update_profile(
    update_data: ProfileUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    user_id = ObjectId(current_user.id)
    
    update_fields = {}
    if update_data.phoneNumber:
        update_fields["phoneNumber"] = update_data.phoneNumber
    if update_data.address:
        # Pydantic model to dict, exclude None
        update_fields["address"] = update_data.address.model_dump(exclude_none=True)
        
    if not update_fields:
        return current_user # No changes

    await db.users.update_one(
        {"_id": user_id},
        {"$set": update_fields}
    )
    
    updated_user = await db.users.find_one({"_id": user_id})
    return updated_user

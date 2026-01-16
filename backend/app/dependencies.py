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
        
    # Verify token with Supabase Auth API
    supabase_url = settings.NEXT_PUBLIC_SUPABASE_URL
    anon_key = settings.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if not supabase_url or not anon_key:
        print("[AUTH] Supabase configuration missing.")
        raise HTTPException(status_code=500, detail="Server Auth Configuration Error")

    user_email = None
    user_name = None
    user_pic = None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": anon_key
                }
            )
            
            if response.status_code != 200:
                print(f"[AUTH] Supabase check failed: {response.text}")
                raise credentials_exception
            
            user_data = response.json()
            user_email = user_data.get("email")
            
            # Extract metadata
            meta = user_data.get("user_metadata", {})
            user_name = meta.get("name") or meta.get("full_name") or user_email.split("@")[0]
            user_pic = meta.get("picture") or meta.get("avatar_url")

    except Exception as e:
        print(f"[AUTH] Error verifying token: {e}")
        raise credentials_exception

    if not user_email:
        raise credentials_exception

    # Use Auth Service to Sync/Get User
    from .services.auth import sync_supabase_user
    
    user = await sync_supabase_user(user_email, user_name, user_pic, db)
    
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
        emailVerified=user.email_verified
    )


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

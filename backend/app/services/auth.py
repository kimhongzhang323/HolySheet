from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from ..models.user import UserDB

async def sync_supabase_user(user_email: str, user_name: str, user_image: str, db: AsyncSession) -> UserDB:
    """
    Syncs a Supabase user to the local database.
    If the user doesn't exist, it creates a new record.
    """
    # Check if user exists
    result = await db.execute(select(UserDB).where(UserDB.email == user_email))
    user = result.scalar_one_or_none()
    
    if user is None:
        print(f"[AUTH_SERVICE] Creating new user from Supabase: {user_email}")
        user = UserDB(
            email=user_email,
            name=user_name or user_email.split("@")[0],
            image=user_image,
            role="admin" if user_email == "admin@holysheet.com" else "user",
            tier="ad-hoc",
            skills=[],
            is_verified=True,
            created_at=datetime.utcnow()
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    return user

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
import random
import string
from ..db import get_database
from ..models.user import UserCreate, UserInDB, UserResponse
from ..dependencies import get_password_hash, verify_password, create_access_token
from ..services.email import send_verification_email
from google.oauth2 import id_token
from google.auth.transport import requests
from ..config import get_settings
from pydantic import BaseModel

settings = get_settings()

router = APIRouter()

def generate_otp():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@router.post("/auth/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db = Depends(get_database)):
    # Check existing
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists"
        )

    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # OTP
    otp = generate_otp()
    otp_expires = datetime.utcnow() + timedelta(minutes=15)
    
    user_in_db = UserInDB(
        **user.model_dump(exclude={"password"}),
        password=hashed_password,
        otp=otp,
        otpExpires=otp_expires
    )
    
    new_user = await db.users.insert_one(user_in_db.model_dump(by_alias=True, exclude=["id"]))
    
    # Send Email
    send_verification_email(user.email, otp)
    
    return {"userId": str(new_user.inserted_id), "message": "Account created. Please check your email for the OTP."}

@router.post("/auth/verify")
async def verify(email: str, otp: str, db = Depends(get_database)):
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.get("isVerified"):
        return {"message": "Already verified"}
        
    if user.get("otp") != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if user.get("otpExpires") < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP Expired")
        
    await db.users.update_one(
        {"email": email},
        {"$set": {"isVerified": True, "otp": None, "otpExpires": None}}
    )
    
    return {"message": "Email verified successfully"}

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_database)):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.get("isVerified"):
         raise HTTPException(status_code=400, detail="Account not verified")

    access_token_expires = timedelta(minutes=60 * 24 * 7)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

class GoogleAuthRequest(BaseModel):
    token: str

@router.post("/auth/google")
async def google_login(request: GoogleAuthRequest, db = Depends(get_database)):
    try:
        # Verify the ID token
        id_info = id_token.verify_oauth2_token(
            request.token, 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )

        email = id_info.get("email")
        name = id_info.get("name")
        picture = id_info.get("picture")
        
        if not email:
            raise HTTPException(status_code=400, detail="Invalid Google Token: No email found")

        # Find or Create User
        user = await db.users.find_one({"email": email})
        
        if not user:
            # Create new user for Google login
            new_user_data = {
                "name": name,
                "email": email,
                "image": picture,
                "role": "user", # Default role
                "tier": "ad-hoc", # Default tier
                "isVerified": True, # Trusted from Google
                "profileDeadline": datetime.utcnow() + timedelta(days=3) # Give time to fill profile
            }
            res = await db.users.insert_one(new_user_data)
            user = await db.users.find_one({"_id": res.inserted_id})
        else:
            # Update image/name if needed or just log them in
            # Ensure isVerified is true since they logged in with Google
             if not user.get("isVerified"):
                await db.users.update_one({"_id": user["_id"]}, {"$set": {"isVerified": True}})
        
        # Create Access Token
        access_token_expires = timedelta(minutes=60 * 24 * 7)
        access_token = create_access_token(
            data={"sub": email}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer", "user": {"email": email, "name": name, "role": user.get("role")}}

    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=401, detail=f"Invalid Google Token: {str(e)}")


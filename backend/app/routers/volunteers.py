from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timedelta
from ..db import get_database
from ..models.user import UserResponse, UserRole
from ..dependencies import get_current_user

router = APIRouter()

@router.get("/admin/volunteers/by-skills")
async def get_volunteers_by_skills(
    skills: str,  # Comma-separated skills
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Find volunteers with specific skills"""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can access volunteer management"
        )
    
    skill_list = [s.strip() for s in skills.split(",")]
    
    # Find users with volunteer role and matching skills
    query = {
        "role": {"$in": [UserRole.VOLUNTEER, "volunteer"]},
        "skills": {"$in": skill_list}
    }
    
    cursor = db.users.find(query)
    volunteers = await cursor.to_list(length=200)
    
    result = []
    for vol in volunteers:
        matching_skills = [s for s in vol.get("skills", []) if s in skill_list]
        result.append({
            "id": str(vol["_id"]),
            "name": vol.get("name"),
            "email": vol.get("email"),
            "phone": vol.get("phoneNumber"),
            "skills": vol.get("skills", []),
            "matching_skills": matching_skills,
            "tier": vol.get("tier")
        })
    
    return {
        "requested_skills": skill_list,
        "total_found": len(result),
        "volunteers": result
    }


@router.get("/admin/volunteers/crisis-dashboard")
async def get_crisis_dashboard(
    days_ahead: int = 7,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get activities with unmet volunteer quotas"""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can access crisis dashboard"
        )
    
    now = datetime.utcnow()
    future_date = now + timedelta(days=days_ahead)
    
    # Find upcoming activities
    query = {
        "start_time": {"$gte": now, "$lte": future_date},
        "volunteers_needed": {"$gt": 0}
    }
    
    cursor = db.activities.find(query).sort("start_time", 1)
    activities = await cursor.to_list(length=100)
    
    crisis_items = []
    for activity in activities:
        volunteers_needed = activity.get("volunteers_needed", 0)
        volunteers_registered = activity.get("volunteers_registered", 0)
        shortage = max(0, volunteers_needed - volunteers_registered)
        
        fill_percentage = 0
        if volunteers_needed > 0:
            fill_percentage = int((volunteers_registered / volunteers_needed) * 100)
        
        # Determine status
        status_label = "ok"
        if fill_percentage < 50:
            status_label = "critical"
        elif fill_percentage < 100:
            status_label = "warning"
        
        # Calculate hours until event
        hours_until = (activity["start_time"] - now).total_seconds() / 3600
        
        crisis_items.append({
            "activity_id": str(activity["_id"]),
            "title": activity["title"],
            "start_time": activity["start_time"],
            "hours_until": int(hours_until),
            "location": activity.get("location"),
            "volunteers_needed": volunteers_needed,
            "volunteers_registered": volunteers_registered,
            "shortage": shortage,
            "fill_percentage": fill_percentage,
            "status": status_label,
            "skills_required": activity.get("skills_required", []),
            "needs_help": activity.get("needs_help", False)
        })
    
    # Sort by urgency (critical first, then by time)
    crisis_items.sort(key=lambda x: (
        0 if x["status"] == "critical" else 1 if x["status"] == "warning" else 2,
        x["hours_until"]
    ))
    
    return {
        "total_activities": len(crisis_items),
        "critical_count": len([i for i in crisis_items if i["status"] == "critical"]),
        "warning_count": len([i for i in crisis_items if i["status"] == "warning"]),
        "activities": crisis_items
    }


@router.post("/admin/volunteers/generate-blast")
async def generate_volunteer_blast(
    activity_id: str = Body(..., embed=True),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Generate WhatsApp blast message for volunteer recruitment"""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can generate blast messages"
        )
    
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Find matching volunteers
    skills_required = activity.get("skills_required", [])
    query = {"role": {"$in": [UserRole.VOLUNTEER, "volunteer"]}}
    
    if skills_required:
        query["skills"] = {"$in": skills_required}
    
    cursor = db.users.find(query)
    volunteers = await cursor.to_list(length=200)
    
    # Generate message template
    shortage = activity.get("volunteers_needed", 0) - activity.get("volunteers_registered", 0)
    activity_date = activity["start_time"].strftime("%A, %B %d at %I:%M %p")
    
    message_template = f"""Hi {{name}}! 👋

We need {shortage} more volunteer(s) for:
📅 {activity['title']}
🕐 {activity_date}
📍 {activity.get('location', 'TBA')}

Would you be available to help? Your support makes a difference! 🙌

Reply YES to confirm."""
    
    # Generate WhatsApp links
    blast_targets = []
    for vol in volunteers:
        phone = vol.get("phoneNumber", "")
        if phone:
            # Format phone number (remove special characters)
            clean_phone = ''.join(filter(str.isdigit, phone))
            personalized_msg = message_template.replace("{name}", vol.get("name", "there"))
            whatsapp_url = f"https://wa.me/{clean_phone}?text={personalized_msg}"
            
            blast_targets.append({
                "volunteer_id": str(vol["_id"]),
                "name": vol.get("name"),
                "phone": phone,
                "skills": vol.get("skills", []),
                "whatsapp_link": whatsapp_url
            })
    
    return {
        "activity_id": str(activity["_id"]),
        "activity_title": activity["title"],
        "shortage": shortage,
        "message_template": message_template,
        "total_targets": len(blast_targets),
        "targets": blast_targets
    }

from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timedelta
from ..db import get_database
from ..models.user import UserResponse, UserRole
from ..dependencies import get_current_user
from ..services import ai_service

router = APIRouter()

# Rate limiting cache (simple in-memory - in production use Redis)
from collections import defaultdict
from time import time

request_counts = defaultdict(list)
RATE_LIMIT = 10  # requests per minute
RATE_WINDOW = 60  # seconds


def check_rate_limit(user_id: str) -> bool:
    """Check if user has exceeded rate limit"""
    now = time()
    user_requests = request_counts[user_id]
    
    # Remove old requests outside the window
    request_counts[user_id] = [req_time for req_time in user_requests if now - req_time < RATE_WINDOW]
    
    if len(request_counts[user_id]) >= RATE_LIMIT:
        return False
    
    request_counts[user_id].append(now)
    return True


@router.post("/admin/ai/summarize-feedback")
async def summarize_feedback(
    start_date: Optional[str] = Body(None),
    end_date: Optional[str] = Body(None),
    activity_id: Optional[str] = Body(None),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Summarize feedback from a date range or specific activity"""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can access AI features"
        )
    
    # Check rate limit
    user_id_str = str(current_user.id) if current_user.id else "anonymous"
    if not check_rate_limit(user_id_str):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again in a minute."
        )
    
    # For demo purposes, create mock feedback
    # In production, fetch from a feedback collection
    feedback_list = [
        "The AC in Hall B is too cold, making it uncomfortable.",
        "The swimming instructor was very patient and helpful.",
        "Need more vegetarian options for lunch.",
        "Activity was well-organized and enjoyable.",
        "The AC temperature needs adjustment in Hall B."
    ]
    
    # TODO: Replace with actual database query when feedback collection exists
    # query = {}
    # if activity_id and ObjectId.is_valid(activity_id):
    #     query["activity_id"] = ObjectId(activity_id)
    # if start_date and end_date:
    #     query["created_at"] = {...}
    
    summary = await ai_service.summarize_feedback(feedback_list)
    
    return {
        "summary": summary,
        "total_feedback": len(feedback_list),
        "date_range": {
            "start": start_date,
            "end": end_date
        }
    }


@router.post("/admin/ai/match-volunteers")
async def match_volunteers_for_activity(
    activity_id: str = Body(..., embed=True),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get AI-powered volunteer suggestions for an activity"""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can access AI features"
        )
    
    # Check rate limit
    user_id_str = str(current_user.id) if current_user.id else "anonymous"
    if not check_rate_limit(user_id_str):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again in a minute."
        )
    
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID")
    
    activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Get volunteers with matching skills
    skills_required = activity.get("skills_required", [])
    query = {"role": {"$in": [UserRole.VOLUNTEER, "volunteer"]}}
    
    if skills_required:
        query["skills"] = {"$in": skills_required}
    
    cursor = db.users.find(query)
    volunteers = await cursor.to_list(length=100)
    
    # Get AI matching
    matches = await ai_service.match_volunteers(activity, volunteers)
    
    return {
        "activity_id": str(activity["_id"]),
        "activity_title": activity["title"],
        "skills_required": skills_required,
        "total_volunteers_found": len(volunteers),
        "matches": matches[:10]  # Top 10 matches
    }


@router.post("/admin/ai/query")
async def process_natural_language_query(
    query: str = Body(..., embed=True),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Process natural language data queries"""
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can access AI features"
        )
    
    # Check rate limit
    user_id_str = str(current_user.id) if current_user.id else "anonymous"
    if not check_rate_limit(user_id_str):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again in a minute."
        )
    
    # Gather context data
    now = datetime.utcnow()
    week_from_now = now + timedelta(days=7)
    
    # Get upcoming activities count
    upcoming_count = await db.activities.count_documents({
        "start_time": {"$gte": now, "$lte": week_from_now}
    })
    
    # Get volunteer count
    volunteer_count = await db.users.count_documents({
        "role": {"$in": [UserRole.VOLUNTEER, "volunteer"]}
    })
    
    # Get activities needing volunteers
    activities_needing_help = await db.activities.count_documents({
        "start_time": {"$gte": now},
        "needs_help": True
    })
    
    context = {
        "current_date": now.strftime("%Y-%m-%d"),
        "upcoming_activities_this_week": upcoming_count,
        "total_volunteers": volunteer_count,
        "activities_needing_help": activities_needing_help
    }
    
    answer = await ai_service.process_query(query, context)
    
    return {
        "query": query,
        "answer": answer,
        "context_used": context
    }


@router.post("/admin/ai/chat")
async def chat_copilot(
    query: str = Body(..., embed=True),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Main Ops Copilot endpoint handling tool execution
    """
    # 1. First pass - let AI decide tools
    response = await ai_service.chat_with_tools(query)
    
    if not response or not response.candidates:
        return {"answer": "Sorry, I'm having trouble connecting to my brain right now."}
        
    part = response.candidates[0].content.parts[0]
    
    # 2. Check for function calls
    if part.function_call:
        fn_name = part.function_call.name
        args = part.function_call.args
        
        result_content = ""
        tool_result = {}
        
        if fn_name == "get_volunteer_shortages":
            days = int(args.get("days_ahead", 7))
            now = datetime.utcnow()
            future = now + timedelta(days=days)
            
            # Find activities with 0 volunteers
            cursor = db.activities.find({
                "start_time": {"$gte": now, "$lte": future},
                "volunteers_registered": 0
            })
            activities = await cursor.to_list(length=10)
            
            if not activities:
                result_content = f"I found no activities with zero volunteers in the next {days} days."
            else:
                activities_data = []
                for act in activities:
                    activities_data.append({
                        "title": act["title"],
                        "date": act["start_time"].strftime("%Y-%m-%d %H:%M"),
                        "needed": act.get("volunteers_needed", 0)
                    })
                
                # We'll return this structured data to the frontend so it can render "Draft Messages"
                result_content = f"Found {len(activities)} activities needing volunteers: {', '.join([a['title'] for a in activities_data])}"
                tool_result = {"activities": activities_data, "action": "draft_messages"}
                
        elif fn_name == "summarize_feedback_tool":
            # Mock feedback fetch
            feedback_list = [
                "The AC in Hall B is too cold.", 
                "Seniors felt cold in Hall B.", 
                "Great yoga session.", 
                "Lunch was delicious."
            ]
            summary = await ai_service.summarize_feedback(feedback_list)
            result_content = summary
            tool_result = {"summary": summary, "action": "show_summary"}
            
        else:
            result_content = "Function not implemented."
            
        # 3. For now, we return the tool result directly to frontend to render special UI
        # Or we can feed it back to Gemini to get a conversational response.
        # Let's return a hybrid response.
        
        return {
            "answer": result_content, # Simple text answer
            "tool_used": fn_name,
            "tool_result": tool_result
        }
    
    # 3. No function call - text response (Auto Data Query fallback to process_query style)
    # If standard text, just return it
    if part.text:
        return {"answer": part.text}
        
    return {"answer": "I understood that, but I'm not sure what to do."}

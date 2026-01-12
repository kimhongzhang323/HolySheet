"""
MINDS Buddy AI Agent Service

Implements function calling tools for the Gemini-powered chat agent.
The agent can search activities, check tier limits, and book activities for users.
"""

from datetime import datetime, timedelta
from typing import Optional, List, Any
from bson import ObjectId
from google.genai import types

# Tool definitions for Gemini function calling
AGENT_TOOLS = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="search_activities",
                description="Search for available activities by date, time of day, or keyword. Use this when the user asks about what activities are available.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "query": types.Schema(
                            type=types.Type.STRING,
                            description="Optional keyword to search for (e.g., 'art', 'music', 'sports')"
                        ),
                        "date": types.Schema(
                            type=types.Type.STRING,
                            description="Date to search for in YYYY-MM-DD format"
                        ),
                        "time_slot": types.Schema(
                            type=types.Type.STRING,
                            description="Time of day: 'morning' (before 12pm), 'afternoon' (12pm-5pm), or 'evening' (after 5pm)"
                        )
                    }
                )
            ),
            types.FunctionDeclaration(
                name="check_tier_limit",
                description="Check if the current user can make another booking this week based on their membership tier. Use this when the user asks if they can book more activities.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={}
                )
            ),
            types.FunctionDeclaration(
                name="book_activity",
                description="Book an activity for the user. Use this when the user confirms they want to book a specific activity.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "activity_id": types.Schema(
                            type=types.Type.STRING,
                            description="The ID of the activity to book"
                        )
                    },
                    required=["activity_id"]
                )
            ),
            types.FunctionDeclaration(
                name="get_user_bookings",
                description="Get the user's current bookings. Use this when the user asks about their schedule or what they've already booked.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={}
                )
            )
        ]
    )
]

# Tool handler implementations
async def search_activities(db, query: str = None, date: str = None, time_slot: str = None) -> List[dict]:
    """Search for activities based on criteria."""
    filter_query = {"start_time": {"$gte": datetime.utcnow()}}
    
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d")
            next_day = target_date + timedelta(days=1)
            filter_query["start_time"] = {"$gte": target_date, "$lt": next_day}
        except ValueError:
            pass  # Invalid date format, skip filter
    
    if time_slot:
        # We'll filter in Python after fetching since MongoDB date comparison is complex
        pass
    
    cursor = db.activities.find(filter_query).limit(10)
    activities = await cursor.to_list(length=10)
    
    # Filter by time slot in Python
    if time_slot and activities:
        filtered = []
        for act in activities:
            hour = act["start_time"].hour
            if time_slot == "morning" and hour < 12:
                filtered.append(act)
            elif time_slot == "afternoon" and 12 <= hour < 17:
                filtered.append(act)
            elif time_slot == "evening" and hour >= 17:
                filtered.append(act)
        activities = filtered
    
    # Filter by keyword/query
    if query and activities:
        query_lower = query.lower()
        activities = [a for a in activities if query_lower in a.get("title", "").lower() or query_lower in a.get("description", "").lower()]
    
    # Format for response
    result = []
    for act in activities:
        result.append({
            "id": str(act["_id"]),
            "title": act.get("title", "Untitled"),
            "description": act.get("description", ""),
            "start_time": act["start_time"].strftime("%Y-%m-%d %H:%M"),
            "end_time": act["end_time"].strftime("%Y-%m-%d %H:%M") if act.get("end_time") else None,
            "location": act.get("location", "TBD")
        })
    
    return result

async def check_tier_limit(db, user_id: str, user_tier: str) -> dict:
    """Check if user can book based on their tier limits."""
    from .tier import TIER_LIMITS, get_week_boundaries, get_user_weekly_booking_count, MembershipTier
    
    # Handle legacy 'weekly' tier
    tier_map = {
        "ad-hoc": MembershipTier.AD_HOC,
        "weekly": MembershipTier.WEEKLY,
        "once-a-week": MembershipTier.ONCE_A_WEEK,
        "twice-a-week": MembershipTier.TWICE_A_WEEK,
        "three-plus-a-week": MembershipTier.THREE_PLUS_A_WEEK
    }
    
    tier = tier_map.get(user_tier, MembershipTier.AD_HOC)
    limit = TIER_LIMITS.get(tier)
    
    if limit is None:
        return {"can_book": True, "message": "You have unlimited bookings with your tier!", "current": 0, "limit": "unlimited"}
    
    week_start, week_end = get_week_boundaries()
    current_count = await get_user_weekly_booking_count(user_id, week_start, week_end, db)
    
    can_book = current_count < limit
    remaining = limit - current_count
    
    return {
        "can_book": can_book,
        "current": current_count,
        "limit": limit,
        "remaining": remaining,
        "message": f"You have {remaining} booking(s) remaining this week." if can_book else f"You've reached your weekly limit of {limit} bookings."
    }

async def book_activity(db, user_id: str, user_tier: str, activity_id: str) -> dict:
    """Book an activity for the user."""
    from .tier import can_user_book
    from .calendar import generate_google_calendar_link
    
    if not ObjectId.is_valid(activity_id):
        return {"success": False, "message": "Invalid activity ID"}
    
    activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
    if not activity:
        return {"success": False, "message": "Activity not found"}
    
    # Check tier limits
    tier_map = {
        "ad-hoc": "ad-hoc",
        "weekly": "weekly",
        "once-a-week": "once-a-week",
        "twice-a-week": "twice-a-week",
        "three-plus-a-week": "three-plus-a-week"
    }
    from ..models.user import MembershipTier
    tier_enum = MembershipTier(tier_map.get(user_tier, "ad-hoc"))
    
    allowed_tiers = activity.get("allowed_tiers", [])
    tier_check = await can_user_book(tier_enum, user_id, [MembershipTier(t) for t in allowed_tiers] if allowed_tiers else None, db)
    
    if not tier_check["allowed"]:
        return {"success": False, "message": tier_check["message"]}
    
    # Create booking
    booking = {
        "user_id": user_id,
        "activity_id": str(activity["_id"]),
        "status": "confirmed",
        "timestamp": datetime.utcnow()
    }
    
    await db.bookings.insert_one(booking)
    
    # Generate calendar link
    calendar_link = generate_google_calendar_link(
        activity.get("title", "Activity"),
        activity.get("description", ""),
        activity.get("location", ""),
        activity["start_time"],
        activity.get("end_time", activity["start_time"] + timedelta(hours=1))
    )
    
    return {
        "success": True,
        "message": f"Successfully booked '{activity.get('title')}'!",
        "activity": activity.get("title"),
        "date": activity["start_time"].strftime("%Y-%m-%d %H:%M"),
        "calendar_link": calendar_link
    }

async def get_user_bookings(db, user_id: str) -> List[dict]:
    """Get user's current bookings."""
    cursor = db.bookings.find({
        "user_id": user_id,
        "status": "confirmed"
    }).sort("timestamp", -1).limit(10)
    
    bookings = await cursor.to_list(length=10)
    
    result = []
    for booking in bookings:
        # Get activity details
        activity = await db.activities.find_one({"_id": ObjectId(booking["activity_id"])}) if ObjectId.is_valid(booking.get("activity_id", "")) else None
        
        result.append({
            "booking_id": str(booking["_id"]),
            "activity_title": activity.get("title", "Unknown") if activity else "Unknown",
            "date": activity["start_time"].strftime("%Y-%m-%d %H:%M") if activity else "Unknown",
            "location": activity.get("location", "TBD") if activity else "TBD",
            "status": booking.get("status", "confirmed")
        })
    
    return result

# Tool dispatcher
async def execute_tool(tool_name: str, args: dict, db, user_id: str, user_tier: str) -> Any:
    """Execute a tool by name with given arguments."""
    if tool_name == "search_activities":
        return await search_activities(db, **args)
    elif tool_name == "check_tier_limit":
        return await check_tier_limit(db, user_id, user_tier)
    elif tool_name == "book_activity":
        return await book_activity(db, user_id, user_tier, **args)
    elif tool_name == "get_user_bookings":
        return await get_user_bookings(db, user_id)
    else:
        return {"error": f"Unknown tool: {tool_name}"}

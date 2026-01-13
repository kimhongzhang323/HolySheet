"""
MINDS Buddy AI Agent Service

Implements function calling tools for the Gemini-powered chat agent.
The agent can search activities, check tier limits, book activities for users,
and intelligently analyze registration requirements for activities.
"""

from datetime import datetime, timedelta
from typing import Optional, List, Any, Dict
from bson import ObjectId
from google.genai import types

# Keywords that trigger specific form field suggestions
FORM_FIELD_KEYWORDS = {
    "wheelchair": {
        "field_name": "wheelchair_access",
        "field_type": "boolean",
        "label": "Do you require wheelchair accessibility?",
        "required": False
    },
    "accessible": {
        "field_name": "wheelchair_access",
        "field_type": "boolean",
        "label": "Do you require wheelchair accessibility?",
        "required": False
    },
    "caregiver": {
        "field_name": "caregiver_info",
        "field_type": "text",
        "label": "Caregiver name and contact (if applicable)",
        "required": False
    },
    "payment": {
        "field_name": "payment_method",
        "field_type": "select",
        "label": "Preferred payment method",
        "options": ["Cash", "PayNow", "Credit Card", "Caregiver pays"],
        "required": True
    },
    "meal": {
        "field_name": "dietary_restrictions",
        "field_type": "text",
        "label": "Any dietary restrictions or allergies?",
        "required": False
    },
    "food": {
        "field_name": "dietary_restrictions",
        "field_type": "text",
        "label": "Any dietary restrictions or allergies?",
        "required": False
    },
    "lunch": {
        "field_name": "dietary_restrictions",
        "field_type": "text",
        "label": "Any dietary restrictions or allergies?",
        "required": False
    },
    "transport": {
        "field_name": "transport_needs",
        "field_type": "select",
        "label": "Do you need transportation assistance?",
        "options": ["No", "Pick-up needed", "Drop-off needed", "Both"],
        "required": False
    },
    "medical": {
        "field_name": "medical_conditions",
        "field_type": "text",
        "label": "Any medical conditions we should be aware of?",
        "required": False
    },
    "emergency": {
        "field_name": "emergency_contact",
        "field_type": "text",
        "label": "Emergency contact name and phone number",
        "required": True
    }
}

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
            ),
            # New AI-powered form tools
            types.FunctionDeclaration(
                name="analyze_activity_requirements",
                description="Analyze an activity to determine what registration form fields are needed. Use this when the user wants to book an activity to understand what additional information is required (e.g., wheelchair access, dietary needs, caregiver info).",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "activity_id": types.Schema(
                            type=types.Type.STRING,
                            description="The ID of the activity to analyze"
                        )
                    },
                    required=["activity_id"]
                )
            ),
            types.FunctionDeclaration(
                name="book_with_form",
                description="Book an activity with additional registration form data. Use this when the user provides answers to registration questions (like wheelchair needs, dietary restrictions, emergency contacts).",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "activity_id": types.Schema(
                            type=types.Type.STRING,
                            description="The ID of the activity to book"
                        ),
                        "wheelchair_access": types.Schema(
                            type=types.Type.BOOLEAN,
                            description="Whether the user needs wheelchair accessibility"
                        ),
                        "caregiver_info": types.Schema(
                            type=types.Type.STRING,
                            description="Caregiver name and contact information"
                        ),
                        "dietary_restrictions": types.Schema(
                            type=types.Type.STRING,
                            description="Any dietary restrictions or allergies"
                        ),
                        "transport_needs": types.Schema(
                            type=types.Type.STRING,
                            description="Transportation assistance needs"
                        ),
                        "medical_conditions": types.Schema(
                            type=types.Type.STRING,
                            description="Any medical conditions to be aware of"
                        ),
                        "emergency_contact": types.Schema(
                            type=types.Type.STRING,
                            description="Emergency contact name and phone"
                        ),
                        "payment_method": types.Schema(
                            type=types.Type.STRING,
                            description="Preferred payment method"
                        )
                    },
                    required=["activity_id"]
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


async def analyze_activity_requirements(db, activity_id: str) -> dict:
    """
    Analyze an activity's description to determine what registration form fields are needed.
    Uses keyword matching to suggest relevant form fields based on activity content.
    """
    if not ObjectId.is_valid(activity_id):
        return {"success": False, "message": "Invalid activity ID", "fields": []}
    
    activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
    if not activity:
        return {"success": False, "message": "Activity not found", "fields": []}
    
    # Check if activity already has custom form fields defined
    existing_fields = activity.get("custom_form_fields", [])
    if existing_fields:
        return {
            "success": True,
            "activity_title": activity.get("title", "Untitled"),
            "message": "This activity has predefined registration fields.",
            "fields": existing_fields,
            "source": "predefined"
        }
    
    # Analyze description and title for keywords
    text_to_analyze = f"{activity.get('title', '')} {activity.get('description', '')}".lower()
    
    suggested_fields = []
    seen_field_names = set()
    
    for keyword, field_config in FORM_FIELD_KEYWORDS.items():
        if keyword in text_to_analyze:
            field_name = field_config["field_name"]
            if field_name not in seen_field_names:
                suggested_fields.append(field_config)
                seen_field_names.add(field_name)
    
    # If no specific fields found, suggest basic emergency contact
    if not suggested_fields:
        suggested_fields.append({
            "field_name": "emergency_contact",
            "field_type": "text",
            "label": "Emergency contact name and phone number",
            "required": False
        })
    
    return {
        "success": True,
        "activity_title": activity.get("title", "Untitled"),
        "activity_description": activity.get("description", ""),
        "message": f"Based on the activity description, we suggest collecting the following information from participants.",
        "fields": suggested_fields,
        "source": "ai_analyzed"
    }


async def book_with_form(db, user_id: str, user_tier: str, activity_id: str, **form_data) -> dict:
    """
    Book an activity with additional registration form data.
    Stores the form responses along with the booking.
    """
    from .tier import can_user_book
    from .calendar import generate_google_calendar_link
    
    if not ObjectId.is_valid(activity_id):
        return {"success": False, "message": "Invalid activity ID"}
    
    activity = await db.activities.find_one({"_id": ObjectId(activity_id)})
    if not activity:
        return {"success": False, "message": "Activity not found"}
    
    # Check tier limits
    from ..models.user import MembershipTier
    tier_map = {
        "ad-hoc": "ad-hoc",
        "weekly": "weekly",
        "once-a-week": "once-a-week",
        "twice-a-week": "twice-a-week",
        "three-plus-a-week": "three-plus-a-week"
    }
    tier_enum = MembershipTier(tier_map.get(user_tier, "ad-hoc"))
    
    allowed_tiers = activity.get("allowed_tiers", [])
    tier_check = await can_user_book(
        tier_enum, 
        user_id, 
        [MembershipTier(t) for t in allowed_tiers] if allowed_tiers else None, 
        db
    )
    
    if not tier_check["allowed"]:
        return {"success": False, "message": tier_check["message"]}
    
    # Clean form data - remove None values and activity_id
    form_responses = {k: v for k, v in form_data.items() if v is not None and k != "activity_id"}
    
    # Create booking with form responses
    booking = {
        "user_id": user_id,
        "activity_id": str(activity["_id"]),
        "status": "confirmed",
        "timestamp": datetime.utcnow(),
        "form_responses": form_responses if form_responses else None
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
    
    # Build response message
    collected_info = []
    if form_responses.get("wheelchair_access"):
        collected_info.append("wheelchair accessibility noted")
    if form_responses.get("dietary_restrictions"):
        collected_info.append(f"dietary needs: {form_responses['dietary_restrictions']}")
    if form_responses.get("caregiver_info"):
        collected_info.append("caregiver information recorded")
    if form_responses.get("emergency_contact"):
        collected_info.append("emergency contact saved")
    
    info_summary = f" We've noted: {', '.join(collected_info)}." if collected_info else ""
    
    return {
        "success": True,
        "message": f"Successfully booked '{activity.get('title')}'!{info_summary}",
        "activity": activity.get("title"),
        "date": activity["start_time"].strftime("%Y-%m-%d %H:%M"),
        "location": activity.get("location", "TBD"),
        "calendar_link": calendar_link,
        "form_responses_saved": bool(form_responses)
    }


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
    elif tool_name == "analyze_activity_requirements":
        return await analyze_activity_requirements(db, **args)
    elif tool_name == "book_with_form":
        return await book_with_form(db, user_id, user_tier, **args)
    else:
        return {"error": f"Unknown tool: {tool_name}"}

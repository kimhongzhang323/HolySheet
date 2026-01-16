"""
Unified AI Service for MINDS Activity Hub
Combines Admin Copilot (formerly ai_service.py) and User Agent (formerly agent.py)
"""

import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from uuid import UUID

from google import genai
from google.genai import types
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# --- Configuration ---
# Initialize Gemini client
# Note: Client instantiation might be better handled in a dependency or singleton pattern
# but sticking to existing pattern for now (checking env var).
api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY", "")
admin_api_key = os.getenv("ADMIN_GOOGLE_GENERATIVE_AI_API_KEY", "")
client = genai.Client(api_key=api_key) if api_key else None
admin_client = genai.Client(api_key=admin_api_key) if admin_api_key else client

# --- Admin Copilot Functions (formerly ai_service.py) ---

async def summarize_feedback(feedback_list: List[str]) -> str:
    """Summarize a list of feedback entries into a concise one-sentence summary"""
    if not feedback_list:
        return "No feedback available to summarize."
    
    if len(feedback_list) == 1:
        return feedback_list[0]
    
    combined_feedback = "\n".join([f"- {fb}" for fb in feedback_list])
    
    prompt = f"""You are analyzing feedback from caregivers and participants at a MINDS activity hub.
Please summarize the following feedback entries into ONE concise sentence highlighting the main themes or concerns:

{combined_feedback}

Summary (one sentence):"""
    
    try:
        if not admin_client: return "AI Client not configured"
        response = admin_client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        return f"Error generating summary: {str(e)}"


async def match_volunteers(activity_dict: Dict, volunteers: List[Dict]) -> List[Dict]:
    """Analyze activity requirements and rank volunteers by suitability"""
    if not volunteers:
        return []
    
    activity_title = activity_dict.get("title", "")
    skills_required = activity_dict.get("skills_required", [])
    start_time = activity_dict.get("start_time", datetime.utcnow())
    
    volunteer_profiles = []
    for vol in volunteers:
        profile = f"{vol.get('name', 'Unknown')} - Skills: {', '.join(vol.get('skills', []))}"
        volunteer_profiles.append(profile)
    
    profiles_text = "\n".join(volunteer_profiles)
    
    prompt = f"""You are a volunteer coordinator AI for MINDS activity hub.

Activity: {activity_title}
Required Skills: {', '.join(skills_required) if skills_required else 'None specified'}
Date: {start_time.strftime('%A, %B %d at %I:%M %p')}

Available Volunteers:
{profiles_text}

Rank these volunteers by suitability (1-100 confidence score). Return ONLY a JSON array with this format:
[{{"name": "Volunteer Name", "score": 95, "reason": "Perfect match for required skills"}}]

JSON:"""
    
    try:
        if not admin_client: return []
        response = admin_client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt
        )
        
        response_text = response.text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        
        matches = json.loads(response_text)
        return matches
    except Exception as e:
        # Fallback: simple skill matching
        results = []
        for vol in volunteers:
            vol_skills = set(vol.get("skills", []))
            required_skills_set = set(skills_required)
            matching_skills = vol_skills.intersection(required_skills_set)
            
            score = 50
            if matching_skills:
                score = min(100, 60 + len(matching_skills) * 20)
            
            results.append({
                "name": vol.get("name"),
                "score": score,
                "reason": f"Matches {len(matching_skills)} required skill(s)" if matching_skills else "General volunteer"
            })
        return sorted(results, key=lambda x: x["score"], reverse=True)


async def process_query(query: str, context: Dict) -> str:
    """Process natural language queries about activities and volunteers (Admin Context)"""
    prompt = f"""You are a data assistant for MINDS activity hub staff.

Available data context:
{context}

User question: {query}

Provide a concise, helpful answer based on the data context. If you cannot answer with the given data, say so."""
    
    try:
        if not admin_client: return "AI Client not configured"
        response = admin_client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        return f"Sorry, I couldn't process that query: {str(e)}"


async def generate_form(topic: str) -> Dict:
    """Generate a registration form structure based on a topic/description"""
    prompt = f"""You are an expert form designer for MINDS.
    Create a registration form for: "{topic}"
    
    Return ONLY a JSON object with this structure:
    {{
        "title": "Form Title",
        "description": "Brief description",
        "fields": [
            {{
                "label": "Full Name",
                "type": "text", 
                "required": true,
                "options": [] // Only for select/radio
            }}
        ]
    }}
    
    Include standard fields (Name, Contact) plus specific ones for the topic (e.g. Dietary, Medical, Wheelchair access).
    JSON:"""
    
    try:
        if not admin_client: return {"error": "AI not configured"}
        response = admin_client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )
        data = json.loads(response.text.strip())
        if "fields" not in data or not isinstance(data["fields"], list):
            data["fields"] = []
        return data
    except Exception as e:
        return {
            "title": f"Registration: {topic}",
            "description": "Please fill out this form.",
            "fields": [
                {"label": "Full Name", "type": "text", "required": True},
                {"label": "Contact Number", "type": "tel", "required": True}
            ]
        }


async def generate_field(prompt: str) -> Dict:
    """Generate a single form field structure based on a user prompt"""
    system_instruction = """You are an expert form designer for MINDS.
    Generate a SINGLE form field JSON object based on the user's requirement.
    The response MUST be a valid JSON object with the following structure:
    {
        "label": "Question Label",
        "type": "text" | "textarea" | "select" | "checkbox" | "date" | "tel",
        "required": true | false,
        "options": ["Option 1", "Option 2"] // ONLY for select and checkbox types, otherwise empty array
    }
    """
    
    try:
        if not admin_client: return {"error": "AI not configured"}
        response = admin_client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt,
            config={
                "system_instruction": system_instruction,
                "response_mime_type": "application/json"
            }
        )
        data = json.loads(response.text.strip())
        return data
    except Exception as e:
        return {"error": f"Failed to generate field: {str(e)}"}

# Admin Tool Definitions (for chat_with_tools)
ADMIN_TOOLS = [
    {
        "function_declarations": [
            {
                "name": "get_volunteer_shortages",
                "description": "Find activities that need volunteers.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "days_ahead": {"type": "INTEGER", "description": "Number of days (default 7)"}
                    },
                    "required": ["days_ahead"]
                }
            },
            {
                "name": "summarize_feedback_tool",
                "description": "Summarize feedback.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "topic": {"type": "STRING", "description": "Topic to summarize"}
                    }
                }
            }
        ]
    }
]

async def chat_with_tools(message: str, history: List[Dict] = None) -> Dict:
    """Send a message to Gemini with Admin tool definitions."""
    system_instruction = """You are the AI Ops Copilot for MINDS activity hub.
You help staff with:
1. Finding volunteer shortages (Smart Matching)
2. Summarizing feedback
3. General data queries

Use the available tools when receiving specific requests.
"""
    try:
        if not admin_client: return None
        response = admin_client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=[message],
            tools=ADMIN_TOOLS,
            config={"system_instruction": system_instruction}
        )
        return response
    except Exception as e:
        print(f"Gemini Error: {e}")
        return None


# --- User Agent Functions (formerly agent.py) ---

# Tool definitions for Gemini function calling (User Side)
AGENT_TOOLS = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="search_activities",
                description="Search for available activities by date, time of day, or keyword.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "query": types.Schema(type=types.Type.STRING, description="Optional keyword"),
                        "date": types.Schema(type=types.Type.STRING, description="Date (YYYY-MM-DD)"),
                        "time_slot": types.Schema(type=types.Type.STRING, description="'morning', 'afternoon', or 'evening'")
                    }
                )
            ),
            types.FunctionDeclaration(
                name="check_tier_limit",
                description="Check if the current user can make another booking this week.",
                parameters=types.Schema(type=types.Type.OBJECT, properties={})
            ),
            types.FunctionDeclaration(
                name="book_activity",
                description="Book an activity for the user.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "activity_id": types.Schema(type=types.Type.STRING, description="Activity ID to book")
                    },
                    required=["activity_id"]
                )
            ),
            types.FunctionDeclaration(
                name="get_user_bookings",
                description="Get the user's current bookings.",
                parameters=types.Schema(type=types.Type.OBJECT, properties={})
            )
        ]
    )
]

async def search_activities(db: AsyncSession, query: str = None, date: str = None, time_slot: str = None) -> List[dict]:
    """Search for activities based on criteria."""
    from ..models.activity import ActivityDB
    
    stmt = select(ActivityDB).where(ActivityDB.start_time >= datetime.utcnow())
    
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d")
            next_day = target_date + timedelta(days=1)
            stmt = stmt.where(ActivityDB.start_time >= target_date, ActivityDB.start_time < next_day)
        except ValueError:
            pass
    
    result = await db.execute(stmt.limit(10))
    activities = result.scalars().all()
    
    if time_slot and activities:
        filtered = []
        for act in activities:
            if act.start_time:
                hour = act.start_time.hour
                if time_slot == "morning" and hour < 12:
                    filtered.append(act)
                elif time_slot == "afternoon" and 12 <= hour < 17:
                    filtered.append(act)
                elif time_slot == "evening" and hour >= 17:
                    filtered.append(act)
        activities = filtered
    
    if query and activities:
        query_lower = query.lower()
        activities = [a for a in activities if 
                      query_lower in (a.title or "").lower() or 
                      query_lower in (a.description or "").lower()]
    
    return [
        {
            "id": str(act.id),
            "title": act.title,
            "description": act.description,
            "start_time": act.start_time.strftime("%Y-%m-%d %H:%M") if act.start_time else None,
            "end_time": act.end_time.strftime("%Y-%m-%d %H:%M") if act.end_time else None,
            "location": act.location or "TBD"
        }
        for act in activities
    ]


async def check_tier_limit(db: AsyncSession, user_id: str, user_tier: str) -> dict:
    """Check if user can book based on their tier limits."""
    tier_limits = {
        "ad-hoc": 2,
        "weekly": 3,
        "once-a-week": 1,
        "twice-a-week": 2,
        "three-plus-a-week": None
    }
    limit = tier_limits.get(user_tier)
    if limit is None:
        return {"can_book": True, "message": "You have unlimited bookings!", "current": 0, "limit": "unlimited"}
    
    # Needs actual logic in production
    current_count = 0
    remaining = limit - current_count
    
    return {
        "can_book": True,
        "current": current_count,
        "limit": limit,
        "remaining": remaining,
        "message": f"You have {remaining} booking(s) remaining this week."
    }


async def book_activity(db: AsyncSession, user_id: str, user_tier: str, activity_id: str) -> dict:
    """Book an activity for the user."""
    from ..models.activity import ActivityDB
    from ..models.booking import BookingDB
    # Assuming calendar logic will be imported or mocked if not present in services.ai
    # For now, simplify or mock calendar link if function is missing in this file context
    import urllib.parse
    
    try:
        uuid_id = UUID(activity_id)
    except ValueError:
        return {"success": False, "message": "Invalid activity ID"}
    
    result = await db.execute(select(ActivityDB).where(ActivityDB.id == uuid_id))
    activity = result.scalar_one_or_none()
    
    if not activity:
        return {"success": False, "message": "Activity not found"}
    
    new_booking = BookingDB(
        user_id=UUID(user_id),
        activity_id=uuid_id,
        status="confirmed",
        booked_at=datetime.utcnow()
    )
    
    db.add(new_booking)
    await db.commit()
    
    # Simple calendar link gen inline
    text = urllib.parse.quote(activity.title or "Activity")
    details = urllib.parse.quote(activity.description or "")
    location = urllib.parse.quote(activity.location or "")
    dates = ""
    if activity.start_time:
        start = activity.start_time.strftime("%Y%m%dT%H%M%S")
        end = (activity.end_time or (activity.start_time + timedelta(hours=1))).strftime("%Y%m%dT%H%M%S")
        dates = f"&dates={start}/{end}"
        
    calendar_link = f"https://www.google.com/calendar/render?action=TEMPLATE&text={text}&details={details}&location={location}{dates}"
    
    return {
        "success": True,
        "message": f"Successfully booked '{activity.title}'!",
        "activity": activity.title,
        "date": activity.start_time.strftime("%Y-%m-%d %H:%M") if activity.start_time else "TBD",
        "calendar_link": calendar_link
    }


async def get_user_bookings(db: AsyncSession, user_id: str) -> List[dict]:
    """Get user's current bookings."""
    from ..models.booking import BookingDB
    from ..models.activity import ActivityDB
    
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        return []
    
    result = await db.execute(
        select(BookingDB).where(BookingDB.user_id == user_uuid, BookingDB.status == "confirmed").limit(10)
    )
    bookings = result.scalars().all()
    
    booking_list = []
    for booking in bookings:
        act_result = await db.execute(select(ActivityDB).where(ActivityDB.id == booking.activity_id))
        activity = act_result.scalar_one_or_none()
        booking_list.append({
            "booking_id": str(booking.id),
            "activity_title": activity.title if activity else "Unknown",
            "date": activity.start_time.strftime("%Y-%m-%d %H:%M") if activity and activity.start_time else "Unknown",
            "location": activity.location if activity else "TBD",
            "status": booking.status
        })
    return booking_list


async def execute_tool(tool_name: str, args: dict, db: AsyncSession, user_id: str, user_tier: str) -> Any:
    """Execute a tool by name with given arguments (User Agent)."""
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


async def analyze_responses(responses: List[Dict], activity_context: Dict) -> Dict:
    """
    Perform Exploratory Data Analysis (EDA) on form responses.
    Generates a structured JSON for the frontend to render dynamic charts.
    Does NOT provide advice, only explains the current situation.
    """
    if not responses:
        return {
            "summary": "No responses available for analysis.",
            "charts": [],
            "key_findings": []
        }

    # Prepare data for Gemini
    cleaned_responses = []
    for r in responses:
        cleaned_responses.append(r.get("responses", {}))

    prompt = f"""You are a Data Analyst Agent (A2A) specialized in Exploratory Data Analysis (EDA).
    
    CONTEXT:
    Event: {activity_context.get('title')}
    Description: {activity_context.get('description')}
    
    DATA:
    {json.dumps(cleaned_responses, indent=2)}
    
    OBJECTIVE:
    Analyze the form responses to identify trends, distributions, and key metrics.
    
    REQUIREMENTS:
    1. Select the most appropriate chart types (bar, pie, area) based on the data.
    2. Provide a detailed situational explanation of the data.
    3. STRICT RULE: DO NOT provide advice, recommendations, or instructions on what to do next. Only explain what the data currently shows.
    4. Return ONLY a JSON object.
    
    JSON STRUCTURE:
    {{
        "summary": "A detailed 2-3 sentence overview of the current response landscape.",
        "charts": [
            {{
                "id": "unique-id",
                "title": "Chart Title",
                "type": "bar" | "pie" | "area",
                "data": [
                    {{"name": "Category A", "value": 10}},
                    {{"name": "Category B", "value": 20}}
                ],
                "explanation": "What this specific chart reveals about the respondents."
            }}
        ],
        "key_findings": [
            "Specific significant finding 1",
            "Specific significant finding 2"
        ]
    }}
    
    JSON:"""
    
    try:
        if not admin_client: return {"error": "AI not configured"}
        response = admin_client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )
        
        analysis = json.loads(response.text.strip())
        return analysis
    except Exception as e:
        print(f"EDA Error: {e}")
        return {
            "summary": "Analytic generation failed.",
            "charts": [],
            "key_findings": [str(e)]
        }

from typing import List, Dict, Optional
from datetime import datetime
import os
from google import genai
from ..models.activity import ActivityBase
from ..models.user import UserResponse

# Initialize Gemini client
client = genai.Client(api_key=os.getenv("GOOGLE_GENERATIVE_AI_API_KEY", ""))

async def summarize_feedback(feedback_list: List[str]) -> str:
    """
    Summarize a list of feedback entries into a concise one-sentence summary
    """
    if not feedback_list:
        return "No feedback available to summarize."
    
    if len(feedback_list) == 1:
        return feedback_list[0]
    
    # Combine feedback entries
    combined_feedback = "\n".join([f"- {fb}" for fb in feedback_list])
    
    prompt = f"""You are analyzing feedback from caregivers and participants at a MINDS activity hub.
Please summarize the following feedback entries into ONE concise sentence highlighting the main themes or concerns:

{combined_feedback}

Summary (one sentence):"""
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        return f"Error generating summary: {str(e)}"


async def match_volunteers(
    activity_dict: Dict,
    volunteers: List[Dict]
) -> List[Dict]:
    """
    Analyze activity requirements and rank volunteers by suitability
    Returns a list of volunteer matches with confidence scores
    """
    if not volunteers:
        return []
    
    activity_title = activity_dict.get("title", "")
    skills_required = activity_dict.get("skills_required", [])
    start_time = activity_dict.get("start_time", datetime.utcnow())
    
    # Build volunteer profiles
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
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt
        )
        
        # Try to parse JSON from response
        import json
        response_text = response.text.strip()
        
        # Clean up response (remove markdown code blocks if present)
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
            
            score = 50  # Base score
            if matching_skills:
                score = min(100, 60 + len(matching_skills) * 20)
            
            results.append({
                "name": vol.get("name"),
                "score": score,
                "reason": f"Matches {len(matching_skills)} required skill(s)" if matching_skills else "General volunteer"
            })
        
        return sorted(results, key=lambda x: x["score"], reverse=True)


async def process_query(query: str, context: Dict) -> str:
    """
    Process natural language queries about activities and volunteers
    """
    prompt = f"""You are a data assistant for MINDS activity hub staff.

Available data context:
{context}

User question: {query}

Provide a concise, helpful answer based on the data context. If you cannot answer with the given data, say so."""
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        return f"Sorry, I couldn't process that query: {str(e)}"

# Tool definitions
tools = [
    {
        "function_declarations": [
            {
                "name": "get_volunteer_shortages",
                "description": "Find activities that need volunteers and are approaching soon.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "days_ahead": {
                            "type": "INTEGER",
                            "description": "Number of days to look ahead (default 7)"
                        }
                    },
                    "required": ["days_ahead"]
                }
            },
            {
                "name": "summarize_feedback_tool",
                "description": "Summarize feedback from caregivers or for specific activities.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "topic": {
                            "type": "STRING",
                            "description": "Specific topic or activity to summarize feedback for"
                        }
                    }
                }
            }
        ]
    }
]

async def chat_with_tools(message: str, history: List[Dict] = None) -> Dict:
    """
    Send a message to Gemini with tool definitions.
    Returns the response object which may contain function calls.
    """
    if history is None:
        history = []
        
    # Convert simple history format if needed, or just append current message
    # For now, we'll just send the current message with system context
    
    system_instruction = """You are the AI Ops Copilot for MINDS activity hub.
You help staff with:
1. Finding volunteer shortages (Smart Matching)
2. Summarizing feedback
3. General data queries

Use the available tools when receiving specific requests.
If the user asks a general question, answer it directly.
"""

    contents = [message]
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=contents,
            tools=tools,
            config={"system_instruction": system_instruction}
        )
        return response
    except Exception as e:
        print(f"Gemini Error: {e}")
        return None

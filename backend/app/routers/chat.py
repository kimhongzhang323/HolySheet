"""
MINDS Buddy Chat Router - SQLAlchemy version
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import json
from google import genai
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..db import get_database
from ..dependencies import get_current_user_optional
from ..models.user import UserResponse
from ..services.ai import AGENT_TOOLS, execute_tool

settings = get_settings()
router = APIRouter()

# Configure GenAI Client
client = None
if settings.GOOGLE_GENERATIVE_AI_API_KEY:
    client = genai.Client(api_key=settings.GOOGLE_GENERATIVE_AI_API_KEY)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


SYSTEM_INSTRUCTION = """You are MINDS Buddy, a friendly AI assistant for the MINDS Activity Hub. You help caregivers and participants find activities, check their booking limits, and make bookings.

**YOUR CAPABILITIES:**
1. **Search Activities**: Find activities by date, time of day, or keyword
2. **Check Tier Limits**: Tell users if they can still book this week
3. **Book Activities**: Book activities directly for users
4. **View Bookings**: Show users their current bookings

**GUIDELINES:**
1. Be warm, patient, and helpful
2. When users ask about activities, use the search_activities tool
3. Before booking, always check their tier limit first
4. Keep responses concise and use simple language
"""


@router.post("/chat")
async def chat_with_agent(
    request: ChatRequest,
    current_user: Optional[UserResponse] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_database)
):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    try:
        contents = []
        for msg in request.messages:
            role = "model" if msg.role == "assistant" else "user"
            contents.append(
                types.Content(role=role, parts=[types.Part(text=msg.content)])
            )

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=contents,
            config=types.GenerateContentConfig(
                tools=AGENT_TOOLS,
                system_instruction=SYSTEM_INSTRUCTION
            )
        )

        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'function_call') and part.function_call:
                    fc = part.function_call
                    tool_name = fc.name
                    tool_args = dict(fc.args) if fc.args else {}
                    
                    user_id = str(current_user.id) if current_user else "guest"
                    user_tier = current_user.tier if current_user else "ad-hoc"
                    result = await execute_tool(tool_name, tool_args, db, user_id, user_tier)
                    
                    result_json = json.dumps(result, indent=2, default=str)
                    
                    summary_contents = contents + [
                        types.Content(
                            role="user",
                            parts=[types.Part(text=f"Based on {tool_name}:\n{result_json}\n\nProvide a helpful response.")]
                        )
                    ]
                    
                    summary_response = client.models.generate_content(
                        model="gemini-3-flash-preview",
                        contents=summary_contents,
                        config=types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION)
                    )
                    
                    return {
                        "response": summary_response.text or "Found some information!",
                        "tool_used": tool_name,
                        "tool_result": result
                    }

        return {"response": response.text if response.text else "I couldn't process that request."}

    except Exception as e:
        print(f"Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/public")
async def chat_public(request: ChatRequest):
    """Public chat endpoint without authentication"""
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    try:
        contents = []
        for msg in request.messages:
            role = "model" if msg.role == "assistant" else "user"
            contents.append(types.Content(role=role, parts=[types.Part(text=msg.content)]))

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction="You are MINDS Buddy. Answer general questions. For booking, ask users to log in."
            )
        )

        return {"response": response.text if response.text else "Please log in for booking features."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

"""
MINDS Buddy Chat Router

Implements an AI agent with Gemini function calling capabilities.
Uses a simplified approach for reliability with Gemini 3.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Any
import json
from google import genai
from google.genai import types
from ..config import get_settings
from ..db import get_database
from ..dependencies import get_current_user
from ..models.user import UserResponse
from ..services.agent import AGENT_TOOLS, execute_tool

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
1. Be warm, patient, and helpful - many users may not be tech-savvy
2. When users ask about activities, use the search_activities tool
3. Before booking, always check their tier limit first
4. After a successful booking, share the calendar link
5. Keep responses concise and use simple language
6. If you're unsure, ask clarifying questions

**IMPORTANT:**
- Always use the tools provided to get real data - don't make up activity details
- When showing activities, include the ID so users can book them
- Format dates and times in a friendly way (e.g., "Tuesday at 2pm")
"""

@router.post("/chat")
async def chat_with_agent(
    request: ChatRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    try:
        # Build conversation contents
        contents = []
        
        for msg in request.messages:
            role = "model" if msg.role == "assistant" else "user"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part(text=msg.content)]
                )
            )

        # First call - check if we need to use a tool
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=contents,
            config=types.GenerateContentConfig(
                tools=AGENT_TOOLS,
                system_instruction=SYSTEM_INSTRUCTION
            )
        )

        # Check for function calls
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'function_call') and part.function_call:
                    fc = part.function_call
                    tool_name = fc.name
                    tool_args = dict(fc.args) if fc.args else {}
                    
                    # Execute the tool
                    result = await execute_tool(
                        tool_name, 
                        tool_args, 
                        db, 
                        str(current_user.id), 
                        current_user.tier.value if current_user.tier else "ad-hoc"
                    )
                    
                    # Format result nicely
                    result_json = json.dumps(result, indent=2, default=str)
                    
                    # Create a new call to summarize the result naturally
                    summary_contents = contents + [
                        types.Content(
                            role="user",
                            parts=[types.Part(text=f"Based on calling {tool_name}, here is the data:\n```json\n{result_json}\n```\n\nPlease provide a helpful, natural response to the user based on this data.")]
                        )
                    ]
                    
                    summary_response = client.models.generate_content(
                        model="gemini-3-flash-preview",
                        contents=summary_contents,
                        config=types.GenerateContentConfig(
                            system_instruction=SYSTEM_INSTRUCTION
                        )
                    )
                    
                    return {
                        "response": summary_response.text or "I found some information for you!",
                        "tool_used": tool_name,
                        "tool_result": result
                    }

        # No function call, return text response
        final_text = response.text if response.text else "I'm sorry, I couldn't process that request. Please try again."
        return {"response": final_text}

    except Exception as e:
        print(f"Agent Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Unauthenticated chat endpoint for basic queries (no booking capabilities)
@router.post("/chat/public")
async def chat_public(request: ChatRequest):
    """Public chat endpoint without authentication - limited functionality."""
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
                system_instruction="""You are MINDS Buddy, a friendly AI assistant for the MINDS Activity Hub. 
                You can answer general questions about activities and the platform.
                For booking or personalized information, ask the user to log in first."""
            )
        )

        return {"response": response.text if response.text else "I'm here to help! Please log in to access booking features."}

    except Exception as e:
        print(f"Public Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

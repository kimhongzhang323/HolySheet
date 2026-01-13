"""
AI Form Generator Service

Uses Gemini AI to analyze activity descriptions and generate
structured form questions in JSON format.
"""

import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from google import genai
from google.genai import types


class FormQuestion(BaseModel):
    """A single form question."""
    field_name: str  # Internal ID, e.g., "wheelchair_access"
    field_type: str  # "boolean", "text", "select", "number", "date"
    label: str  # Display question
    required: bool = False
    options: Optional[List[str]] = None  # For select type
    placeholder: Optional[str] = None  # Hint text
    validation: Optional[Dict[str, Any]] = None  # e.g., {"min": 0, "max": 100}


class GeneratedForm(BaseModel):
    """Complete generated form."""
    activity_id: str
    activity_title: str
    form_title: str
    form_description: str
    questions: List[FormQuestion]
    generated_at: datetime
    ai_confidence: float  # 0-1 confidence score


FORM_GENERATION_PROMPT = """You are an AI that generates registration form questions for activities.
Analyze the activity details and generate appropriate form questions in JSON format.

**RULES:**
1. Generate ONLY relevant questions based on the activity description
2. Always include an emergency contact field for safety
3. If activity mentions food/meals, add dietary restrictions
4. If activity mentions transport, add transport needs
5. If activity is physical, add medical/health questions
6. If activity mentions accessibility, add wheelchair/mobility questions
7. Keep questions simple and easy to understand
8. Limit to 3-6 questions maximum

**FIELD TYPES:**
- "boolean": Yes/No checkbox
- "text": Short text input
- "textarea": Long text input
- "select": Dropdown with options
- "number": Numeric input
- "date": Date picker

**RESPOND WITH ONLY VALID JSON** in this exact format:
{
    "form_title": "Registration Form",
    "form_description": "Please answer the following questions",
    "confidence": 0.9,
    "questions": [
        {
            "field_name": "example_field",
            "field_type": "text",
            "label": "What is your question?",
            "required": true,
            "placeholder": "Enter your answer",
            "options": null,
            "validation": null
        }
    ]
}
"""


async def generate_form_questions(
    client: genai.Client,
    activity: dict,
    custom_context: str = None,
    db = None  # Optional database for RAG
) -> GeneratedForm:
    """
    Use AI to generate form questions based on activity details.
    If database is provided, uses RAG to find similar past events.
    
    Args:
        client: Gemini client
        activity: Activity document from database
        custom_context: Optional additional context for form generation
        db: Optional database connection for RAG queries
    
    Returns:
        GeneratedForm with questions
    """
    # RAG: Get suggestions from similar past events
    rag_context = ""
    if db:
        try:
            from .memory import get_suggested_fields_from_memory, search_memories
            
            title = activity.get('title', '')
            description = activity.get('description', '')
            
            # Search for similar memories
            memories = await search_memories(db, f"{title} {description}", limit=3)
            
            if memories:
                rag_context = "\n\n**SIMILAR PAST EVENTS (use these as reference):**\n"
                for i, mem_result in enumerate(memories, 1):
                    mem = mem_result.memory
                    rag_context += f"\n{i}. {mem.event_title} (similarity: {mem_result.similarity_score:.2f})\n"
                    rag_context += f"   Fields used: {', '.join([f.field_name for f in mem.form_fields])}\n"
        except Exception as e:
            print(f"RAG lookup failed: {e}")
            rag_context = ""
    
    activity_description = f"""
Activity Title: {activity.get('title', 'Unknown')}
Description: {activity.get('description', 'No description')}
Location: {activity.get('location', 'TBD')}
Date/Time: {activity.get('start_time', 'TBD')} to {activity.get('end_time', 'TBD')}
Capacity: {activity.get('capacity', 'Unknown')}
Organiser: {activity.get('organiser', 'Unknown')}

{"Additional Context: " + custom_context if custom_context else ""}
{rag_context}
"""

    prompt = f"""{FORM_GENERATION_PROMPT}

**ACTIVITY TO ANALYZE:**
{activity_description}

Generate the registration form JSON now:"""

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[types.Content(role="user", parts=[types.Part(text=prompt)])],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        # Parse the JSON response
        response_text = response.text.strip()
        
        # Clean up if wrapped in markdown code blocks
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        
        form_data = json.loads(response_text)
        
        # Build FormQuestion objects
        questions = []
        for q in form_data.get("questions", []):
            questions.append(FormQuestion(
                field_name=q.get("field_name", "unknown"),
                field_type=q.get("field_type", "text"),
                label=q.get("label", ""),
                required=q.get("required", False),
                options=q.get("options"),
                placeholder=q.get("placeholder"),
                validation=q.get("validation")
            ))
        
        return GeneratedForm(
            activity_id=str(activity.get("_id", "")),
            activity_title=activity.get("title", "Unknown"),
            form_title=form_data.get("form_title", "Registration Form"),
            form_description=form_data.get("form_description", "Please complete this form"),
            questions=questions,
            generated_at=datetime.utcnow(),
            ai_confidence=form_data.get("confidence", 0.8)
        )
        
    except json.JSONDecodeError as e:
        # Fallback to basic form if parsing fails
        return GeneratedForm(
            activity_id=str(activity.get("_id", "")),
            activity_title=activity.get("title", "Unknown"),
            form_title="Registration Form",
            form_description="Please complete the following questions",
            questions=[
                FormQuestion(
                    field_name="emergency_contact",
                    field_type="text",
                    label="Emergency contact name and phone number",
                    required=True,
                    placeholder="e.g., John Doe - 91234567"
                ),
                FormQuestion(
                    field_name="special_needs",
                    field_type="textarea",
                    label="Any special needs or requirements we should know about?",
                    required=False,
                    placeholder="Enter any relevant information"
                )
            ],
            generated_at=datetime.utcnow(),
            ai_confidence=0.5
        )


def parse_form_responses(
    questions: List[FormQuestion],
    user_responses: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Validate and parse user form responses against the form questions.
    
    Args:
        questions: List of form questions
        user_responses: Dict of field_name -> value
    
    Returns:
        Validated and cleaned responses dict
    """
    parsed = {}
    errors = []
    
    for question in questions:
        field_name = question.field_name
        value = user_responses.get(field_name)
        
        # Check required fields
        if question.required and (value is None or value == ""):
            errors.append(f"'{question.label}' is required")
            continue
        
        if value is None:
            continue
        
        # Type validation
        if question.field_type == "boolean":
            parsed[field_name] = bool(value)
        
        elif question.field_type == "number":
            try:
                parsed[field_name] = float(value)
                # Apply validation if present
                if question.validation:
                    if "min" in question.validation and parsed[field_name] < question.validation["min"]:
                        errors.append(f"'{question.label}' must be at least {question.validation['min']}")
                    if "max" in question.validation and parsed[field_name] > question.validation["max"]:
                        errors.append(f"'{question.label}' must be at most {question.validation['max']}")
            except (ValueError, TypeError):
                errors.append(f"'{question.label}' must be a number")
        
        elif question.field_type == "select":
            if question.options and value not in question.options:
                errors.append(f"'{question.label}' must be one of: {', '.join(question.options)}")
            else:
                parsed[field_name] = value
        
        elif question.field_type == "date":
            try:
                if isinstance(value, str):
                    parsed[field_name] = datetime.strptime(value, "%Y-%m-%d").isoformat()
                else:
                    parsed[field_name] = value
            except ValueError:
                errors.append(f"'{question.label}' must be a valid date (YYYY-MM-DD)")
        
        else:  # text, textarea
            parsed[field_name] = str(value).strip()
    
    return {
        "valid": len(errors) == 0,
        "data": parsed,
        "errors": errors
    }


async def save_form_to_activity(db, activity_id: str, generated_form: GeneratedForm) -> bool:
    """
    Save the generated form questions to the activity in the database.
    """
    if not ObjectId.is_valid(activity_id):
        return False
    
    # Convert questions to dict format for MongoDB
    questions_data = [q.model_dump() for q in generated_form.questions]
    
    result = await db.activities.update_one(
        {"_id": ObjectId(activity_id)},
        {"$set": {
            "custom_form_fields": questions_data,
            "form_generated_at": generated_form.generated_at,
            "form_ai_confidence": generated_form.ai_confidence
        }}
    )
    
    return result.modified_count > 0

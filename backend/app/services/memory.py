"""
AI Memory Service

Provides RAG (Retrieval Augmented Generation) capabilities for form generation.
Queries past event memories to find similar events and suggest form fields.
"""

import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
from ..models.memory import (
    EventMemory, 
    EventMemoryInDB, 
    EventMemoryCreate,
    FormFieldMemory,
    EventCategory,
    MemorySearchResult
)


# Common keywords for each category
CATEGORY_KEYWORDS = {
    EventCategory.ARTS_CRAFTS: ["art", "craft", "painting", "drawing", "pottery", "creative", "handmade", "diy"],
    EventCategory.MUSIC: ["music", "singing", "song", "choir", "instrument", "piano", "guitar", "karaoke"],
    EventCategory.SPORTS: ["sport", "exercise", "fitness", "yoga", "walking", "swimming", "basketball", "badminton"],
    EventCategory.COOKING: ["cooking", "baking", "food", "meal", "recipe", "kitchen", "culinary", "chef"],
    EventCategory.WELLNESS: ["wellness", "meditation", "mindfulness", "relaxation", "therapy", "health", "massage"],
    EventCategory.SOCIAL: ["social", "gathering", "party", "celebration", "meet", "friend", "community", "chat"],
    EventCategory.OUTDOOR: ["outdoor", "nature", "garden", "park", "excursion", "trip", "outing", "picnic"],
    EventCategory.EDUCATIONAL: ["learn", "education", "class", "workshop", "skill", "training", "course", "lesson"],
    EventCategory.THERAPY: ["therapy", "therapeutic", "sensory", "cognitive", "rehabilitation", "support", "counseling"],
}


def extract_keywords(text: str) -> List[str]:
    """Extract relevant keywords from text."""
    text_lower = text.lower()
    words = re.findall(r'\b[a-z]+\b', text_lower)
    
    # Filter to meaningful words (length > 3, not common words)
    stop_words = {"the", "and", "for", "are", "but", "not", "you", "all", "can", "her", "was", "one", "our", "out", "with", "this", "that", "from", "will", "have", "been", "more", "when", "some"}
    keywords = [w for w in words if len(w) > 3 and w not in stop_words]
    
    return list(set(keywords))[:20]  # Max 20 keywords


def detect_category(text: str) -> EventCategory:
    """Detect event category from text."""
    text_lower = text.lower()
    
    max_matches = 0
    best_category = EventCategory.OTHER
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in text_lower)
        if matches > max_matches:
            max_matches = matches
            best_category = category
    
    return best_category


def calculate_similarity(query_keywords: List[str], memory_keywords: List[str]) -> tuple[float, List[str]]:
    """
    Calculate similarity score between query and memory keywords.
    Returns (score, matched_keywords).
    """
    if not query_keywords or not memory_keywords:
        return 0.0, []
    
    query_set = set(query_keywords)
    memory_set = set(memory_keywords)
    
    matched = query_set.intersection(memory_set)
    
    # Jaccard similarity
    if not query_set.union(memory_set):
        return 0.0, []
    
    score = len(matched) / len(query_set.union(memory_set))
    return score, list(matched)


async def search_memories(
    db,
    query_text: str,
    category: EventCategory = None,
    limit: int = 5,
    min_similarity: float = 0.1
) -> List[MemorySearchResult]:
    """
    Search event memories for similar past events.
    
    Args:
        db: Database connection
        query_text: Text to match against (title + description)
        category: Optional category filter
        limit: Max results to return
        min_similarity: Minimum similarity score (0-1)
    
    Returns:
        List of MemorySearchResult sorted by similarity
    """
    query_keywords = extract_keywords(query_text)
    detected_category = category or detect_category(query_text)
    
    # Build MongoDB query
    mongo_query = {}
    if category:
        mongo_query["category"] = category.value
    
    # Get memories from database
    cursor = db.event_memories.find(mongo_query).limit(100)
    memories = await cursor.to_list(length=100)
    
    # Calculate similarity scores
    results = []
    for mem in memories:
        memory_keywords = mem.get("keywords", [])
        score, matched = calculate_similarity(query_keywords, memory_keywords)
        
        # Boost score if category matches
        if mem.get("category") == detected_category.value:
            score += 0.2
        
        # Boost based on usage and success
        score *= (1 + mem.get("usage_count", 1) * 0.01)
        score *= mem.get("success_rate", 1.0)
        
        if score >= min_similarity:
            results.append(MemorySearchResult(
                memory=EventMemoryInDB(**mem),
                similarity_score=min(score, 1.0),
                matched_keywords=matched
            ))
    
    # Sort by similarity score descending
    results.sort(key=lambda x: x.similarity_score, reverse=True)
    
    return results[:limit]


async def get_suggested_fields_from_memory(
    db,
    activity_title: str,
    activity_description: str
) -> List[FormFieldMemory]:
    """
    Get suggested form fields based on similar past events.
    Aggregates fields from similar memories.
    """
    query_text = f"{activity_title} {activity_description}"
    
    memories = await search_memories(db, query_text, limit=5)
    
    if not memories:
        return []
    
    # Aggregate fields from all memories, tracking frequency
    field_counts: Dict[str, FormFieldMemory] = {}
    
    for result in memories:
        for field in result.memory.form_fields:
            key = field.field_name
            if key in field_counts:
                field_counts[key].usage_count += 1
            else:
                field_counts[key] = FormFieldMemory(
                    field_name=field.field_name,
                    field_type=field.field_type,
                    label=field.label,
                    required=field.required,
                    options=field.options,
                    usage_count=1
                )
    
    # Sort by usage count and return top fields
    sorted_fields = sorted(field_counts.values(), key=lambda x: x.usage_count, reverse=True)
    return sorted_fields[:6]  # Max 6 suggested fields


async def store_memory(
    db,
    activity: dict,
    form_fields: List[dict],
    success: bool = True
) -> str:
    """
    Store a new event memory or update existing one.
    Called after a successful booking with form data.
    """
    title = activity.get("title", "")
    description = activity.get("description", "")
    
    keywords = extract_keywords(f"{title} {description}")
    category = detect_category(f"{title} {description}")
    
    # Check for existing memory
    existing = await db.event_memories.find_one({
        "source_activity_id": str(activity.get("_id", ""))
    })
    
    if existing:
        # Update existing memory
        await db.event_memories.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {"last_used": datetime.utcnow()},
                "$inc": {"usage_count": 1}
            }
        )
        return str(existing["_id"])
    
    # Create new memory
    memory = EventMemory(
        event_title=title,
        event_description=description,
        category=category,
        keywords=keywords,
        form_fields=[FormFieldMemory(**f) if isinstance(f, dict) else f for f in form_fields],
        source_activity_id=str(activity.get("_id", "")),
        created_at=datetime.utcnow(),
        last_used=datetime.utcnow(),
        usage_count=1,
        success_rate=1.0 if success else 0.0,
        location_type=activity.get("location_type"),
        target_audience=activity.get("target_audience"),
        accessibility_flags=[]
    )
    
    # Check for accessibility keywords
    text = f"{title} {description}".lower()
    if "wheelchair" in text:
        memory.accessibility_flags.append("wheelchair")
    if "hearing" in text:
        memory.accessibility_flags.append("hearing_aid")
    if "visual" in text or "blind" in text:
        memory.accessibility_flags.append("visual_impairment")
    
    result = await db.event_memories.insert_one(memory.model_dump(exclude={"id"}))
    return str(result.inserted_id)


async def get_memory_stats(db) -> dict:
    """Get statistics about the memory store."""
    total = await db.event_memories.count_documents({})
    
    # Category breakdown
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    cursor = db.event_memories.aggregate(pipeline)
    categories = await cursor.to_list(length=20)
    
    return {
        "total_memories": total,
        "by_category": {c["_id"]: c["count"] for c in categories}
    }

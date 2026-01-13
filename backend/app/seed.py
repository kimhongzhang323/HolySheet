"""
Database Seeder Script

Populates all MongoDB collections with sample data for testing.
Run with: python -m app.seed
"""

import asyncio
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from .config import get_settings

settings = get_settings()


# ==================== SAMPLE DATA ====================

SAMPLE_USERS = [
    {
        "name": "Admin User",
        "email": "admin@minds.org.sg",
        "password": "admin123",
        "role": "admin",
        "tier": "three-plus-a-week",
        "phoneNumber": "+6590001111",
        "isVerified": True,
        "skills": ["management", "coordination"],
        "address": {"street": "1 Minds Street", "unit": "#01-01", "postalCode": "123456", "city": "Singapore", "country": "Singapore"}
    },
    {
        "name": "Sarah Lim",
        "email": "sarah.staff@minds.org.sg",
        "password": "staff123",
        "role": "staff",
        "tier": "three-plus-a-week",
        "phoneNumber": "+6590002222",
        "isVerified": True,
        "skills": ["event planning", "art therapy"],
        "address": {"street": "2 Staff Road", "unit": "#02-02", "postalCode": "234567", "city": "Singapore", "country": "Singapore"}
    },
    {
        "name": "John Tan",
        "email": "john.volunteer@gmail.com",
        "password": "volunteer123",
        "role": "volunteer",
        "tier": "ad-hoc",
        "phoneNumber": "+6590003333",
        "isVerified": True,
        "skills": ["music", "singing"],
        "address": {"street": "3 Helper Lane", "unit": "#03-03", "postalCode": "345678", "city": "Singapore", "country": "Singapore"}
    },
    {
        "name": "Mary Wong",
        "email": "mary.participant@gmail.com",
        "password": "user123",
        "role": "user",
        "tier": "twice-a-week",
        "phoneNumber": "+6590004444",
        "isVerified": True,
        "skills": [],
        "address": {"street": "4 Participant Avenue", "unit": "#04-04", "postalCode": "456789", "city": "Singapore", "country": "Singapore"}
    },
    {
        "name": "David Lee",
        "email": "david.user@gmail.com",
        "password": "user123",
        "role": "user",
        "tier": "once-a-week",
        "phoneNumber": "+6590005555",
        "isVerified": True,
        "skills": [],
        "address": {"street": "5 User Street", "postalCode": "567890", "city": "Singapore", "country": "Singapore"}
    },
    {
        "name": "Anna Chen",
        "email": "anna.adhoc@gmail.com",
        "password": "user123",
        "role": "user",
        "tier": "ad-hoc",
        "phoneNumber": "+6590006666",
        "isVerified": True,
        "skills": [],
        "address": {"street": "6 Adhoc Road", "postalCode": "678901", "city": "Singapore", "country": "Singapore"}
    }
]

# Activities spanning the next 2 weeks
def generate_activities():
    base_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    return [
        {
            "title": "Art Therapy - Painting with Watercolors",
            "description": "Join us for a relaxing watercolor painting session. All materials provided. Wheelchair accessible venue with ramps and accessible toilets. Suitable for beginners.",
            "start_time": base_date + timedelta(days=1, hours=10),
            "end_time": base_date + timedelta(days=1, hours=12),
            "location": "MINDS Activity Centre, Level 2 Art Room",
            "capacity": 15,
            "organiser": "Sarah Lim",
            "volunteers_needed": 2,
            "needs_help": True,
            "allowed_tiers": ["once-a-week", "twice-a-week", "three-plus-a-week"],
            "assigned_staff": ["sarah.staff@minds.org.sg"],
            "custom_form_fields": [
                {"field_name": "wheelchair_access", "field_type": "boolean", "label": "Do you require wheelchair accessibility?", "required": False},
                {"field_name": "art_experience", "field_type": "select", "label": "Art experience level", "required": False, "options": ["None", "Beginner", "Intermediate"]},
                {"field_name": "emergency_contact", "field_type": "text", "label": "Emergency contact (name & phone)", "required": True}
            ]
        },
        {
            "title": "Music & Movement Session",
            "description": "Enjoy music therapy with singing, dancing, and instrument play. Great for motor skills and social interaction. Lunch will be provided after the session.",
            "start_time": base_date + timedelta(days=2, hours=14),
            "end_time": base_date + timedelta(days=2, hours=16),
            "location": "MINDS Activity Centre, Multipurpose Hall",
            "capacity": 20,
            "organiser": "John Tan",
            "volunteers_needed": 3,
            "needs_help": True,
            "allowed_tiers": ["twice-a-week", "three-plus-a-week"],
            "assigned_staff": ["sarah.staff@minds.org.sg"],
            "custom_form_fields": [
                {"field_name": "dietary_restrictions", "field_type": "text", "label": "Any dietary restrictions or allergies?", "required": False},
                {"field_name": "caregiver_attending", "field_type": "boolean", "label": "Will a caregiver be attending?", "required": False},
                {"field_name": "emergency_contact", "field_type": "text", "label": "Emergency contact (name & phone)", "required": True}
            ]
        },
        {
            "title": "Cooking Class - Simple Baking",
            "description": "Learn to bake simple cookies and cupcakes. All ingredients provided. Please inform us of any food allergies. Caregiver payment required.",
            "start_time": base_date + timedelta(days=3, hours=10),
            "end_time": base_date + timedelta(days=3, hours=13),
            "location": "MINDS Kitchen, Ground Floor",
            "capacity": 10,
            "organiser": "Sarah Lim",
            "volunteers_needed": 2,
            "needs_help": False,
            "allowed_tiers": ["once-a-week", "twice-a-week", "three-plus-a-week"],
            "assigned_staff": ["sarah.staff@minds.org.sg"],
            "custom_form_fields": [
                {"field_name": "dietary_restrictions", "field_type": "text", "label": "Any food allergies?", "required": True},
                {"field_name": "caregiver_payment", "field_type": "select", "label": "Caregiver payment method", "required": True, "options": ["Cash", "PayNow", "Credit Card"]},
                {"field_name": "apron_size", "field_type": "select", "label": "Apron size", "required": False, "options": ["S", "M", "L", "XL"]}
            ]
        },
        {
            "title": "Outdoor Garden Walk",
            "description": "Enjoy nature with a guided walk through the botanical gardens. Transport provided from MINDS centre. Wear comfortable shoes.",
            "start_time": base_date + timedelta(days=4, hours=9),
            "end_time": base_date + timedelta(days=4, hours=12),
            "location": "Singapore Botanic Gardens",
            "capacity": 12,
            "organiser": "Admin User",
            "volunteers_needed": 4,
            "needs_help": True,
            "allowed_tiers": None,  # Open to all
            "assigned_staff": ["sarah.staff@minds.org.sg", "admin@minds.org.sg"],
            "custom_form_fields": [
                {"field_name": "transport_needs", "field_type": "select", "label": "Transport assistance needed?", "required": True, "options": ["None", "Pick-up only", "Drop-off only", "Both"]},
                {"field_name": "mobility_aids", "field_type": "text", "label": "Any mobility aids (wheelchair, walker)?", "required": False},
                {"field_name": "emergency_contact", "field_type": "text", "label": "Emergency contact (name & phone)", "required": True}
            ]
        },
        {
            "title": "Sensory Therapy Session",
            "description": "Therapeutic sensory activities including tactile play, aromatherapy, and calming exercises. Good for emotional regulation. Medical conditions should be disclosed.",
            "start_time": base_date + timedelta(days=5, hours=14),
            "end_time": base_date + timedelta(days=5, hours=16),
            "location": "MINDS Therapy Room, Level 3",
            "capacity": 8,
            "organiser": "Sarah Lim",
            "volunteers_needed": 1,
            "needs_help": False,
            "allowed_tiers": ["twice-a-week", "three-plus-a-week"],
            "assigned_staff": ["sarah.staff@minds.org.sg"],
            "custom_form_fields": [
                {"field_name": "medical_conditions", "field_type": "textarea", "label": "Any medical conditions we should know about?", "required": True},
                {"field_name": "sensory_sensitivities", "field_type": "text", "label": "Any sensory sensitivities (loud sounds, bright lights)?", "required": False},
                {"field_name": "emergency_contact", "field_type": "text", "label": "Emergency contact (name & phone)", "required": True}
            ]
        },
        {
            "title": "Karaoke Social Night",
            "description": "A fun evening of karaoke and socializing! Light refreshments provided. Bring your favorite songs to sing!",
            "start_time": base_date + timedelta(days=6, hours=18),
            "end_time": base_date + timedelta(days=6, hours=21),
            "location": "MINDS Activity Centre, Multipurpose Hall",
            "capacity": 25,
            "organiser": "John Tan",
            "volunteers_needed": 2,
            "needs_help": True,
            "allowed_tiers": None,
            "assigned_staff": ["sarah.staff@minds.org.sg"],
            "custom_form_fields": [
                {"field_name": "song_requests", "field_type": "text", "label": "Any song requests?", "required": False},
                {"field_name": "dietary_restrictions", "field_type": "text", "label": "Dietary restrictions for refreshments?", "required": False}
            ]
        },
        {
            "title": "Yoga and Stretching Class",
            "description": "Gentle yoga session suitable for all fitness levels. Mats provided. Wheelchair users welcome - modified poses available.",
            "start_time": base_date + timedelta(days=7, hours=10),
            "end_time": base_date + timedelta(days=7, hours=11, minutes=30),
            "location": "MINDS Activity Centre, Wellness Room",
            "capacity": 12,
            "organiser": "Sarah Lim",
            "volunteers_needed": 1,
            "needs_help": False,
            "allowed_tiers": ["once-a-week", "twice-a-week", "three-plus-a-week"],
            "assigned_staff": ["sarah.staff@minds.org.sg"],
            "custom_form_fields": [
                {"field_name": "wheelchair_access", "field_type": "boolean", "label": "Do you use a wheelchair?", "required": False},
                {"field_name": "physical_limitations", "field_type": "textarea", "label": "Any physical limitations or injuries?", "required": False},
                {"field_name": "own_mat", "field_type": "boolean", "label": "Will you bring your own yoga mat?", "required": False}
            ]
        },
        {
            "title": "Computer Skills Workshop",
            "description": "Learn basic computer skills including email, internet browsing, and simple document creation. One-on-one support available.",
            "start_time": base_date + timedelta(days=8, hours=14),
            "end_time": base_date + timedelta(days=8, hours=16),
            "location": "MINDS Computer Lab, Level 2",
            "capacity": 10,
            "organiser": "Admin User",
            "volunteers_needed": 5,
            "needs_help": True,
            "allowed_tiers": None,
            "assigned_staff": ["admin@minds.org.sg"],
            "custom_form_fields": [
                {"field_name": "computer_experience", "field_type": "select", "label": "Computer experience level", "required": True, "options": ["None", "Beginner", "Intermediate"]},
                {"field_name": "learning_goals", "field_type": "textarea", "label": "What would you like to learn?", "required": False}
            ]
        }
    ]


# Event memories for RAG
SAMPLE_MEMORIES = [
    {
        "event_title": "Wheelchair-Friendly Art Class",
        "event_description": "Art therapy session in wheelchair accessible venue with painting and drawing activities.",
        "category": "arts_crafts",
        "keywords": ["art", "painting", "wheelchair", "accessible", "therapy", "drawing", "creative"],
        "form_fields": [
            {"field_name": "wheelchair_access", "field_type": "boolean", "label": "Do you require wheelchair accessibility?", "required": False, "usage_count": 15},
            {"field_name": "caregiver_info", "field_type": "text", "label": "Caregiver name and contact", "required": False, "usage_count": 12},
            {"field_name": "emergency_contact", "field_type": "text", "label": "Emergency contact (name & phone)", "required": True, "usage_count": 25}
        ],
        "accessibility_flags": ["wheelchair"],
        "usage_count": 25,
        "success_rate": 0.95
    },
    {
        "event_title": "Music Therapy with Lunch",
        "event_description": "Music and singing session followed by lunch. Participants enjoy karaoke and instrument play.",
        "category": "music",
        "keywords": ["music", "singing", "lunch", "meal", "karaoke", "therapy", "food"],
        "form_fields": [
            {"field_name": "dietary_restrictions", "field_type": "text", "label": "Any dietary restrictions or allergies?", "required": True, "usage_count": 30},
            {"field_name": "song_preference", "field_type": "text", "label": "Any favorite songs?", "required": False, "usage_count": 18},
            {"field_name": "emergency_contact", "field_type": "text", "label": "Emergency contact", "required": True, "usage_count": 30}
        ],
        "accessibility_flags": [],
        "usage_count": 30,
        "success_rate": 0.92
    },
    {
        "event_title": "Outdoor Excursion with Transport",
        "event_description": "Day trip to the park with transport provided. Walking and nature activities.",
        "category": "outdoor",
        "keywords": ["outdoor", "transport", "excursion", "park", "nature", "walking", "trip"],
        "form_fields": [
            {"field_name": "transport_needs", "field_type": "select", "label": "Transport assistance needed?", "required": True, "options": ["None", "Pick-up", "Drop-off", "Both"], "usage_count": 20},
            {"field_name": "mobility_aids", "field_type": "text", "label": "Mobility aids used?", "required": False, "usage_count": 15},
            {"field_name": "medical_conditions", "field_type": "textarea", "label": "Medical conditions to note", "required": False, "usage_count": 18},
            {"field_name": "emergency_contact", "field_type": "text", "label": "Emergency contact", "required": True, "usage_count": 20}
        ],
        "accessibility_flags": [],
        "usage_count": 20,
        "success_rate": 0.90
    },
    {
        "event_title": "Cooking Class with Payment",
        "event_description": "Baking and cooking workshop. Ingredients provided. Payment required from caregivers.",
        "category": "cooking",
        "keywords": ["cooking", "baking", "food", "payment", "caregiver", "kitchen", "recipe"],
        "form_fields": [
            {"field_name": "dietary_restrictions", "field_type": "text", "label": "Food allergies?", "required": True, "usage_count": 22},
            {"field_name": "caregiver_payment", "field_type": "select", "label": "Payment method", "required": True, "options": ["Cash", "PayNow", "Credit Card"], "usage_count": 22},
            {"field_name": "apron_size", "field_type": "select", "label": "Apron size", "required": False, "options": ["S", "M", "L", "XL"], "usage_count": 15}
        ],
        "accessibility_flags": [],
        "usage_count": 22,
        "success_rate": 0.88
    },
    {
        "event_title": "Sensory Therapy for Medical Needs",
        "event_description": "Therapeutic sensory activities for participants with medical conditions requiring disclosure.",
        "category": "therapy",
        "keywords": ["therapy", "sensory", "medical", "therapeutic", "health", "calming"],
        "form_fields": [
            {"field_name": "medical_conditions", "field_type": "textarea", "label": "Medical conditions", "required": True, "usage_count": 18},
            {"field_name": "medications", "field_type": "text", "label": "Current medications", "required": False, "usage_count": 12},
            {"field_name": "sensory_sensitivities", "field_type": "text", "label": "Sensory sensitivities?", "required": False, "usage_count": 15},
            {"field_name": "emergency_contact", "field_type": "text", "label": "Emergency contact", "required": True, "usage_count": 18}
        ],
        "accessibility_flags": [],
        "usage_count": 18,
        "success_rate": 0.94
    },
    {
        "event_title": "Yoga for Wheelchair Users",
        "event_description": "Gentle yoga and stretching class with modified poses for wheelchair users.",
        "category": "wellness",
        "keywords": ["yoga", "wheelchair", "stretching", "wellness", "exercise", "accessible"],
        "form_fields": [
            {"field_name": "wheelchair_access", "field_type": "boolean", "label": "Do you use a wheelchair?", "required": False, "usage_count": 10},
            {"field_name": "physical_limitations", "field_type": "textarea", "label": "Physical limitations?", "required": False, "usage_count": 10},
            {"field_name": "emergency_contact", "field_type": "text", "label": "Emergency contact", "required": True, "usage_count": 10}
        ],
        "accessibility_flags": ["wheelchair"],
        "usage_count": 10,
        "success_rate": 0.96
    }
]


async def seed_database():
    """Main seeding function."""
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]
    
    print("🌱 Starting database seeding...")
    
    # Clear existing data (optional - comment out to append)
    print("  Clearing existing data...")
    await db.users.delete_many({})
    await db.activities.delete_many({})
    await db.bookings.delete_many({})
    await db.staff_assignments.delete_many({})
    await db.event_memories.delete_many({})
    
    # Seed Users
    print("  Seeding users...")
    user_ids = {}
    for user_data in SAMPLE_USERS:
        password = user_data.pop("password")
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user_data["password"] = hashed.decode('utf-8')
        user_data["emailVerified"] = datetime.utcnow()
        result = await db.users.insert_one(user_data)
        user_ids[user_data["email"]] = str(result.inserted_id)
    print(f"    ✓ Created {len(SAMPLE_USERS)} users")
    
    # Seed Activities
    print("  Seeding activities...")
    activities = generate_activities()
    activity_ids = []
    for activity in activities:
        result = await db.activities.insert_one(activity)
        activity_ids.append(str(result.inserted_id))
    print(f"    ✓ Created {len(activities)} activities")
    
    # Seed Staff Assignments
    print("  Seeding staff assignments...")
    staff_count = 0
    for i, activity in enumerate(activities):
        for staff_email in activity.get("assigned_staff", []):
            assignment = {
                "staff_email": staff_email,
                "staff_name": staff_email.split("@")[0].replace(".", " ").title(),
                "activity_id": activity_ids[i],
                "role": "coordinator" if "admin" in staff_email else "assistant",
                "assigned_at": datetime.utcnow(),
                "assigned_by": user_ids.get("admin@minds.org.sg")
            }
            await db.staff_assignments.insert_one(assignment)
            staff_count += 1
    print(f"    ✓ Created {staff_count} staff assignments")
    
    # Seed Bookings with form responses
    print("  Seeding bookings...")
    booking_count = 0
    participant_emails = ["mary.participant@gmail.com", "david.user@gmail.com", "anna.adhoc@gmail.com"]
    
    for i, activity_id in enumerate(activity_ids[:5]):  # First 5 activities
        for j, email in enumerate(participant_emails[:2]):  # 2 participants each
            booking = {
                "user_id": user_ids.get(email),
                "activity_id": activity_id,
                "status": "confirmed",
                "timestamp": datetime.utcnow() - timedelta(days=j),
                "form_responses": {
                    "emergency_contact": f"Contact Person {j+1} - 9{j}234567",
                    "wheelchair_access": j == 0,
                    "dietary_restrictions": "None" if j == 0 else "Vegetarian"
                }
            }
            await db.bookings.insert_one(booking)
            booking_count += 1
    print(f"    ✓ Created {booking_count} bookings")
    
    # Seed Event Memories for RAG
    print("  Seeding event memories...")
    for memory in SAMPLE_MEMORIES:
        memory["created_at"] = datetime.utcnow() - timedelta(days=30)
        memory["last_used"] = datetime.utcnow() - timedelta(days=5)
        await db.event_memories.insert_one(memory)
    print(f"    ✓ Created {len(SAMPLE_MEMORIES)} event memories")
    
    # Create indexes
    print("  Creating indexes...")
    await db.users.create_index("email", unique=True)
    await db.activities.create_index("start_time")
    await db.bookings.create_index([("user_id", 1), ("activity_id", 1)])
    await db.staff_assignments.create_index([("staff_email", 1), ("activity_id", 1)])
    await db.event_memories.create_index("keywords")
    await db.event_memories.create_index("category")
    print("    ✓ Indexes created")
    
    print("\n✅ Database seeding complete!")
    print(f"   Users: {len(SAMPLE_USERS)}")
    print(f"   Activities: {len(activities)}")
    print(f"   Bookings: {booking_count}")
    print(f"   Staff Assignments: {staff_count}")
    print(f"   Event Memories: {len(SAMPLE_MEMORIES)}")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())

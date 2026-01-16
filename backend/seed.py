
import asyncio
import random
from datetime import datetime, timedelta
import uuid
from sqlalchemy import select
from app.db import db, init_db
from app.models.user import UserDB, UserRole
from app.models.activity import ActivityDB
from app.models.volunteer import VolunteerDB
from app.models.form_response import FormResponseDB

# Mock Data
FIRST_NAMES = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson"]
SKILLS = ["First Aid", "Driving", "Cooking", "Photography", "Teaching", "Event Planning", "Logistics", "Social Media", "Coding", "Design"]
LOCATIONS = ["East Coast Park", "Sungei Buloh", "MacRitchie Reservoir", "Pasir Ris Park", "Bishan-Ang Mo Kio Park", "Marina Barrage", "Punggol Waterway"]

def get_password_hash(password: str) -> str:
    return f"hashed_{password}"

GENERIC_FORM = {
    "title": "General Volunteer Application",
    "description": "Standard registration form for community events.",
    "fields": [
        {
            "id": "motivation",
            "label": "Why do you want to join?",
            "type": "textarea",
            "required": True
        },
        {
            "id": "availability",
            "label": "Are you available for the full duration?",
            "type": "radio",
            "options": ["Yes", "No, partial"],
            "required": True
        },
        {
            "id": "prev_exp",
            "label": "Years of volunteering experience",
            "type": "select",
            "options": ["0-1 years", "1-3 years", "3+ years"],
            "required": False
        }
    ]
}

async def seed_data():
    print("Starting database seed...")
    db.connect()
    async with db.get_database() as session:
        # 1. Create Volunteers
        print("Creating volunteers...")
        volunteers = []
        for i in range(50):
            email = f"volunteer{i+1}@holysheet.com"
            existing = await session.execute(select(UserDB).where(UserDB.email == email))
            user = existing.scalar_one_or_none()
            
            if not user:
                user = UserDB(
                    email=email,
                    name=f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
                    password=get_password_hash("password123"),
                    role=UserRole.USER,
                    skills=random.sample(SKILLS, k=random.randint(1, 3)),
                    is_verified=True,
                    volunteer_count=random.randint(0, 50),
                    volunteer_hours=random.randint(0, 200)
                )
                session.add(user)
            volunteers.append(user)
        
        await session.commit()
        
        # Reload valid objects
        vol_result = await session.execute(select(UserDB).where(UserDB.email.like("volunteer%@holysheet.com")))
        volunteers = vol_result.scalars().all()
        print(f"Seeded {len(volunteers)} volunteers.")

        # 2. Create Activities
        print("Creating activities...")
        all_activities = []
        
        # 2a. Mega Beach Cleanup (Specific Context)
        cleanup_id = uuid.uuid4()
        beach_cleanup = ActivityDB(
            id=cleanup_id,
            title="Mega Beach Cleanup 2025",
            description="Our biggest event of the year! Join 500+ volunteers to clean up East Coast Park.",
            start_time=datetime.utcnow() + timedelta(days=14),
            end_time=datetime.utcnow() + timedelta(days=14, hours=4),
            location="East Coast Park, Area C",
            volunteers_needed=100,
            volunteers_registered=0,
            activity_type="volunteer",
            status="published",
            organiser="Ocean Save",
            skills_required=["First Aid", "Logistics"],
            image_url="https://images.unsplash.com/photo-1618477461853-5f8dd1203941?w=800&q=80",
            volunteer_form={
                "title": "Beach Cleanup Volunteer Application",
                "description": "Please fill out this form to register for the beach cleanup.",
                "fields": [
                    {"id": "exp_level", "label": "Have you participated in a beach cleanup before?", "type": "select", "options": ["Yes, frequently", "Yes, once or twice", "No, this is my first time"], "required": True},
                    {"id": "team_pref", "label": "Preferred Team Assignment", "type": "select", "options": ["Litter Picking", "Waste Sorting", "Logistics Support", "First Aid Station"], "required": True},
                    {"id": "transport", "label": "Do you need transport from the MRT?", "type": "radio", "options": ["Yes", "No"], "required": True},
                    {"id": "dietary", "label": "Dietary Restrictions", "type": "text", "required": False}
                ]
            }
        )
        session.add(beach_cleanup)
        all_activities.append(beach_cleanup)

        # 2b. Random Activities (Generic Context)
        descriptions = [
            "Monthly community gathering.",
            "Park maintenance and tree planting.",
            "Food distribution for the elderly.",
            "Animal shelter open house assistance.",
            "Library book sorting drive."
        ]

        for i in range(5):
            act_id = uuid.uuid4()
            act = ActivityDB(
                id=act_id,
                title=f"Community Event - {random.choice(['Alpha', 'Beta', 'Gamma', 'Delta'])} {i+1}",
                description=random.choice(descriptions),
                start_time=datetime.utcnow() + timedelta(days=random.randint(1, 60)),
                end_time=datetime.utcnow() + timedelta(days=random.randint(1, 60), hours=3),
                location=random.choice(LOCATIONS),
                volunteers_needed=random.randint(10, 30),
                activity_type="volunteer",
                status="published",
                organiser="Community Hub",
                volunteer_form=GENERIC_FORM
            )
            session.add(act)
            all_activities.append(act)

        await session.commit()
        print("Activities seeded.")

        # 3. Generate Responses for ALL Activities
        total_responses = 0

        for activity in all_activities:
            print(f"Generating data for: {activity.title}")
            registrations = []
            
            # Determine participation rate based on event type
            participation_rate = 0.8 if "Cleanup" in activity.title else 0.4
            
            for vol in volunteers:
                if random.random() > participation_rate:
                    continue

                # Check existing
                existing = await session.execute(select(VolunteerDB).where(
                    VolunteerDB.user_id == vol.id,
                    VolunteerDB.activity_id == activity.id
                ))
                if existing.scalar_one_or_none():
                    continue

                # Register
                reg = VolunteerDB(
                    user_id=vol.id,
                    activity_id=activity.id,
                    role="Volunteer",
                    status="confirmed",
                    applied_at=datetime.utcnow() - timedelta(days=random.randint(1, 10))
                )
                session.add(reg)
                registrations.append(reg)

                # Generate Custom Responses based on Form Type
                response_data = {}
                
                if "Cleanup" in activity.title:
                    # Specific Logic for Cleanup
                    response_data = {
                        "exp_level": random.choices(["Yes, frequently", "Yes, once or twice", "No, this is my first time"], weights=[0.2, 0.3, 0.5])[0],
                        "team_pref": random.choices(["Litter Picking", "Waste Sorting", "Logistics Support", "First Aid Station"], weights=[0.5, 0.3, 0.1, 0.1])[0],
                        "transport": "Yes" if random.random() > 0.4 else "No",
                        "dietary": random.choice(["None", "Vegetarian", "Halal"]) if random.random() > 0.8 else "None"
                    }
                else:
                    # Generic Logic
                    response_data = {
                        "motivation": random.choice(["I love helping.", "Need community hours.", "Want to make friends.", "Protect the environment."]),
                        "availability": random.choices(["Yes", "No, partial"], weights=[0.7, 0.3])[0],
                        "prev_exp": random.choices(["0-1 years", "1-3 years", "3+ years"], weights=[0.4, 0.4, 0.2])[0]
                    }

                resp = FormResponseDB(
                    activity_id=activity.id,
                    user_id=vol.id,
                    responses=response_data,
                    submitted_at=datetime.utcnow() - timedelta(days=random.randint(0, 5))
                )
                session.add(resp)
                total_responses += 1

            # Update count
            activity.volunteers_registered = len(registrations)
            session.add(activity)
            await session.commit()

        print(f"Successfully seeded data! Generated {total_responses} total responses across {len(all_activities)} activities.")

    db.close()

if __name__ == "__main__":
    asyncio.run(seed_data())

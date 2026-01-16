import asyncio
import os
import sys

# Add the parent directory to sys.path to allow relative imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.db import init_db, engine
from backend.app.models.user import UserDB
from backend.app.models.activity import ActivityDB

async def test_init():
    print("Starting DB Init Test...")
    try:
        await init_db()
        print("init_db() successful!")
    except Exception as e:
        print(f"init_db() failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_init())

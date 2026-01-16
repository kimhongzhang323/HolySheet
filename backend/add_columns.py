import asyncio
from sqlalchemy import text
from app.db import engine

async def add_columns():
    async with engine.begin() as conn:
        print("Adding latitude column...")
        try:
            await conn.execute(text("ALTER TABLE activities ADD COLUMN latitude FLOAT"))
            print("latitude added.")
        except Exception as e:
            print(f"latitude error (maybe exists): {e}")
        
        print("Adding longitude column...")
        try:
            await conn.execute(text("ALTER TABLE activities ADD COLUMN longitude FLOAT"))
            print("longitude added.")
        except Exception as e:
            print(f"longitude error (maybe exists): {e}")

if __name__ == "__main__":
    asyncio.run(add_columns())

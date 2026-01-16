from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from contextlib import asynccontextmanager
import traceback
import os

# Load .env.local if it exists (common in Next.js projects)
if os.path.exists(".env.local"):
    load_dotenv(".env.local")

load_dotenv()

from .config import get_settings
from .db import db, init_db, get_database
from .routers import users, activities, bookings, chat, attendance, volunteers, ai, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - create tables
    db.connect()
    await init_db()
    yield
    # Shutdown
    db.close()

app = FastAPI(title="HolySheet API", version="1.0.0", lifespan=lifespan, debug=True)

# Debug exception handler to show real errors
@app.exception_handler(Exception)
async def debug_exception_handler(request: Request, exc: Exception):
    print(f"[ERROR] Unhandled exception: {exc}")
    print(f"[ERROR] Traceback:\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()},
    )

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(users.router, tags=["Users"])
app.include_router(activities.router, tags=["Activities"])
app.include_router(bookings.router, tags=["Bookings"])
app.include_router(chat.router, tags=["Chat"])
app.include_router(attendance.router, tags=["Admin - Attendance"])
app.include_router(volunteers.router, tags=["Admin - Volunteers"])
app.include_router(ai.router, tags=["Admin - AI"])
app.include_router(reports.router, tags=["Admin - Reports"])

@app.get("/")
def read_root():
    return {"message": "Welcome to HolySheet API"}

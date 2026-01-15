from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .config import get_settings
from .db import db
from .routers import auth, users, activities, bookings, admin, chat, activities_admin, attendance, volunteers, ai, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    db.connect()
    yield
    # Shutdown
    db.close()

app = FastAPI(title="HolySheet API", version="1.0.0", lifespan=lifespan)

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
app.include_router(auth.router, tags=["Auth"])
app.include_router(users.router, tags=["Users"])
app.include_router(activities.router, tags=["Activities"])
app.include_router(bookings.router, tags=["Bookings"])
app.include_router(admin.router, tags=["Admin"])
app.include_router(chat.router, tags=["Chat"])
app.include_router(activities_admin.router, tags=["Admin - Activities"])
app.include_router(attendance.router, tags=["Admin - Attendance"])
app.include_router(volunteers.router, tags=["Admin - Volunteers"])
app.include_router(ai.router, tags=["Admin - AI"])
app.include_router(reports.router, tags=["Admin - Reports"])

@app.get("/")
def read_root():
    return {"message": "Welcome to HolySheet API"}

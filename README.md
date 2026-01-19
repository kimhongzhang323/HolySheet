<p align="center">
  <img src="public/logo.png" alt="JomCare Logo" width="180" />
</p>

<h1 align="center">JomCare</h1>
<p align="center">
  <strong>A comprehensive volunteer management platform for community service organizations</strong>
</p>
<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-documentation">API Docs</a> •
  <a href="#project-structure">Structure</a>
</p>

---

## 📖 Overview

MINDS Activity Hub is a full-stack volunteer management system designed to streamline activity coordination, volunteer engagement, and administrative operations. It features an AI-powered assistant for intelligent form autofill, volunteer matching, and natural language queries.

## ✨ Features

### 🎯 Volunteer Portal
- **Activity Discovery** – Browse and filter volunteer opportunities by category, date, and skills
- **Smart Calendar** – FullCalendar integration for viewing upcoming activities and personal schedules
- **AI-Powered Autofill** – Gemini AI auto-completes volunteer application forms based on user profiles
- **Achievements & Gamification** – Track volunteer hours, badges, and milestones
- **Profile Management** – Manage skills, resume, and volunteer preferences
- **Feedback System** – Submit feedback after participating in activities

### 🛠️ Admin Dashboard
- **Event Management** – Create, edit, and manage volunteer activities with custom registration forms
- **AI Form Builder** – Auto-generate registration forms based on activity descriptions
- **Volunteer Matching** – AI-powered volunteer-to-activity matching based on skills and availability
- **Attendance Tracking** – QR code-based check-in/check-out system
- **Analytics & Reports** – Generate weekly reports, export volunteer data, and view activity statistics
- **AI Copilot** – Natural language interface to query data and get insights

### 🤖 AI Capabilities (Powered by Google Gemini)
- **Smart Autofill** – Personalizes form responses based on user profile and activity requirements
- **Volunteer Matching** – Ranks and recommends volunteers for activities based on skill compatibility
- **Feedback Summarization** – AI-generated summaries of volunteer feedback
- **Form Generation** – Automatically generates form fields from activity descriptions
- **Natural Language Queries** – Chat with the system to get insights about volunteers and activities

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS framework |
| [Framer Motion](https://www.framer.com/motion/) | Animations and transitions |
| [FullCalendar](https://fullcalendar.io/) | Interactive calendar component |
| [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) | 3D graphics for immersive experiences |
| [Lucide React](https://lucide.dev/) | Icon library |
| [Recharts](https://recharts.org/) | Data visualization |

### Backend
| Technology | Purpose |
|------------|---------|
| [FastAPI](https://fastapi.tiangolo.com/) | High-performance Python API framework |
| [SQLAlchemy 2.0](https://www.sqlalchemy.org/) | Async ORM with PostgreSQL |
| [Pydantic](https://docs.pydantic.dev/) | Data validation and settings |
| [Google Generative AI](https://ai.google.dev/) | Gemini API for AI features |
| [Uvicorn](https://www.uvicorn.org/) | ASGI server |

### Database & Auth
| Technology | Purpose |
|------------|---------|
| [Supabase](https://supabase.com/) | PostgreSQL database with realtime |
| [NextAuth.js v5](https://authjs.dev/) | Authentication with Google OAuth |

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.10+
- **Supabase** account (for PostgreSQL database)
- **Google Cloud** project with Gemini API enabled

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
AUTH_SECRET=your_auth_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

# Google AI (Gemini)
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_AI_API_KEY=your_gemini_api_key

# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:port/database
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- **API Base**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 to view the application.

## 📚 API Documentation

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/activities/feed` | Get activity feed for volunteers |
| `GET` | `/activities/filter` | Filter activities by criteria |
| `POST` | `/bookings` | Book a volunteer slot |
| `POST` | `/chat` | Chat with AI agent (authenticated) |
| `POST` | `/chat/public` | Public AI chat endpoint |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/activities` | Create new activity |
| `GET` | `/admin/activities` | List all activities |
| `PUT` | `/admin/activities/{id}` | Update activity |
| `DELETE` | `/admin/activities/{id}` | Delete activity |
| `GET` | `/admin/volunteers` | List all volunteers |
| `POST` | `/admin/attendance/mark` | Mark attendance |
| `GET` | `/admin/reports/stats` | Get dashboard statistics |
| `GET` | `/admin/reports/weekly` | Generate weekly report |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/autofill` | AI-powered form autofill |
| `POST` | `/admin/ai/generate-form` | Generate form from description |
| `POST` | `/admin/ai/match-volunteers` | Match volunteers to activity |
| `POST` | `/admin/ai/summarize-feedback` | Summarize feedback entries |
| `POST` | `/admin/ai/query` | Natural language data query |

## 📁 Project Structure

```
HolySheet/
├── backend/                    # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py            # Application entry point
│   │   ├── config.py          # Settings and configuration
│   │   ├── db.py              # Database connection
│   │   ├── dependencies.py    # Dependency injection (auth, etc.)
│   │   ├── models/            # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── activity.py
│   │   │   ├── booking.py
│   │   │   └── ...
│   │   ├── routers/           # API route handlers
│   │   │   ├── activities.py
│   │   │   ├── ai.py
│   │   │   ├── bookings.py
│   │   │   ├── volunteers.py
│   │   │   └── ...
│   │   └── services/          # Business logic
│   │       └── ai.py          # AI service (Gemini integration)
│   └── requirements.txt
│
├── src/                        # Next.js Frontend
│   ├── app/
│   │   ├── (portal)/          # Volunteer-facing pages
│   │   │   ├── events/        # Browse activities
│   │   │   ├── calendar/      # Personal schedule
│   │   │   ├── profile/       # User profile
│   │   │   ├── achievements/  # Badges and milestones
│   │   │   └── ...
│   │   ├── (admin)/           # Admin dashboard
│   │   │   └── admin/
│   │   │       ├── page.tsx   # Dashboard home
│   │   │       ├── events/    # Event management
│   │   │       ├── volunteers/# Volunteer management
│   │   │       ├── schedule/  # Calendar management
│   │   │       └── ...
│   │   ├── api/               # Next.js API routes
│   │   └── auth/              # Auth pages
│   ├── components/            # Reusable React components
│   └── lib/                   # Utilities and providers
│
├── public/                     # Static assets
├── supabase_*.sql             # Database migration scripts
└── package.json
```

## 🔐 Authentication

The application uses **NextAuth.js v5** with Google OAuth for authentication. Users are assigned roles:

| Role | Access Level |
|------|-------------|
| `user` | Volunteer portal access |
| `volunteer` | Enhanced volunteer features |
| `staff` | Limited admin access |
| `admin` | Full admin dashboard access |

## 🧪 Development

### Running Both Servers

For full functionality, run both the frontend and backend:

```bash
# Terminal 1 - Backend
cd backend
venv\Scripts\activate  # Windows
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
npm run dev
```



## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/kimhongzhang323">Kim Hong Zhang</a>
</p>

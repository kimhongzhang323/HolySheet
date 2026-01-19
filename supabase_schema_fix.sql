-- SQL Migration: Fix Schema for Seeding & Profile Integration (Part 3)

-- 0. Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ensure 'id' defaults to UUID for users and activities
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.activities ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Update 'users' table
ALTER TABLE IF EXISTS public.users 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS hours_volunteered integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS missions_completed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS achievements jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS availability text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS resume_json jsonb DEFAULT '{}'::jsonb;

-- 3. Update 'activities' table
ALTER TABLE IF EXISTS public.activities
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS start_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS end_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS capacity integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS volunteers_needed integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS allowed_tiers text[] DEFAULT '{ad-hoc,once-a-week}'::text[],
ADD COLUMN IF NOT EXISTS category text;

-- 4. Update 'event_volunteers' table (Legacy/Current bookings)
CREATE TABLE IF NOT EXISTS public.event_volunteers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    activity_id uuid REFERENCES public.activities(id) ON DELETE CASCADE,
    UNIQUE(user_id, activity_id)
);

ALTER TABLE IF EXISTS public.event_volunteers 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS joined_at timestamp with time zone DEFAULT now();

-- Ensure 'id' has a default value if it was created without one
ALTER TABLE IF EXISTS public.event_volunteers 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 5. Explicit Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    activity_id uuid REFERENCES public.activities(id) ON DELETE CASCADE,
    status text DEFAULT 'pending',
    applied_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, activity_id)
);

-- Ensure 'id' has a default value for applications too
ALTER TABLE IF EXISTS public.applications 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

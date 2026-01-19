-- Run this in your Supabase SQL Editor to update the schema

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hours_volunteered INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS missions_completed INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS availability TEXT[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb;

-- Also ensure 'event_volunteers' exists if not already
CREATE TABLE IF NOT EXISTS public.event_volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    activity_id UUID REFERENCES public.activities(id),
    status VARCHAR(50) DEFAULT 'confirmed',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Create activities table if missing (unlikely based on logs)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    capacity INTEGER,
    volunteers_needed INTEGER DEFAULT 0,
    image_url TEXT,
    allowed_tiers TEXT[]
);

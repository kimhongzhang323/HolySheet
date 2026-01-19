
-- Fix missing form_data column in applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    activity_id uuid REFERENCES public.activities(id) ON DELETE CASCADE,
    status text DEFAULT 'pending',
    applied_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, activity_id)
);

ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS form_data jsonb DEFAULT '{}'::jsonb;

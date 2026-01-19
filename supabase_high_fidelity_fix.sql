-- SQL Migration: Add high-fidelity activity columns (Updated)
-- Run this in your Supabase SQL Editor

ALTER TABLE IF EXISTS public.activities
ADD COLUMN IF NOT EXISTS "type" text,
ADD COLUMN IF NOT EXISTS activity_type text,
ADD COLUMN IF NOT EXISTS engagement_frequency text,
ADD COLUMN IF NOT EXISTS organizer text,
ADD COLUMN IF NOT EXISTS organizer_label text,
ADD COLUMN IF NOT EXISTS schedule text,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS requirements text[] DEFAULT '{}'::text[];

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

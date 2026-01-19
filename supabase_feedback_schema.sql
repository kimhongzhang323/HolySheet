-- SQL Migration: Add Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    user_email text,
    type text NOT NULL, -- 'bug', 'suggestion', 'compliment', 'other'
    rating integer CHECK (rating >= 1 AND rating <= 5),
    message text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert feedback
CREATE POLICY "Allow authenticated users to insert feedback" 
ON public.feedback FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow admins to see all feedback (assuming we have a role 'admin')
CREATE POLICY "Allow admins to view feedback" 
ON public.feedback FOR SELECT 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

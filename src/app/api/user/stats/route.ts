import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user data directly from Supabase 'users' table
        const { data: user, error } = await supabase
            .from('users')
            .select('name, image, hours_volunteered, missions_completed, skills, bio, phone_number, location, created_at, achievements, resume_json')
            .eq('email', session.user.email)
            .single();

        if (error || !user) {
            console.error('Supabase stats fetch error:', error);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const stats = {
            name: user.name,
            image: user.image,
            hours: user.hours_volunteered || 0,
            missions: user.missions_completed || 0,
            skills: user.skills || [],
            bio: user.bio,
            phone: user.phone_number,
            location: user.location,
            joinedDate: user.created_at,
            achievements: user.achievements || [],
            resume_json: user.resume_json || {}
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

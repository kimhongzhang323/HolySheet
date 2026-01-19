import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        const session = await auth();
        const userEmail = session?.user?.email;

        // 1. Fetch all upcoming activities
        const now = new Date().toISOString();
        const { data: activities, error: actError } = await supabase
            .from('activities')
            .select('*')
            .gte('start_time', now)
            .order('start_time', { ascending: true })
            .limit(10);

        if (actError) throw actError;

        // 2. If logged in, check which events the user is enrolled in
        let enrolledEventIds: string[] = [];
        if (userEmail) {
            const { data: user } = await supabase
                .from('users')
                .select('id')
                .eq('email', userEmail)
                .single();

            if (user) {
                const { data: bookings } = await supabase
                    .from('event_volunteers')
                    .select('activity_id')
                    .eq('user_id', user.id);

                if (bookings) {
                    enrolledEventIds = bookings.map(b => b.activity_id);
                }
            }
        }

        // 3. Map activities with enrichment (e.g., isEnrolled flag)
        const enrichedActivities = (activities || []).map(act => ({
            ...act,
            isEnrolled: enrolledEventIds.includes(act.id)
        }));

        return NextResponse.json({ activities: enrichedActivities });

    } catch (error: any) {
        console.error('Activities Feed Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

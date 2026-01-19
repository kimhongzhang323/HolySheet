import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const type = url.searchParams.get('type'); // 'upcoming' or 'history'

        // Get User ID from Supabase
        const { data: user } = await supabase.from('users').select('id').eq('email', session.user.email).single();
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        let query = supabase
            .from('event_volunteers')
            .select(`
                status,
                activities (
                    id,
                    title,
                    location,
                    start_time,
                    end_time,
                    image_url,
                    volunteers_needed
                )
            `)
            .eq('user_id', user.id);

        const now = new Date().toISOString();

        if (type === 'upcoming') {
            // Future events
            // We need to filter by activity start_time > now. 
            // Supabase filtering on joined tables is tricky. It's often easier to fetch and filter in app 
            // OR use inner joins if Supabase supports '!inner'.
            // Let's try fetching and filtering for simplicity and robustness first, unless dataset is huge.
            const { data, error } = await query;
            if (error) throw error;

            const upcoming = data
                .map((b: any) => ({ ...b, activity: b.activities })) // flatten
                .filter((item: any) => item.activity && new Date(item.activity.start_time) > new Date())
                .sort((a: any, b: any) => new Date(a.activity.start_time).getTime() - new Date(b.activity.start_time).getTime());

            return NextResponse.json({ activities: upcoming });

        } else if (type === 'history') {
            const { data, error } = await query;
            if (error) throw error;

            const history = data
                .map((b: any) => ({ ...b, activity: b.activities }))
                .filter((item: any) => item.activity && new Date(item.activity.end_time) < new Date())
                .sort((a: any, b: any) => new Date(b.activity.start_time).getTime() - new Date(a.activity.start_time).getTime()); // Newest first

            return NextResponse.json({ activities: history });
        }

        return NextResponse.json({ error: 'Invalid type param' }, { status: 400 });

    } catch (error) {
        console.error('Activities API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

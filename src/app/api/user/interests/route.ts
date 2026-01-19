import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch interests from Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('interests')
            .eq('email', session.user.email)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ interests: user.interests || [] });

    } catch (error) {
        console.error('Error fetching user interests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { interests } = body;

        if (!Array.isArray(interests)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // Update interests in Supabase
        const { error } = await supabase
            .from('users')
            .update({ interests: interests })
            .eq('email', session.user.email);

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
        }

        return NextResponse.json({ success: true, interests: interests });

    } catch (error) {
        console.error('Error updating user interests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

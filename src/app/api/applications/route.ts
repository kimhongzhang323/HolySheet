import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { activity_id, form_data, portfolio } = body;

        if (!activity_id) {
            return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
        }

        // Get User ID from Supabase
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        // Check if application already exists
        const { data: existingApp } = await supabase
            .from('applications')
            .select('id')
            .eq('activity_id', activity_id)
            .eq('user_id', user.id)
            .single();

        if (existingApp) {
            return NextResponse.json({ error: 'You have already applied for this activity' }, { status: 400 });
        }

        // Insert application
        // Note: form_data will be stored as JSONB in the applications table
        const { data, error } = await supabase
            .from('applications')
            .insert({
                activity_id,
                user_id: user.id,
                form_data: form_data || {},
                status: 'pending',
                // portfolio data could be stored here or in a separate file storage link
                // for now we'll put interesting metadata in form_data if needed
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase Insert Error:', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            application: data
        });

    } catch (error: any) {
        console.error('Application Submission API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get User ID from Supabase
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { data, error } = await supabase
            .from('applications')
            .select(`
                *,
                activities (
                    id,
                    title,
                    location,
                    start_time,
                    image_url
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ applications: data });

    } catch (error: any) {
        console.error('Fetch Applications API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

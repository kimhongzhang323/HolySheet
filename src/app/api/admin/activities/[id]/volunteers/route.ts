
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from "@/auth";
import { ADMIN_MOCK_VOLUNTEERS } from '@/lib/adminMockData';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const params = await context.params;
        const activity_id = params.id;

        if (!session?.user?.email) {
            console.log("No session. Returning mock volunteers for demo.");
            return NextResponse.json(ADMIN_MOCK_VOLUNTEERS);
        }

        // Verify Admin/Staff Role
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('email', session.user.email)
            .single();

        if (userError || !currentUser || !['admin', 'staff'].includes(currentUser.role)) {
            console.log("Access forbidden. Returning mock volunteers for demo.");
            return NextResponse.json(ADMIN_MOCK_VOLUNTEERS);
        }

        if (!activity_id) {
            return NextResponse.json(ADMIN_MOCK_VOLUNTEERS);
        }

        // Fetch volunteers from event_volunteers table joined with users
        const { data: volunteers, error } = await supabase
            .from('event_volunteers')
            .select(`
                user_id,
                status,
                joined_at,
                user:users (
                    id,
                    name,
                    email,
                    phone_number
                )
            `)
            .eq('activity_id', activity_id);

        if (error) {
            console.error("Error fetching volunteers:", error);
            return NextResponse.json(ADMIN_MOCK_VOLUNTEERS);
        }

        // Return mock data if no volunteers found
        if (!volunteers || volunteers.length === 0) {
            console.log("No volunteers found. Returning mock volunteers.");
            return NextResponse.json(ADMIN_MOCK_VOLUNTEERS);
        }

        const formattedVolunteers = volunteers.map(v => ({
            id: v.user_id,
            name: (v.user as any)?.name || 'Unknown',
            email: (v.user as any)?.email || '',
            role: 'volunteer', // Default since they are in this table
            status: v.status,
            applied_at: v.joined_at,
            skills: [] // We could fetch this if needed, but keeping it simple for now
        }));

        return NextResponse.json(formattedVolunteers);

    } catch (error: any) {
        console.error("Activity Volunteers Error:", error);
        return NextResponse.json(ADMIN_MOCK_VOLUNTEERS);
    }
}

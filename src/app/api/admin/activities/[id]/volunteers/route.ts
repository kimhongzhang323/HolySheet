
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from "@/auth";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const params = await context.params;
        const activity_id = params.id;

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify Admin/Staff Role
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('email', session.user.email)
            .single();

        if (userError || !currentUser || !['admin', 'staff'].includes(currentUser.role)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        if (!activity_id) {
            return NextResponse.json({ error: "Missing activity ID" }, { status: 400 });
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
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const formattedVolunteers = volunteers?.map(v => ({
            id: v.user_id,
            name: (v.user as any)?.name || 'Unknown',
            email: (v.user as any)?.email || '',
            role: 'volunteer', // Default since they are in this table
            status: v.status,
            applied_at: v.joined_at,
            skills: [] // We could fetch this if needed, but keeping it simple for now
        })) || [];

        return NextResponse.json(formattedVolunteers);

    } catch (error: any) {
        console.error("Activity Volunteers Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

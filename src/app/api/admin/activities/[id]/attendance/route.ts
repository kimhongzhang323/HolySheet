
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

        // 1. Fetch activity to get attendees array
        const { data: activity, error: actError } = await supabase
            .from('activities')
            .select('id, title, capacity, attendees')
            .eq('id', activity_id)
            .single();

        if (actError || !activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        const attendeeIds = activity.attendees || [];

        let attendees: any[] = [];

        if (attendeeIds.length > 0) {
            // 2. Fetch those users
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('id, name, email')
                .in('id', attendeeIds);

            if (!userError && users) {
                attendees = users;
            }
        }

        const capacity = activity.capacity || 0;
        const attendance_percentage = capacity > 0 ? Math.round((attendeeIds.length / capacity) * 100) : 0;

        return NextResponse.json({
            activity_id: activity.id,
            title: activity.title,
            total_attended: attendeeIds.length,
            capacity: capacity,
            attendance_percentage,
            attendees
        });

    } catch (error: any) {
        console.error("Activity Attendance Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from "@/auth";
import { ADMIN_MOCK_ACTIVITIES } from '@/lib/adminMockData';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const params = await context.params;
        const activity_id = params.id;

        // Find mock activity by ID or use first one
        const mockActivity = ADMIN_MOCK_ACTIVITIES.find(a => a.id === activity_id) || ADMIN_MOCK_ACTIVITIES[0];

        if (!session?.user?.email) {
            console.log("No session. Returning mock activity for demo.");
            return NextResponse.json(mockActivity);
        }

        // Verify Admin/Staff Role
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('email', session.user.email)
            .single();

        if (userError || !currentUser || !['admin', 'staff'].includes(currentUser.role)) {
            console.log("Access forbidden. Returning mock activity for demo.");
            return NextResponse.json(mockActivity);
        }

        if (!activity_id) {
            return NextResponse.json(mockActivity);
        }

        const { data: activity, error } = await supabase
            .from('activities')
            .select('*')
            .eq('id', activity_id)
            .single();

        if (error || !activity) {
            console.log("Activity not found in DB. Returning mock activity.");
            return NextResponse.json(mockActivity);
        }

        return NextResponse.json(activity);

    } catch (error: any) {
        console.error("Activity Details Error:", error);
        const mockActivity = ADMIN_MOCK_ACTIVITIES[0];
        return NextResponse.json(mockActivity);
    }
}

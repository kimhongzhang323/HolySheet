
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

        const { data: activity, error } = await supabase
            .from('activities')
            .select('*')
            .eq('id', activity_id)
            .single();

        if (error) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        return NextResponse.json(activity);

    } catch (error: any) {
        console.error("Activity Details Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

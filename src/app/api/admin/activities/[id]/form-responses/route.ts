
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from "@/auth";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> } // Correct type for dynamic routes in Next.js 15
) {
    try {
        const session = await auth();
        // Await the params object
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

        // Fetch applications (form responses) for this activity
        // We join with users to get applicant details
        const { data: applications, error } = await supabase
            .from('applications')
            .select(`
                id,
                user_id,
                status,
                applied_at,
                form_data,
                user:users (
                    id,
                    name,
                    email,
                    phone_number
                )
            `)
            .eq('activity_id', activity_id);

        if (error) {
            // Check if it's just that the table is empty or actual error
            console.error("Error fetching form responses:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map to match the expected format from the Python backend
        // Python: id, user_id, user_name, user_email, responses (form_data), submitted_at
        const responses = applications?.map(app => ({
            id: app.id,
            user_id: app.user_id,
            user_name: (app.user as any)?.name || 'Unknown',
            user_email: (app.user as any)?.email || '',
            responses: app.form_data || {},
            submitted_at: app.applied_at
        })) || [];

        return NextResponse.json(responses);

    } catch (error: any) {
        console.error("Form Responses API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

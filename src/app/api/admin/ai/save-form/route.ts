
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

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
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { activity_id, form_structure } = body;

        if (!activity_id || !form_structure) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { error } = await supabase
            .from('activities')
            .update({ volunteer_form: form_structure })
            .eq('id', activity_id);

        if (error) {
            console.error("Error saving form:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: "Form saved successfully" });

    } catch (error: any) {
        console.error("Save Form API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

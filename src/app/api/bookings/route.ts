
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { activity_id } = body;

        if (!activity_id) {
            return NextResponse.json({ error: "Missing activity_id" }, { status: 400 });
        }

        // 1. Get User ID from email
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2. Check if Activity exists
        const { data: activity, error: actError } = await supabase
            .from('activities')
            .select('*')
            .eq('id', activity_id)
            .single();

        if (actError || !activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        // 3. Create Booking (Event Volunteer)
        const { data: booking, error: bookingError } = await supabase
            .from('event_volunteers')
            .insert({
                user_id: user.id,
                activity_id: activity_id,
                status: 'confirmed',
                joined_at: new Date().toISOString()
            })
            .select()
            .single();

        if (bookingError) {
            // Check for duplicates
            if (bookingError.code === '23505') { // Unique violation
                return NextResponse.json({ error: "You are already booked for this activity" }, { status: 409 });
            }
            return NextResponse.json({ error: bookingError.message }, { status: 500 });
        }

        // 4. Generate Mock Links (to match ActivityCard interface)
        // Ideally we generate real Google Calendar links here
        const links = {
            googleCalendar: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(activity.title)}&dates=${new Date(activity.start_time).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(activity.end_time || activity.start_time).toISOString().replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent(activity.description || "")}&location=${encodeURIComponent(activity.location || "")}`,
            ics: "#"
        };

        return NextResponse.json({
            success: true,
            bookingId: booking.id,
            links
        });

    } catch (error: any) {
        console.error("Booking Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

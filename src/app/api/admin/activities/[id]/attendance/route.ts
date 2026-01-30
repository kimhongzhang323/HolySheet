
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from "@/auth";
import { ADMIN_MOCK_ATTENDANCE, ADMIN_MOCK_ACTIVITIES } from '@/lib/adminMockData';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const params = await context.params;
        const activity_id = params.id;

        // Mock response for demo
        const mockResponse = {
            activity_id: activity_id || ADMIN_MOCK_ACTIVITIES[0].id,
            title: ADMIN_MOCK_ACTIVITIES[0].title,
            total_attended: ADMIN_MOCK_ATTENDANCE.attendees.length,
            capacity: ADMIN_MOCK_ACTIVITIES[0].capacity,
            attendance_percentage: Math.round((ADMIN_MOCK_ATTENDANCE.attendees.length / ADMIN_MOCK_ACTIVITIES[0].capacity) * 100),
            attendees: ADMIN_MOCK_ATTENDANCE.attendees
        };

        if (!session?.user?.email) {
            console.log("No session. Returning mock attendance for demo.");
            return NextResponse.json(mockResponse);
        }

        // Verify Admin/Staff Role
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('email', session.user.email)
            .single();

        if (userError || !currentUser || !['admin', 'staff'].includes(currentUser.role)) {
            console.log("Access forbidden. Returning mock attendance for demo.");
            return NextResponse.json(mockResponse);
        }

        if (!activity_id) {
            return NextResponse.json(mockResponse);
        }

        // 1. Fetch activity to get attendees array
        const { data: activity, error: actError } = await supabase
            .from('activities')
            .select('id, title, capacity, attendees')
            .eq('id', activity_id)
            .single();

        if (actError || !activity) {
            console.log("Activity not found. Returning mock attendance.");
            return NextResponse.json(mockResponse);
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

        // If no attendees, return mock data for demo
        if (attendees.length === 0) {
            console.log("No attendees found. Returning mock attendance.");
            return NextResponse.json(mockResponse);
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
        return NextResponse.json({
            activity_id: 'mock',
            title: 'Demo Activity',
            total_attended: ADMIN_MOCK_ATTENDANCE.attendees.length,
            capacity: 50,
            attendance_percentage: 6,
            attendees: ADMIN_MOCK_ATTENDANCE.attendees
        });
    }
}

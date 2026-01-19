import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Booking from '@/models/Booking';
import Activity from '@/models/Activity';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // 1. Get User Data (for skills)
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Get Completed Bookings
        // We look for bookings by this user that are either 'attended' OR (confirmed + past end_time)
        // For simplicity, let's strictly count 'attended' or 'confirmed' statuses for now,
        // and ideally check end_time < now.
        const bookings = await Booking.find({
            user_id: user._id,
            status: { $in: ['confirmed', 'attended'] }
        }).populate('activity_id');

        let hoursVolunteered = 0;
        let missionsCompleted = 0;

        const now = new Date();

        bookings.forEach((booking: any) => {
            const activity = booking.activity_id;
            if (!activity) return;

            const end = new Date(activity.end_time);

            // Consider completed if status is 'attended' OR (confirmed and time has passed)
            // You can adjust this logic based on strict business rules
            const isCompleted = booking.status === 'attended' || (booking.status === 'confirmed' && end < now);

            if (isCompleted) {
                missionsCompleted++;

                const start = new Date(activity.start_time);
                const durationMs = end.getTime() - start.getTime();
                const durationHours = durationMs / (1000 * 60 * 60);

                if (durationHours > 0) {
                    hoursVolunteered += durationHours;
                }
            }
        });

        const stats = {
            hours: Math.round(hoursVolunteered * 10) / 10, // Round to 1 decimal
            missions: missionsCompleted,
            skills: user.skills ? user.skills.length : 0
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Activity from '@/models/Activity';
import Booking from '@/models/Booking';

export async function GET() {
    try {
        await dbConnect();
        const session = await auth();

        // 1. Seed Activities
        const activities = [
            {
                title: 'Beach Cleanup @ East Coast',
                description: 'Join us for a morning of cleaning up our beautiful shores.',
                start_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                end_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours duration
                location: 'East Coast Park',
                capacity: 50,
                volunteers_needed: 10,
                needs_help: false,
                allowed_tiers: ['ad-hoc', 'once-a-week'] as const
            },
            {
                title: 'Food Distribution Phase 1',
                description: 'Distributing food packs to the elderly in Clementi.',
                start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                end_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours
                location: 'Clementi CC',
                capacity: 20,
                volunteers_needed: 5,
                needs_help: true,
                allowed_tiers: ['once-a-week'] as const
            },
            {
                title: 'MINDS Tampines Activity Day',
                description: 'Facilitating games and activities for beneficiaries.',
                start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days future
                end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
                location: 'MINDS Tampines',
                capacity: 15,
                volunteers_needed: 3,
                needs_help: false,
                allowed_tiers: ['ad-hoc'] as const
            },
            {
                title: 'Tech Workshop for Seniors',
                description: 'Teaching digital literacy skills.',
                start_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                end_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
                location: 'Ang Mo Kio Library',
                capacity: 10,
                volunteers_needed: 2,
                needs_help: false,
                allowed_tiers: ['twice-a-week'] as const
            }
        ];

        // Upsert activities
        const activityDocs = [];
        for (const act of activities) {
            const doc = await Activity.findOneAndUpdate(
                { title: act.title },
                act,
                { upsert: true, new: true }
            );
            activityDocs.push(doc);
        }

        let message = 'Activities seeded. ';

        // 2. Seed User Data & Bookings (if logged in)
        if (session?.user?.email) {
            const user = await User.findOne({ email: session.user.email });
            if (user) {
                // Ensure user has some skills
                if (!user.skills || user.skills.length === 0) {
                    user.skills = ['First Aid', 'Teaching', 'Logistics'];
                    await user.save();
                }

                // Create Bookings
                // Past activities -> 'attended'
                const pastActivities = activityDocs.filter(a => new Date(a.end_time) < new Date());
                for (const act of pastActivities) {
                    await Booking.findOneAndUpdate(
                        { user_id: user._id, activity_id: act._id },
                        {
                            user_id: user._id,
                            activity_id: act._id,
                            status: 'attended',
                            timestamp: new Date()
                        },
                        { upsert: true }
                    );
                }

                // Future activities -> 'confirmed'
                const futureActivities = activityDocs.filter(a => new Date(a.start_time) > new Date());
                for (const act of futureActivities) {
                    await Booking.findOneAndUpdate(
                        { user_id: user._id, activity_id: act._id },
                        {
                            user_id: user._id,
                            activity_id: act._id,
                            status: 'confirmed',
                            timestamp: new Date()
                        },
                        { upsert: true }
                    );
                }

                message += `Updated bookings/skills for user ${user.email}.`;
            }
        } else {
            message += 'No user logged in, skipped booking generation.';
        }

        return NextResponse.json({ success: true, message });

    } catch (error: any) {
        console.error('Seeding error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Activity from '@/models/Activity';
import User from '@/models/User';
import mongoose from 'mongoose';
import { generateGoogleCalendarLink, generateICSContent } from '@/lib/calendar';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { activity_id } = await req.json();

        if (!activity_id) {
            return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const targetActivity = await Activity.findById(activity_id);
        if (!targetActivity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }


        // Optimize: verify logic. 
        // We want bookings where user is user._id AND status is confirmed.
        // Conflict detection logic
        async function checkConflict(userId: string, newStartTime: Date, newEndTime: Date): Promise<any | null> {
            // Strategy: Get all confirmed bookings for user, populate activity, check times.
            const userBookings = await Booking.find({ user_id: userId, status: 'confirmed' }).populate('activity_id');

            for (const booking of userBookings) {
                // strict cast as any because populate result type inference can be tricky without hydration
                const activity = booking.activity_id as any;
                if (!activity || !activity.start_time || !activity.end_time) continue;

                const existingStart = new Date(activity.start_time).getTime();
                const existingEnd = new Date(activity.end_time).getTime();
                const newStart = newStartTime.getTime();
                const newEnd = newEndTime.getTime();

                // Check overlap: (StartA < EndB) and (EndA > StartB)
                if (existingStart < newEnd && existingEnd > newStart) {
                    return booking; // Return the actual conflicting booking
                }
            }

            return null;
        }

        const conflictingBooking = await checkConflict(
            user._id.toString(),
            new Date(targetActivity.start_time),
            new Date(targetActivity.end_time)
        );

        if (conflictingBooking) {
            return NextResponse.json({
                error: 'You are already busy at this time.',
                code: 'CONFLICT'
            }, { status: 409 });
        }

        // Create Booking
        const newBooking = await Booking.create({
            user_id: user._id,
            activity_id: targetActivity._id,
            status: 'confirmed',
            timestamp: new Date()
        });

        // Generate Calendar Links
        const eventDetails = {
            title: targetActivity.title,
            description: targetActivity.description,
            location: targetActivity.location,
            start_time: targetActivity.start_time,
            end_time: targetActivity.end_time
        };

        const googleCalendarLink = generateGoogleCalendarLink(eventDetails);
        const icsContent = generateICSContent(eventDetails);

        return NextResponse.json({
            message: 'Booking successful',
            booking: newBooking,
            links: {
                googleCalendar: googleCalendarLink,
                ics: icsContent // Frontend can blob this into a file download
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Booking API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

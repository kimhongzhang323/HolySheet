import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Activity from '@/models/Activity';
import Booking from '@/models/Booking';
import mongoose from 'mongoose';

// Conflict detection logic
async function checkConflict(userId: string, newStartTime: Date, newEndTime: Date): Promise<boolean> {
    // Find any confirmed booking for this user that overlaps
    const conflict = await Booking.findOne({
        user_id: userId,
        status: 'confirmed',
    }).populate('activity_id').exec();

    if (!conflict) return false;

    // We need to check all bookings. The above query just gets one.
    // Better to query Bookings, populate Activity, and filter by time in JS or complex aggregation.
    // However, pure MongoDB query is better if we store times on Booking (denormalized) or use aggregation.
    // Given the schema, times are on Activity. So we must populate.

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
            return true;
        }
    }

    return false;
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const { userId, activityId } = body;

        if (!userId || !activityId) {
            return NextResponse.json({ error: 'Missing userId or activityId' }, { status: 400 });
        }

        // 1. Fetch Activity to get times
        const activity = await Activity.findById(activityId);
        if (!activity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        // 2. Check Capacity
        const currentBookingsCount = await Booking.countDocuments({ activity_id: activityId, status: 'confirmed' });
        if (currentBookingsCount >= activity.capacity) {
            // Check if user is volunteer? Requirement says "Volunteers needed" logic separate. 
            // Assuming capacity applies to everyone for now unless specified.
            return NextResponse.json({ error: 'Activity full' }, { status: 400 });
        }

        // 3. Check Conflict
        const hasConflict = await checkConflict(userId, activity.start_time, activity.end_time);
        if (hasConflict) {
            return NextResponse.json({ error: 'Scheduling conflict' }, { status: 409 });
        }

        // 4. Create Booking
        const newBooking = await Booking.create({
            user_id: userId,
            activity_id: activityId,
            status: 'confirmed',
            timestamp: new Date(),
        });

        return NextResponse.json({ success: true, booking: newBooking }, { status: 201 });

    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/auth';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { phoneNumber, address } = await req.json();

        if (!phoneNumber && !address) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        await dbConnect();

        const userId = session.user.id;
        const updateData: any = {};

        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (address) updateData.address = address;

        // Check completeness to clear deadline (optional logic, or just update fields)
        // If phone and address present, we could clear deadline. 
        // For now, let's just update fields.

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        );

        return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });

    } catch (error: any) {
        console.error('Profile Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

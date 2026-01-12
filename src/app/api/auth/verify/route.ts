import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Missing email or OTP' }, { status: 400 });
        }

        await dbConnect();

        // Find user with matching email and OTP, checking expiry
        const user = await User.findOne({
            email,
            otp,
            otpExpires: { $gt: new Date() }
        }).select('+otp +otpExpires');

        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        // Verify and Clear OTP
        user.isVerified = true;
        user.emailVerified = new Date();
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        return NextResponse.json({ success: true, message: "Account verified successfully. You may now login." }, { status: 200 });

    } catch (error: any) {
        console.error('Verify Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

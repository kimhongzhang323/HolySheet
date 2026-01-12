import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

function generateOTP() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += chars[Math.floor(Math.random() * chars.length)];
    }
    return otp;
}

function validatePhone(phone: string) {
    // International Phone Regex: Allows + and digits, 7-15 chars.
    // E.g. +6391234567, +6591234567
    const regex = /^\+?[1-9]\d{6,14}$/;
    return regex.test(phone.replace(/\s/g, ''));
}

export async function POST(req: Request) {
    try {
        const { name, email, password, phoneNumber, address } = await req.json();

        if (!name || !email || !password || !phoneNumber) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!validatePhone(phoneNumber)) {
            return NextResponse.json({ error: 'Invalid phone number format. Use international format e.g., +6591234567' }, { status: 400 });
        }

        await dbConnect();

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // Create user (Unverified)
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            address, // Save address object
            role: 'user',
            isVerified: false,
            otp,
            otpExpires
        });

        // MOCK EMAIL SENDING
        console.log('================================================');
        console.log(`[EMAIL MOCK] To: ${email}`);
        console.log(`[EMAIL MOCK] Subject: Your Verification Code`);
        console.log(`[EMAIL MOCK] Code: ${otp}`);
        console.log('================================================');

        return NextResponse.json({
            success: true,
            userId: newUser._id,
            message: "Account created. Please check your email for the OTP verification code."
        }, { status: 201 });

    } catch (error: any) {
        console.error('Signup Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

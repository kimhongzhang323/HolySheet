import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// GET: Fetch volunteer resume for a user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const user = await User.findOne({ email }).select('skills volunteerResume');

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            skills: user.skills || [],
            bio: user.volunteerResume?.bio || '',
            interests: user.volunteerResume?.interests || [],
            availability: user.volunteerResume?.availability || [],
            history: user.volunteerResume?.history || [],
        });
    } catch (error) {
        console.error('Error fetching volunteer resume:', error);
        return NextResponse.json(
            { error: 'Failed to fetch volunteer resume' },
            { status: 500 }
        );
    }
}

// PUT: Update volunteer resume for a user
export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { skills, bio, interests, availability, history } = body;

        await dbConnect();

        const user = await User.findOneAndUpdate(
            { email },
            {
                $set: {
                    skills: skills || [],
                    'volunteerResume.bio': bio || '',
                    'volunteerResume.interests': interests || [],
                    'volunteerResume.availability': availability || [],
                    'volunteerResume.history': history || [],
                },
            },
            { new: true, upsert: false }
        );

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Volunteer resume updated successfully',
            skills: user.skills || [],
            bio: user.volunteerResume?.bio || '',
            interests: user.volunteerResume?.interests || [],
            availability: user.volunteerResume?.availability || [],
            history: user.volunteerResume?.history || [],
        });
    } catch (error) {
        console.error('Error updating volunteer resume:', error);
        return NextResponse.json(
            { error: 'Failed to update volunteer resume' },
            { status: 500 }
        );
    }
}

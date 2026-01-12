import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Activity from '@/models/Activity';
import User from '@/models/User';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let query = {};
        const now = new Date();

        // Basic filter: only future activities? (Optional, but makes sense for a feed)
        // const baseQuery = { start_time: { $gte: now } }; 
        // For now, let's keep it simple or user specific logic might miss "just finished" ones on home tab? 
        // Usually Home Tab Feed is upcoming.
        const baseQuery = { start_time: { $gte: now } };

        if (user.role === 'volunteer') {
            // "For Volunteers: Shows "Urgent Help Needed" banners at the top."
            // We can return everything, but maybe prioritize or filter.
            // Prompt says: "if (user.role === 'volunteer') return activities.filter(a => a.needs_help)"
            // Let's implement that logic strictly as requested or slightly broader? 
            // "Shows... banners" implies they see them. 
            // Let's filter for needs_help logic as primary feed item.
            query = { ...baseQuery, needs_help: true };
        } else {
            // "For Participants: Shows activities based on their Membership Tier"
            // If user has no tier, maybe show nothing or open ones?
            // Assuming activities with NO allowed_tiers are open to everyone?
            // Or strictly match tier.
            // Let's assume: if allowed_tiers is empty/null, it's open. If set, must match.
            // Mongo query: allowed_tiers is null OR allowed_tiers includes user.tier

            const userTier = user.tier || 'ad-hoc'; // default?

            query = {
                ...baseQuery,
                $or: [
                    { allowed_tiers: { $exists: false } },
                    { allowed_tiers: { $size: 0 } },
                    { allowed_tiers: { $in: [userTier] } }
                ]
            };
        }

        const activities = await Activity.find(query).sort({ start_time: 1 });

        return NextResponse.json({ activities });

    } catch (error) {
        console.error('Feed API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

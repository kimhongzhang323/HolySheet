import Booking from '@/models/Booking';

// Tier types
export type MembershipTier = 'ad-hoc' | 'once-a-week' | 'twice-a-week' | 'three-plus-a-week';

// Weekly booking limits per tier
// null = unlimited, number = max bookings per week
export const TIER_LIMITS: Record<MembershipTier, number | null> = {
    'ad-hoc': null,           // Unlimited (no weekly quota)
    'once-a-week': 1,
    'twice-a-week': 2,
    'three-plus-a-week': null // Unlimited (3+ means no cap)
};

/**
 * Get the start and end of the current week (Monday to Sunday).
 * @param date - Reference date (defaults to now)
 * @returns { weekStart, weekEnd } as Date objects
 */
export function getWeekBoundaries(date: Date = new Date()): { weekStart: Date; weekEnd: Date } {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
    const diffToMonday = day === 0 ? -6 : 1 - day; // Adjust so Monday is start of week

    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
}

/**
 * Count how many confirmed bookings a user has in a given week.
 * @param userId - User's ObjectId as string
 * @param weekStart - Start of week
 * @param weekEnd - End of week
 */
export async function getUserWeeklyBookingCount(
    userId: string,
    weekStart: Date,
    weekEnd: Date
): Promise<number> {
    const count = await Booking.countDocuments({
        user_id: userId,
        status: 'confirmed',
        timestamp: { $gte: weekStart, $lte: weekEnd }
    });
    return count;
}

export interface TierCheckResult {
    allowed: boolean;
    reason?: 'TIER_NOT_ALLOWED' | 'TIER_LIMIT_EXCEEDED';
    message?: string;
    currentCount?: number;
    limit?: number | null;
}

/**
 * Check if a user can book an activity based on their tier.
 * @param userTier - User's membership tier
 * @param userId - User's ObjectId as string
 * @param activityAllowedTiers - Activity's allowed_tiers array (empty = open to all)
 */
export async function canUserBook(
    userTier: MembershipTier,
    userId: string,
    activityAllowedTiers?: MembershipTier[]
): Promise<TierCheckResult> {
    // 1. Check tier eligibility
    // If activity has allowed_tiers defined and not empty, user's tier must be in the list
    if (activityAllowedTiers && activityAllowedTiers.length > 0) {
        if (!activityAllowedTiers.includes(userTier)) {
            return {
                allowed: false,
                reason: 'TIER_NOT_ALLOWED',
                message: `This activity is only available for: ${activityAllowedTiers.join(', ')}`
            };
        }
    }

    // 2. Check weekly booking limit
    const limit = TIER_LIMITS[userTier];

    // If unlimited (null), allow
    if (limit === null) {
        return { allowed: true };
    }

    // Count bookings this week
    const { weekStart, weekEnd } = getWeekBoundaries();
    const currentCount = await getUserWeeklyBookingCount(userId, weekStart, weekEnd);

    if (currentCount >= limit) {
        return {
            allowed: false,
            reason: 'TIER_LIMIT_EXCEEDED',
            message: `You have reached your weekly booking limit of ${limit}. Current bookings: ${currentCount}`,
            currentCount,
            limit
        };
    }

    return { allowed: true, currentCount, limit };
}

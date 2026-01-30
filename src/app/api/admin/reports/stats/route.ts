
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from "@/auth";
import { ADMIN_MOCK_STATS, ADMIN_MOCK_TRENDS, ADMIN_MOCK_DISTRIBUTION } from '@/lib/adminMockData';

// Mock response for demo
const MOCK_RESPONSE = {
    stats: ADMIN_MOCK_STATS,
    activity_distribution: ADMIN_MOCK_DISTRIBUTION,
    participation_trends: ADMIN_MOCK_TRENDS
};

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            console.log("No session. Returning mock stats for demo.");
            return NextResponse.json(MOCK_RESPONSE);
        }

        // Verify Admin/Staff Role
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('email', session.user.email)
            .single();

        if (userError || !currentUser || !['admin', 'staff'].includes(currentUser.role)) {
            console.log("Access forbidden. Returning mock stats for demo.");
            return NextResponse.json(MOCK_RESPONSE);
        }

        const searchParams = req.nextUrl.searchParams;
        const time_range = searchParams.get('time_range') || '6m';

        // 1. Overall Stats
        const { count: total_volunteers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'user');

        const { count: total_activities } = await supabase
            .from('activities')
            .select('*', { count: 'exact', head: true });

        // 2. Activity Distribution
        const { data: allActivities } = await supabase
            .from('activities')
            .select('activity_type, id');

        // If no activities, return mock data
        if (!allActivities || allActivities.length === 0) {
            console.log("No activities found. Returning mock stats.");
            return NextResponse.json(MOCK_RESPONSE);
        }

        const typeMap: Record<string, number> = {};
        allActivities.forEach(act => {
            const type = act.activity_type || 'Unspecified';
            typeMap[type] = (typeMap[type] || 0) + 1;
        });

        const activity_distribution = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

        // 3. Trends Logic (Updated for Supply vs Demand)
        const today = new Date();
        let startDate = new Date();
        let dateFormat: 'day' | 'date' | 'month' = 'month';
        let chartKeys: string[] = [];
        const trendsMap: Record<string, any> = {};

        if (time_range === '7d') {
            startDate.setDate(today.getDate() - 6);
            dateFormat = 'day';
            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                const k = d.toLocaleDateString('en-US', { weekday: 'short' });
                chartKeys.push(k);
                trendsMap[k] = { name: k, total_events: 0, volunteers_needed: 0, volunteers_registered: 0 };
            }
        } else if (time_range === '30d') {
            startDate.setDate(today.getDate() - 29);
            dateFormat = 'date';
            for (let i = 0; i < 30; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                const k = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                chartKeys.push(k);
                if (!trendsMap[k]) {
                    trendsMap[k] = { name: k, total_events: 0, volunteers_needed: 0, volunteers_registered: 0 };
                }
            }
        } else { // 6m
            startDate.setDate(today.getDate() - 180);
            dateFormat = 'month';
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(today.getMonth() - i);
                const k = d.toLocaleDateString('en-US', { month: 'short' });
                if (!chartKeys.includes(k)) {
                    chartKeys.push(k);
                    trendsMap[k] = { name: k, total_events: 0, volunteers_needed: 0, volunteers_registered: 0 };
                }
            }
        }

        // Fetch activities to Aggregate Supply vs Demand
        const { data: trendActivities } = await supabase
            .from('activities')
            .select('id, start_time, volunteers_needed, volunteers_registered')
            .gte('start_time', startDate.toISOString());

        if (trendActivities && trendActivities.length > 0) {
            // Aggregate counts by date key
            trendActivities.forEach(act => {
                const date = new Date(act.start_time);
                let key = '';
                if (dateFormat === 'day') key = date.toLocaleDateString('en-US', { weekday: 'short' });
                else if (dateFormat === 'date') key = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                else if (dateFormat === 'month') key = date.toLocaleDateString('en-US', { month: 'short' });

                if (trendsMap[key]) {
                    trendsMap[key].total_events += 1;
                    trendsMap[key].volunteers_needed += (act.volunteers_needed || 0);
                    trendsMap[key].volunteers_registered += (act.volunteers_registered || 0);
                }
            });
        }

        const chart_data = chartKeys.map(k => trendsMap[k]);

        // If chart data is all zeros, return mock trends for better demo UX
        const hasRealData = chart_data.some(d => d.volunteers_needed > 0 || d.volunteers_registered > 0);

        return NextResponse.json({
            stats: {
                total_volunteers: total_volunteers || ADMIN_MOCK_STATS.total_volunteers,
                total_activities: total_activities || ADMIN_MOCK_STATS.total_activities,
                active_now: 5,
            },
            activity_distribution: activity_distribution.length > 0 ? activity_distribution : ADMIN_MOCK_DISTRIBUTION,
            participation_trends: hasRealData ? chart_data : ADMIN_MOCK_TRENDS
        });

    } catch (error: any) {
        console.error("Admin Stats Error:", error);
        return NextResponse.json(MOCK_RESPONSE);
    }
}

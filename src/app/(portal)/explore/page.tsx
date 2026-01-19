'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import InfiniteMenu from '@/components/InfiniteMenu';
import { VOLUNTEER_ACTIVITIES } from '@/lib/mockData';
import { ChevronLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Activity {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    needs_help?: boolean;
    image_url?: string;
    matchReason?: string;
}

export default function ExplorePage() {
    const { data: session } = useSession();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFeed() {
            try {
                // Wait for session to be available if needed, or proceed
                const token = (session as any)?.accessToken;
                const headers: HeadersInit = token
                    ? { 'Authorization': `Bearer ${token}` }
                    : {};

                const res = await fetch('/api/activities/feed', { headers });
                let rawData = [];
                if (res.ok) {
                    const data = await res.json();
                    rawData = Array.isArray(data) ? data : (data?.activities || []);
                }

                // If empty or failed, use mock EVENTS
                if (rawData.length === 0) {
                    rawData = VOLUNTEER_ACTIVITIES;
                }

                // Normalize data for the UI
                const normalized = rawData.map((act: any) => ({
                    ...act,
                    id: act.id || act._id,
                    image_url: act.image_url || act.image,
                    start_time: (act.start_time && (act.start_time.includes('T') || act.start_time.includes('-')))
                        ? act.start_time
                        : `${act.year || 2026}-${act.month || 'Jan'}-${act.date || '01'} ${act.start_time || ''}`
                }));

                setActivities(normalized as Activity[]);
            } catch (error) {
                console.error('Failed to fetch feed', error);
                // Last resort fallback
                setActivities(VOLUNTEER_ACTIVITIES.map((act: any) => ({
                    ...act,
                    id: act._id,
                    image_url: act.image,
                    start_time: act.start_time
                })) as Activity[]);
            } finally {
                setLoading(false);
            }
        }

        fetchFeed();
    }, [session]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            Explore Missions <Sparkles size={18} className="text-purple-500" />
                        </h1>
                        <p className="text-xs text-gray-500">Discover all available volunteer opportunities</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 w-full h-[calc(100vh-80px)] relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <InfiniteMenu
                            items={activities
                                .filter(act => !(act as any).isEnrolled)
                                .map(act => ({
                                    link: '#',
                                    title: act.title,
                                    description: act.matchReason || act.location || 'Volunteer Opportunity',
                                    image: act.image_url || (act as any).image || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=400&fit=crop'
                                }))}
                        />

                        <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="text-xs text-gray-400 font-bold uppercase tracking-widest"
                            >
                                Drag to rotate • Click to select
                            </motion.p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

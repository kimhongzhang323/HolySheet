'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import ActivityCard from '@/components/ActivityCard';
import TicketCard from '@/components/TicketCard';
import MiniCalendar from '@/components/MiniCalendar';
import DatyAssistant from '@/components/DatyAssistant';
import { MOCK_TICKETS, CALENDAR_DAYS, VOLUNTEER_ACTIVITIES } from '@/lib/mockData';
import { Sparkles, ChevronLeft, ChevronRight, User, Heart, Shield, GraduationCap, Leaf, Coffee, Briefcase, Info, X } from 'lucide-react';
import ImpactHeader from '@/components/ImpactHeader';
import InfiniteMenu from '@/components/InfiniteMenu';

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

export default function PortalPage() {
    const { data: session } = useSession();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMatchmaker, setShowMatchmaker] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Mock stats for ImpactHeader
    const impactStats = {
        hours: 48,
        missions: 12,
        skills: 5
    };

    // Category items for InfiniteMenu
    const CATEGORY_ITEMS = [
        { id: 'env', title: 'Environment', description: 'Cleanups, planting, and conservation.', icon: <Leaf size={20} /> },
        { id: 'com', title: 'Community', description: 'Local support and event assistance.', icon: <Heart size={20} /> },
        { id: 'edu', title: 'Education', description: 'Tutoring and skill-sharing workshops.', icon: <GraduationCap size={20} /> },
        { id: 'tech', title: 'Tech for Good', description: 'Web dev and digital literacy help.', icon: <Briefcase size={20} /> },
        { id: 'food', title: 'Food Security', description: 'Kitchen help and food distribution.', icon: <Coffee size={20} /> },
    ];

    // Mock Causes
    const CAUSES = [
        { label: 'Environment', icon: Leaf, bg: 'bg-emerald-50', color: 'text-emerald-600' },
        { label: 'Community', icon: Heart, bg: 'bg-rose-50', color: 'text-rose-600' },
        { label: 'Education', icon: GraduationCap, bg: 'bg-blue-50', color: 'text-blue-600' }
    ];

    // Mock Applications
    const APPLICATIONS = [
        { id: 'app1', title: 'Senior Care Friend', date: 'Applied Jan 15', status: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'app2', title: 'Library Assistant', date: 'Applied Jan 12', status: 'Approved', color: 'text-emerald-600', bg: 'bg-emerald-50' }
    ];

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
                    // If start_time is just HH:mm, use today + that time for display if it's mock
                    start_time: (act.start_time.includes('T') || act.start_time.includes('-'))
                        ? act.start_time
                        : `${act.year || 2026}-${act.month || 'JANUARY'}-${act.date || '01'} ${act.start_time}`
                }));

                setActivities(normalized as Activity[]);
            } catch (error) {
                console.error('Failed to fetch feed', error);
                // Last resort fallback - use volunteer activities
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

        if (session) {
            fetchFeed();
        }
    }, [session]);

    return (
        <div className="space-y-10">
            {/* Top Row: Impact Header */}
            <ImpactHeader stats={impactStats} userName={session?.user?.name || 'Volunteer'} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Assignments & Applications (Span 4) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Shift Passes Section */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h2 className="text-lg font-bold text-gray-900">Your Assignments</h2>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider italic">Active</span>
                        </div>
                        {MOCK_TICKETS.map((ticket, idx) => (
                            <TicketCard key={idx} {...ticket} />
                        ))}
                    </section>

                    {/* Applications Tracker */}
                    <section>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h2 className="text-lg font-bold text-gray-900">Applications Activity</h2>
                            <button className="text-xs font-semibold text-emerald-600 hover:underline">View All</button>
                        </div>
                        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4 space-y-3">
                            {APPLICATIONS.map((app) => (
                                <div key={app.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-emerald-200 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 ${app.bg} rounded-xl flex items-center justify-center`}>
                                            <Shield size={18} className={app.color} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{app.title}</p>
                                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{app.date}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${app.bg} ${app.color} uppercase`}>
                                        {app.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* MAIN COLUMN: Recommendations & Map (Span 8) */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Mission Matchmaker Section */}
                    <section>
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Mission Matchmaker</h2>
                                <p className="text-sm text-gray-500">
                                    Recommendations based on your <span className="text-emerald-600 font-semibold underline decoration-emerald-200">Graphic Design</span> skills.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowMatchmaker(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-gray-100 hover:border-emerald-200 transition-all text-xs font-bold"
                                >
                                    <Info size={14} />
                                    Not sure?
                                </button>
                                <button
                                    onClick={() => setShowMatchmaker(true)}
                                    className="text-sm font-bold text-emerald-600 hover:text-emerald-700 underline decoration-emerald-100 underline-offset-4 font-mono tracking-tighter"
                                >
                                    EXPLORE ALL →
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2].map((i) => (
                                    <div key={i} className="h-72 bg-gray-100 rounded-[30px] animate-pulse"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {activities.slice(0, 2).map((activity, i) => (
                                    <ActivityCard
                                        key={activity.id}
                                        activity={{
                                            ...activity,
                                            matchReason: i === 0 ? "98% Match - Design" : "92% Match - Local"
                                        }}
                                    />
                                ))}
                                {activities.length === 0 && (
                                    <div className="col-span-full py-16 text-center text-gray-400 bg-gray-50 border-2 border-dashed border-gray-100 rounded-[30px]">
                                        <Sparkles className="mx-auto mb-3 opacity-20" size={32} />
                                        <p className="font-medium">Curating new missions for you...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Causes & Calendar Row */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        {/* Causes You Support (Span 7) */}
                        <section className="xl:col-span-7">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-xl font-bold text-gray-900">Causes You Support</h2>
                                <button className="text-xs font-bold text-gray-400 hover:text-emerald-600 transition-colors">Manage Interests</button>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {CAUSES.map(cause => (
                                    <div key={cause.label} className={`${cause.bg} rounded-[24px] p-4 flex flex-col items-center justify-center gap-2 border border-white shadow-sm hover:shadow-md transition-all cursor-pointer group`}>
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <cause.icon size={20} className={cause.color} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-700">{cause.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Impact Map Area */}
                            <div className="mt-8 bg-white p-2 rounded-[30px] border border-gray-100 shadow-sm relative overflow-hidden h-[240px]">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15935.334099507856!2d101.69119295!3d3.139003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc362db7d05711%3A0xe5a363231317586a!2sKuala%20Lumpur%20City%20Centre%2C%20Kuala%20Lumpur%2C%20Federal%20Territory%20of%20Kuala%20Lumpur!5e0!3m2!1sen!2smy!4v1653846660000!5m2!1sen!2smy"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="rounded-[22px] grayscale hover:grayscale-0 transition-all duration-700"
                                ></iframe>
                                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white shadow-lg">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-1">Impact Map</p>
                                    <p className="text-sm font-bold text-gray-900 leading-none">Find local missions</p>
                                </div>
                            </div>
                        </section>

                        {/* Calendar Widget (Span 5) */}
                        <section className="xl:col-span-5">
                            <div className="mb-5">
                                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tighter italic opacity-20">Impact Calendar</h2>
                            </div>
                            <MiniCalendar />
                        </section>
                    </div>
                </div>
            </div>
            {/* Floating Assistant */}
            <DatyAssistant />

            {/* Matchmaker Discovery Modal */}
            <AnimatePresence>
                {showMatchmaker && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMatchmaker(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100"
                        >
                            <div className="p-8 pb-4">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">Explore Missions</h2>
                                        <p className="text-sm text-gray-500">Discover all available volunteer opportunities.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowMatchmaker(false)}
                                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <InfiniteMenu
                                    items={activities.map(act => ({
                                        id: act.id || (act as any)._id,
                                        title: act.title,
                                        description: act.location || 'Singapore',
                                        image_url: act.image_url || (act as any).image
                                    }))}
                                    onSelect={(item) => {
                                        console.log('Selected mission:', item.title);
                                        setShowMatchmaker(false);
                                        // In a real app, this would navigate to the event detail
                                    }}
                                />

                                <div className="mt-8 pt-4 border-t border-gray-50 flex justify-between items-center">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center flex-1">Scroll to explore • Click to select</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

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
import Link from 'next/link';

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
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
    const [originalCauses, setOriginalCauses] = useState<string[]>([]);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    // Check if causes have changed
    const hasChanges = JSON.stringify([...selectedCauses].sort()) !== JSON.stringify([...originalCauses].sort());

    // Toggle cause selection
    const toggleCause = (causeLabel: string) => {
        setSelectedCauses(prev =>
            prev.includes(causeLabel)
                ? prev.filter(c => c !== causeLabel)
                : [...prev, causeLabel]
        );
    };

    // Save causes
    const saveCauses = async () => {
        try {
            const res = await fetch('/api/user/interests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ interests: selectedCauses }),
            });

            if (res.ok) {
                setOriginalCauses([...selectedCauses]);
                setShowSaveSuccess(true);
                setTimeout(() => setShowSaveSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Failed to save interests', error);
        }
    };

    // Reset causes
    const resetCauses = () => {
        setSelectedCauses([...originalCauses]);
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
                    rawData = [
                        {
                            _id: 'VOL001',
                            title: 'Care Circle Volunteer',
                            location: 'MINDS Hub (Clementi)',
                            start_time: '2026-01-18T10:00:00',
                            end_time: '2026-01-18T13:00:00',
                            month: 'Jan',
                            date: '18',
                            image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=600&fit=crop',
                            isEnrolled: true
                        },
                        ...VOLUNTEER_ACTIVITIES
                    ];
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
                setLoading(false);
            }
        }

        async function fetchInterests() {
            try {
                const res = await fetch('/api/user/interests');
                if (res.ok) {
                    const data = await res.json();
                    if (data.interests) {
                        setSelectedCauses(data.interests);
                        setOriginalCauses(data.interests);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch interests', error);
            }
        }

        if (session) {
            fetchFeed();
            fetchInterests();
        }
    }, [session]);

    return (
        <div className="space-y-10">
            {/* Top Row: Impact Header Removed */}

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

                    {/* Volunteer Map - Moved here */}
                    <section className="mt-6">
                        <div className="bg-white p-2 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden h-[200px]">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127641.63859040871!2d103.77768925!3d1.3139961!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da11238a8b9375%3A0x887869cf52abf5c4!2sSingapore!5e0!3m2!1sen!2ssg!4v1700000000000!5m2!1sen!2ssg"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="rounded-[18px] transition-all duration-700"
                            ></iframe>

                            {/* Map Label */}
                            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-100 shadow-md">
                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-0.5">📍 Volunteer Map</p>
                                <p className="text-xs font-bold text-gray-900 leading-none">Singapore</p>
                            </div>

                            {/* Pinpoint Markers - Positioned based on Singapore locations */}
                            {/* Clementi Hub - West side */}
                            <div className="absolute top-[55%] left-[30%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                                <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[8px] px-2 py-1 rounded whitespace-nowrap">
                                    MINDS Clementi
                                </div>
                            </div>

                            {/* Ang Mo Kio Hub - North */}
                            <div className="absolute top-[35%] left-[50%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[8px] px-2 py-1 rounded whitespace-nowrap">
                                    MINDS Ang Mo Kio
                                </div>
                            </div>

                            {/* Tampines Hub - East side */}
                            <div className="absolute top-[45%] left-[75%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                                <div className="w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-lg animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[8px] px-2 py-1 rounded whitespace-nowrap">
                                    MINDS Tampines
                                </div>
                            </div>

                            {/* Me Too! Club - Central */}
                            <div className="absolute top-[50%] left-[55%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                                <div className="w-3 h-3 bg-amber-500 rounded-full border-2 border-white shadow-lg animate-pulse" style={{ animationDelay: '0.9s' }}></div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[8px] px-2 py-1 rounded whitespace-nowrap">
                                    Me Too! Club
                                </div>
                            </div>

                            {/* Various Locations - South */}
                            <div className="absolute top-[65%] left-[45%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                                <div className="w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow-lg animate-pulse" style={{ animationDelay: '1.2s' }}></div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[8px] px-2 py-1 rounded whitespace-nowrap">
                                    Community Outreach
                                </div>
                            </div>

                            {/* Activity Markers Overlay */}
                            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-gray-100 shadow-md">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-semibold text-gray-700">5 Locations</span>
                                </div>
                            </div>
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
                                    Recommendations based on your <span className="text-emerald-600 font-semibold underline decoration-emerald-200">volunteer profile & interests</span>.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/explore"
                                    className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 border border-purple-100 hover:border-purple-200 transition-all text-sm font-semibold shadow-sm hover:shadow-md"
                                >
                                    <Sparkles size={16} className="text-purple-500 group-hover:rotate-12 transition-transform" />
                                    Explore 3D Menu
                                </Link>
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
                                {activities
                                    .filter(act => !(act as any).isEnrolled)
                                    .slice(0, 2)
                                    .map((activity, i) => (
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
                            {/* Causes Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Your Interests</h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Tap to select or deselect • <span className="text-emerald-600 font-semibold">{selectedCauses.length} selected</span>
                                    </p>
                                </div>

                                {/* Action Buttons - Only show when changes exist */}
                                {hasChanges && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={resetCauses}
                                            className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 transition-all"
                                        >
                                            Reset
                                        </button>
                                        <motion.button
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            onClick={saveCauses}
                                            className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-1.5 rounded-full transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Save Changes
                                        </motion.button>
                                    </div>
                                )}
                            </div>

                            {/* Causes Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                {CAUSES.map(cause => {
                                    const isSelected = selectedCauses.includes(cause.label);
                                    return (
                                        <motion.div
                                            key={cause.label}
                                            onClick={() => toggleCause(cause.label)}
                                            whileTap={{ scale: 0.95 }}
                                            className={`${cause.bg} rounded-2xl p-5 flex flex-col items-center justify-center gap-3 border-2 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden ${isSelected ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
                                        >
                                            {/* Selected indicator */}
                                            <AnimatePresence>
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                        className="absolute top-2.5 right-2.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${!isSelected && 'grayscale'}`}>
                                                <cause.icon size={26} className={cause.color} />
                                            </div>
                                            <span className={`text-sm font-bold ${isSelected ? 'text-gray-800' : 'text-gray-400'}`}>{cause.label}</span>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Helper Text */}
                            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-gray-400">
                                <span className="inline-flex items-center gap-1">
                                    <div className="w-3 h-3 bg-emerald-100 border-2 border-emerald-400 rounded"></div>
                                    Selected
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="inline-flex items-center gap-1">
                                    <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded opacity-50"></div>
                                    Available
                                </span>
                            </div>

                            {/* Success Toast */}
                            <AnimatePresence>
                                {showSaveSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2"
                                    >
                                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-emerald-800">Preferences saved!</p>
                                            <p className="text-xs text-emerald-600">Your recommendations will be updated.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>

                        {/* Calendar Widget (Span 5) */}
                        <section className="xl:col-span-5">
                            <div className="mb-5">
                                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tighter italic opacity-20">Impact Calendar</h2>
                            </div>
                            <MiniCalendar activities={activities} enrolledEventIds={['VOL001']} />
                        </section>
                    </div>
                </div>
            </div>
            {/* Floating Assistant */}
            <DatyAssistant />
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import ActivityCard from '@/components/ActivityCard';
import TicketCard from '@/components/TicketCard';
import MiniCalendar from '@/components/MiniCalendar';
import DatyAssistant from '@/components/DatyAssistant';
import { VOLUNTEER_ACTIVITIES } from '@/lib/mockData';
import { Sparkles, User, Heart, Shield, GraduationCap, Leaf, Coffee, Briefcase, MapPin, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';
import DashboardMap from '@/components/DashboardMap';

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
    const [assignments, setAssignments] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
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
                const res = await fetch('/api/activities/feed');
                if (res.ok) {
                    const data = await res.json();
                    const rawData = data.activities || [];
                    setActivities(rawData as Activity[]);
                }
            } catch (error) {
                console.error('Failed to fetch feed', error);
            } finally {
                setLoading(false);
            }
        }

        async function fetchAssignments() {
            try {
                const res = await fetch('/api/user/activities?type=upcoming');
                if (res.ok) {
                    const data = await res.json();
                    const upcoming = (data.activities || []).map((item: any) => ({
                        id: item.id || item.activity_id,
                        category: item.activity?.category || 'Volunteer',
                        title: `${item.activity?.title || 'Mission'} • ${item.activity?.location || 'TBD'}`,
                        date: item.activity?.start_time ? new Date(item.activity.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD',
                        time: item.activity?.start_time ? new Date(item.activity.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00',
                        image: item.activity?.image_url || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=600&fit=crop',
                        status: item.status
                    }));

                    setAssignments(upcoming.filter((a: any) => a.status === 'confirmed' || a.status === 'approved'));
                    setApplications(upcoming.filter((a: any) => a.status === 'pending').map((a: any) => ({
                        id: a.id,
                        title: a.title.split(' • ')[0],
                        date: `Applied ${a.date}`,
                        status: 'Pending',
                        color: 'text-amber-600',
                        bg: 'bg-amber-50'
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch assignments', error);
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
            fetchAssignments();
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
                        {assignments.length > 0 ? (
                            assignments.map((ticket, idx) => (
                                <TicketCard key={ticket.id || idx} {...ticket} />
                            ))
                        ) : (
                            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
                                <p className="text-sm font-medium">No active assignments</p>
                            </div>
                        )}
                    </section>

                    {/* Applications Tracker */}
                    <section>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h2 className="text-lg font-bold text-gray-900">Applications Activity</h2>
                            <button className="text-xs font-semibold text-emerald-600 hover:underline">View All</button>
                        </div>
                        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4 space-y-3">
                            {applications.length > 0 ? (
                                applications.map((app) => (
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
                                ))
                            ) : (
                                <div className="py-8 text-center text-gray-400 text-sm">
                                    No application activity
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Volunteer Map */}
                    <section className="mt-6">
                        <div className="bg-white p-1 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden h-[300px]">
                            <DashboardMap />
                        </div>
                    </section>
                </div>

                {/* MAIN COLUMN: Recommendations & Map (Span 8) */}
                < div className="lg:col-span-8 space-y-10" >
                    {/* Mission Matchmaker Section */}
                    < section >
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

                        {
                            loading ? (
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
                            )
                        }
                    </section >

                    {/* Causes & Calendar Row */}
                    < div className="grid grid-cols-1 xl:grid-cols-12 gap-8" >
                        {/* Causes You Support (Span 7) */}
                        < section className="xl:col-span-7" >
                            {/* Causes Header */}
                            < div className="flex justify-between items-start mb-4" >
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Your Interests</h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Tap to select or deselect • <span className="text-emerald-600 font-semibold">{selectedCauses.length} selected</span>
                                    </p>
                                </div>

                                {/* Action Buttons - Only show when changes exist */}
                                {
                                    hasChanges && (
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
                                    )
                                }
                            </div >

                            {/* Causes Grid */}
                            < div className="grid grid-cols-3 gap-4" >
                                {
                                    CAUSES.map(cause => {
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
                                    })
                                }
                            </div >

                            {/* Helper Text */}
                            < div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-gray-400" >
                                <span className="inline-flex items-center gap-1">
                                    <div className="w-3 h-3 bg-emerald-100 border-2 border-emerald-400 rounded"></div>
                                    Selected
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="inline-flex items-center gap-1">
                                    <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded opacity-50"></div>
                                    Available
                                </span>
                            </div >

                            {/* Success Toast */}
                            <AnimatePresence>
                                {
                                    showSaveSuccess && (
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
                                    )
                                }
                            </AnimatePresence >
                        </section >

                        {/* Calendar Widget (Span 5) */}
                        < section className="xl:col-span-5" >
                            <div className="mb-5">
                                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tighter italic opacity-20">Impact Calendar</h2>
                            </div>
                            <MiniCalendar
                                activities={activities}
                                enrolledEventIds={assignments.map(a => a.id)}
                            />
                        </section >
                    </div >
                </div >
            </div >
            {/* Floating Assistant */}
            < DatyAssistant />
        </div >
    );
}

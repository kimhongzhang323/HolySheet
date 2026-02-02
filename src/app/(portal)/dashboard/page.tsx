'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import ActivityCard from '@/components/ActivityCard';
import TicketCard from '@/components/TicketCard';
import MiniCalendar from '@/components/MiniCalendar';
import DatyAssistant from '@/components/DatyAssistant';
import { VOLUNTEER_ACTIVITIES, USER_ASSIGNMENTS, USER_APPLICATIONS, USER_INTERESTS, VOLUNTEER_ASSIGNED_PARTICIPANTS } from '@/lib/mockData';
import { Sparkles, User, Heart, Shield, GraduationCap, Leaf, Coffee, Briefcase, MapPin, Clock, Calendar, Phone, MessageCircle, Navigation, AlertCircle, CheckCircle2, Radio, Users, Activity, ChevronRight, ExternalLink } from 'lucide-react';
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

interface AssignedParticipant {
    id: string;
    name: string;
    age: number;
    photo: string;
    needs_support: 'low' | 'moderate' | 'high';
    interests: string[];
    current_event: {
        id: string;
        title: string;
        location: string;
        start_time: string;
        end_time: string;
        is_live: boolean;
    } | null;
    live_location: {
        lat: number;
        lng: number;
        last_updated: string;
        status: 'at_venue' | 'in_transit' | 'unknown';
    } | null;
    caregiver: {
        name: string;
        phone: string;
        relationship: string;
    } | null;
    emergency_contact: string;
    medical_notes: string | null;
    check_in_status: 'checked_in' | 'not_checked_in';
    check_in_time: string | null;
}

export default function PortalPage() {
    const { data: session } = useSession();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [assignedParticipants, setAssignedParticipants] = useState<AssignedParticipant[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
    const [originalCauses, setOriginalCauses] = useState<string[]>([]);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<AssignedParticipant | null>(null);

    // Check if there's a live event happening now
    const liveEvent = VOLUNTEER_ACTIVITIES.find(act => {
        const now = new Date();
        const start = new Date(act.start_time);
        const end = new Date(act.end_time);
        return now >= start && now <= end;
    });

    // Get participants with live events
    const liveParticipants = assignedParticipants.filter(p => p.current_event?.is_live);

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
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            // const res = await fetch('/api/user/interests', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ interests: selectedCauses }),
            // });

            // if (res.ok) {
            setOriginalCauses([...selectedCauses]);
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000);
            // }
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
        setActivities(VOLUNTEER_ACTIVITIES as unknown as Activity[]);
        setAssignments(USER_ASSIGNMENTS);
        setApplications(USER_APPLICATIONS);
        setAssignedParticipants(VOLUNTEER_ASSIGNED_PARTICIPANTS as AssignedParticipant[]);
        setSelectedCauses(USER_INTERESTS);
        setOriginalCauses(USER_INTERESTS);
        setLoading(false);
    }, [session]);

    const getSupportBadge = (level: string) => {
        switch (level) {
            case 'high':
                return <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">High Support</span>;
            case 'moderate':
                return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">Moderate</span>;
            case 'low':
                return <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full">Low Support</span>;
            default:
                return null;
        }
    };

    const getLocationStatus = (status?: string) => {
        switch (status) {
            case 'at_venue':
                return { text: 'At Venue', color: 'text-green-600', bg: 'bg-green-100' };
            case 'in_transit':
                return { text: 'In Transit', color: 'text-amber-600', bg: 'bg-amber-100' };
            default:
                return { text: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-100' };
        }
    };

    return (
        <div className="space-y-8">
            {/* Live Event Banner */}
            {liveEvent && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-3xl p-6 text-white shadow-xl shadow-orange-200/50 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <Radio size={28} className="animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                        <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                                        Live Now
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold">{liveEvent.title}</h2>
                                <p className="text-white/80 text-sm flex items-center gap-2">
                                    <MapPin size={14} />
                                    {liveEvent.location}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <p className="text-white/70 text-xs">Participants at venue</p>
                                <p className="text-2xl font-bold">{liveParticipants.length}</p>
                            </div>
                            <Link
                                href={`/events/${liveEvent._id}`}
                                className="px-5 py-2.5 bg-white text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-50 transition-all shadow-lg flex items-center gap-2"
                            >
                                View Event
                                <ChevronRight size={16} />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Users size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{assignedParticipants.length}</p>
                            <p className="text-xs text-gray-500">Assigned to you</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle2 size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{assignedParticipants.filter(p => p.check_in_status === 'checked_in').length}</p>
                            <p className="text-xs text-gray-500">Checked in</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Activity size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{liveParticipants.length}</p>
                            <p className="text-xs text-gray-500">Active now</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Calendar size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                            <p className="text-xs text-gray-500">Upcoming shifts</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Assigned Participants (Span 5) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Your Assigned Participants */}
                    <section>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Your Participants</h2>
                                <p className="text-xs text-gray-500">People you're responsible for today</p>
                            </div>
                            {liveParticipants.length > 0 && (
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    {liveParticipants.length} Active
                                </span>
                            )}
                        </div>

                        <div className="space-y-3">
                            {assignedParticipants.map((participant) => (
                                <motion.div
                                    key={participant.id}
                                    onClick={() => setSelectedParticipant(participant)}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className={`bg-white rounded-2xl p-4 border shadow-sm cursor-pointer transition-all ${participant.current_event?.is_live
                                        ? 'border-green-200 ring-2 ring-green-100'
                                        : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="relative">
                                            <img
                                                src={participant.photo}
                                                alt={participant.name}
                                                className="w-14 h-14 rounded-xl object-cover"
                                            />
                                            {participant.current_event?.is_live && (
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                                    <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900 truncate">{participant.name}</h3>
                                                {getSupportBadge(participant.needs_support)}
                                            </div>
                                            {participant.current_event?.is_live ? (
                                                <div className="flex items-center gap-2 text-xs text-green-600">
                                                    <MapPin size={12} />
                                                    <span className="truncate">{participant.current_event.location}</span>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-400">No active event</p>
                                            )}
                                            {participant.live_location && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getLocationStatus(participant.live_location.status).bg} ${getLocationStatus(participant.live_location.status).color}`}>
                                                        {getLocationStatus(participant.live_location.status).text}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        Updated {new Date(participant.live_location.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <a
                                                href={`tel:${participant.emergency_contact}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-9 h-9 bg-green-100 hover:bg-green-200 rounded-xl flex items-center justify-center text-green-600 transition-colors"
                                                title="Call"
                                            >
                                                <Phone size={16} />
                                            </a>
                                            <a
                                                href={`https://wa.me/${participant.emergency_contact.replace(/\D/g, '')}`}
                                                onClick={(e) => e.stopPropagation()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-9 h-9 bg-emerald-100 hover:bg-emerald-200 rounded-xl flex items-center justify-center text-emerald-600 transition-colors"
                                                title="WhatsApp"
                                            >
                                                <MessageCircle size={16} />
                                            </a>
                                        </div>
                                    </div>

                                    {/* Caregiver Quick Contact */}
                                    {participant.caregiver && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Heart size={14} className="text-pink-500" />
                                                <span className="text-xs text-gray-600">
                                                    Caregiver: <span className="font-medium">{participant.caregiver.name}</span>
                                                </span>
                                            </div>
                                            <a
                                                href={`tel:${participant.caregiver.phone}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
                                            >
                                                <Phone size={12} />
                                                Contact
                                            </a>
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {assignedParticipants.length === 0 && (
                                <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
                                    <Users className="mx-auto mb-3 text-gray-300" size={32} />
                                    <p className="text-sm text-gray-500">No participants assigned yet</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Live Location Map */}
                    {liveParticipants.length > 0 && (
                        <section>
                            <div className="flex justify-between items-center mb-4 px-1">
                                <h2 className="text-lg font-bold text-gray-900">Live Locations</h2>
                                <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                    <Navigation size={12} />
                                    Open Maps
                                </button>
                            </div>
                            <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden h-[250px]">
                                <DashboardMap />
                            </div>
                        </section>
                    )}
                </div>

                {/* RIGHT COLUMN: Shifts & Recommendations (Span 7) */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Upcoming Shifts */}
                    <section>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Your Upcoming Shifts</h2>
                                <p className="text-xs text-gray-500">Confirmed volunteer assignments</p>
                            </div>
                            <Link href="/calendar" className="text-xs font-semibold text-emerald-600 hover:underline">
                                View Calendar
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assignments.slice(0, 4).map((ticket, idx) => (
                                <TicketCard key={ticket.id || idx} {...ticket} />
                            ))}
                        </div>
                        {assignments.length === 0 && (
                            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
                                <Calendar className="mx-auto mb-3 opacity-30" size={32} />
                                <p className="text-sm font-medium">No upcoming shifts</p>
                            </div>
                        )}
                    </section>

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
                                            key={activity.id || `rec-${i}`}
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
                            <MiniCalendar
                                activities={activities}
                                enrolledEventIds={assignments.map(a => a.id)}
                            />
                        </section>
                    </div>
                </div>
            </div>

            {/* Participant Detail Modal */}
            <AnimatePresence>
                {selectedParticipant && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedParticipant(null)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className={`p-6 text-white ${selectedParticipant.current_event?.is_live
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : 'bg-gradient-to-r from-gray-600 to-gray-700'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <img
                                        src={selectedParticipant.photo}
                                        alt={selectedParticipant.name}
                                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className="text-xl font-bold">{selectedParticipant.name}</h2>
                                            {selectedParticipant.current_event?.is_live && (
                                                <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                                                    Live
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-white/80 text-sm">Age {selectedParticipant.age}</p>
                                        {getSupportBadge(selectedParticipant.needs_support)}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                {/* Current Event */}
                                {selectedParticipant.current_event && (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Radio size={16} className="text-green-600" />
                                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Current Event</p>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">{selectedParticipant.current_event.title}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <MapPin size={12} />
                                            {selectedParticipant.current_event.location}
                                        </p>
                                    </div>
                                )}

                                {/* Live Location */}
                                {selectedParticipant.live_location && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Navigation size={16} className="text-blue-600" />
                                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Live Location</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getLocationStatus(selectedParticipant.live_location.status).bg} ${getLocationStatus(selectedParticipant.live_location.status).color}`}>
                                                {getLocationStatus(selectedParticipant.live_location.status).text}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Last updated: {new Date(selectedParticipant.live_location.last_updated).toLocaleString()}
                                        </p>
                                        <a
                                            href={`https://www.google.com/maps?q=${selectedParticipant.live_location.lat},${selectedParticipant.live_location.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
                                        >
                                            <ExternalLink size={12} />
                                            Open in Google Maps
                                        </a>
                                    </div>
                                )}

                                {/* Interests */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Interests</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedParticipant.interests.map((interest, i) => (
                                            <span key={i} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg">
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Medical Notes */}
                                {selectedParticipant.medical_notes && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertCircle size={16} className="text-amber-600" />
                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Medical Notes</p>
                                        </div>
                                        <p className="text-sm text-gray-700">{selectedParticipant.medical_notes}</p>
                                    </div>
                                )}

                                {/* Caregiver */}
                                {selectedParticipant.caregiver && (
                                    <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Heart size={16} className="text-pink-600" />
                                            <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wider">Caregiver</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{selectedParticipant.caregiver.name}</p>
                                                <p className="text-xs text-gray-500">{selectedParticipant.caregiver.relationship}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <a
                                                    href={`tel:${selectedParticipant.caregiver.phone}`}
                                                    className="w-10 h-10 bg-pink-200 hover:bg-pink-300 rounded-xl flex items-center justify-center text-pink-700 transition-colors"
                                                >
                                                    <Phone size={18} />
                                                </a>
                                                <a
                                                    href={`https://wa.me/${selectedParticipant.caregiver.phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-10 h-10 bg-green-200 hover:bg-green-300 rounded-xl flex items-center justify-center text-green-700 transition-colors"
                                                >
                                                    <MessageCircle size={18} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Check-in Status */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Check-in Status</p>
                                    <div className="flex items-center gap-2">
                                        {selectedParticipant.check_in_status === 'checked_in' ? (
                                            <>
                                                <CheckCircle2 size={18} className="text-green-600" />
                                                <span className="text-sm font-medium text-green-700">Checked in at {selectedParticipant.check_in_time ? new Date(selectedParticipant.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle size={18} className="text-amber-600" />
                                                <span className="text-sm font-medium text-amber-700">Not checked in</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="border-t border-gray-100 p-4 flex items-center gap-3 bg-gray-50">
                                <a
                                    href={`tel:${selectedParticipant.emergency_contact}`}
                                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Phone size={16} />
                                    Emergency Call
                                </a>
                                <button
                                    onClick={() => setSelectedParticipant(null)}
                                    className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-300 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Assistant */}
            <DatyAssistant />
        </div>
    );
}

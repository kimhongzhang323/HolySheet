'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut, useSession } from "next-auth/react";
import { motion } from 'framer-motion';
import {
    Calendar, Heart, Clock, Award, MapPin, Mail,
    Edit3, ChevronRight, Star, TrendingUp, Users, CheckCircle, Ticket,
    LayoutGrid, List, SlidersHorizontal, ArrowUpDown, ArrowDownToLine, LogOut
} from 'lucide-react';

// Mock user data
// Mock user data replaced by API fetch
const DEFAULT_USER = {
    name: 'Volunteer',
    email: '',
    phone: '',
    location: 'Singapore',
    joinedDate: '-',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Volunteer',
    bio: '',
};

// Mock stats
const MOCK_STATS = {
    totalEvents: 15,
    volunteerEvents: 8,
    meetups: 4,
    conferences: 3,
    totalHours: 48,
    upcomingEvents: 5,
    pendingApplications: 2,
};

// Mock event history - ALL types
const MOCK_EVENT_HISTORY = [
    {
        id: '1',
        title: 'Beach Cleanup',
        organization: 'Green Earth Foundation',
        location: 'East Coast Park, Area B',
        date: 'March 08 2023',
        hours: 4,
        status: 'On Time', // On Time, Late, Absent
        checkIn: '08:53',
        checkOut: '17:15',
        category: 'volunteer',
        type: 'Environment',
        image: 'https://images.unsplash.com/photo-1618477461853-5f8dd68aa272?w=800&q=80',
    },
    {
        id: '2',
        title: 'Tech Meetup',
        organization: 'Singapore Dev Community',
        location: 'Suntec Convention Centre',
        date: 'March 07 2023',
        hours: 3,
        status: 'Late',
        checkIn: '08:27',
        checkOut: '17:09',
        category: 'meetup',
        type: 'Tech',
        image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80',
    },
    {
        id: '3',
        title: 'Music Festival',
        organization: 'Live Nation',
        location: 'Marina Bay Sands',
        date: 'March 06 2023',
        hours: 6,
        status: 'Absent',
        checkIn: '-',
        checkOut: '-',
        category: 'conference',
        type: 'Music',
        image: 'https://images.unsplash.com/photo-1459749411177-3e2886ca85a7?w=800&q=80',
    },
    {
        id: '4',
        title: 'Food Distribution',
        organization: 'Community Kitchen',
        location: 'Bedok Community Centre',
        date: 'March 05 2023',
        hours: 5,
        status: 'On Time',
        checkIn: '08:55',
        checkOut: '17:10',
        category: 'volunteer',
        type: 'Community',
        image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80',
    },
    {
        id: '5',
        title: 'Startup Summit',
        organization: 'TechCrunch',
        location: 'Expo Hall 5',
        date: 'March 04 2023',
        hours: 8,
        status: 'On Time',
        checkIn: '08:58',
        checkOut: '17:06',
        category: 'conference',
        type: 'Business',
        image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
    },
    {
        id: '6',
        title: 'Book Club',
        organization: 'Reading Society',
        location: 'National Library',
        date: 'March 03 2023',
        hours: 2,
        status: 'Late',
        checkIn: '08:40',
        checkOut: '17:02',
        category: 'meetup',
        type: 'Education',
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
    },
];

// Mock upcoming events
const MOCK_UPCOMING = [
    {
        id: '1',
        title: 'Beach Cleanup Phase 2',
        date: '18 Jan 2026',
        status: 'approved',
        category: 'volunteer',
    },
    {
        id: '2',
        title: 'React Developers Meetup',
        date: '22 Jan 2026',
        status: 'registered',
        category: 'meetup',
    },
    {
        id: '3',
        title: 'Community Food Drive',
        date: '25 Jan 2026',
        status: 'pending',
        category: 'volunteer',
    },
];

// Mock badges/achievements with progress
const MOCK_BADGES = [
    {
        id: '1',
        name: 'Community Star',
        image: '/images/badges/star.png',
        color: 'bg-amber-500',
        bg: 'bg-amber-50',
        progress: 7,
        max: 10,
        description: 'Participate in community events'
    },
    {
        id: '2',
        name: 'Green Warrior',
        image: '/images/badges/leaf.png',
        color: 'bg-emerald-500',
        bg: 'bg-emerald-50',
        progress: 2,
        max: 3,
        description: 'Join environment focused drives'
    },
    {
        id: '3',
        name: 'Time Keeper',
        image: '/images/badges/time.png',
        color: 'bg-blue-500',
        bg: 'bg-blue-50',
        progress: 48,
        max: 50,
        description: 'Accumulate volunteer hours'
    },
    {
        id: '4',
        name: 'Social Butterfly',
        image: '/images/badges/social.png',
        color: 'bg-purple-500',
        bg: 'bg-purple-50',
        progress: 4,
        max: 10,
        description: 'Attend networking meetups'
    },
];

export default function ProfilePage() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState(DEFAULT_USER);
    const [activeTab, setActiveTab] = useState('overview');
    const [historyView, setHistoryView] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const fetchProfile = async () => {
            if (session?.user) {
                // Determine joined date from session or current date if not available
                // Ideally this comes from backend too, checking /api/user/profile
                try {
                    const res = await fetch('http://localhost:8000/user/profile', {
                        headers: {
                            // Assuming Authorization header is handled or we rely on session.
                            // Since frontend is Next.js and backend is FastAPI, we likely need to pass the token.
                            // For now, let's assume we use session.user info which comes from OAuth.
                            // And if we need backend data, we might need a proxy or token.
                            // IMPORTANT: The existing code uses /api/ proxy in some places, OR direct 8000.
                            // The user said "sync it with oauth data".
                            // Let's rely on session.user first for basic info.
                        }
                    });
                    // Note: If authentication is needed for backend, we need the token.
                    // Assuming for now session has what we need fundamentally.
                } catch (e) {
                    // ignore
                }

                setProfile(prev => ({
                    ...prev,
                    name: session.user?.name || prev.name,
                    email: session.user?.email || prev.email,
                    avatar: session.user?.image || prev.avatar,
                    // If we successfully fetched backend data, we'd merge it here.
                    // For now, syncing with OAuth means using session data.
                }));
            }
        };
        fetchProfile();
    }, [session]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'On Time': return 'bg-emerald-100 text-emerald-800';
            case 'Late': return 'bg-amber-100 text-amber-800';
            case 'Absent': return 'bg-gray-200 text-gray-600';
            case 'approved': return 'bg-green-100 text-green-700';
            case 'registered': return 'bg-blue-100 text-blue-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'volunteer': return Heart;
            case 'meetup': return Users;
            case 'conference': return Ticket;
            default: return Calendar;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'volunteer': return 'bg-green-100 text-green-600';
            case 'meetup': return 'bg-blue-100 text-blue-600';
            case 'conference': return 'bg-purple-100 text-purple-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Unified Light Profile Card */}
            <div className="bg-white rounded-[30px] p-8 text-gray-900 relative overflow-hidden shadow-sm border border-gray-100">
                {/* Header Row: Title & Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-emerald-500 rounded-full"></div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Volunteer Details</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-600 transition-colors border border-gray-200">
                            This Year <ChevronRight size={14} className="rotate-90" />
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-md transform hover:-translate-y-0.5">
                            <ArrowDownToLine size={16} />
                            Download Info
                        </button>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all border border-red-200"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Main Info Section */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
                    {/* Avatar */}
                    <div className="relative group shrink-0">
                        <div className="w-28 h-28 rounded-full p-1 bg-white border border-gray-100 shadow-md">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={profile.avatar}
                                alt={profile.name}
                                className="w-full h-full rounded-full object-cover bg-gray-50"
                            />
                        </div>
                        <button className="absolute bottom-0 right-0 p-2 bg-emerald-500 rounded-full text-white shadow-lg hover:bg-emerald-600 transition-colors border-2 border-white">
                            <Edit3 size={14} />
                        </button>
                    </div>

                    {/* Details Grid */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-12 w-full text-center md:text-left">
                        {/* Name & Role */}
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Role</p>
                                    <p className="text-lg font-medium text-gray-700">Senior Volunteer</p>
                                </div>
                            </div>
                        </div>

                        {/* Contact 1 */}
                        <div>
                            <div className="h-[43px] hidden md:block"></div> {/* Spacer to align with Name */}
                            <div>
                                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Phone Number</p>
                                <p className="text-lg font-medium text-gray-700 font-mono">{profile.phone || 'Not set'}</p>
                            </div>
                        </div>

                        {/* Contact 2 */}
                        <div>
                            <div className="h-[43px] hidden md:block"></div> {/* Spacer to align with Name */}
                            <div>
                                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Email Address</p>
                                <p className="text-lg font-medium text-gray-700 truncate" title={profile.email}>{profile.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Row (Light Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stat 1: Total Events */}
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-100 transition-colors border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Calendar size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold text-gray-900">{MOCK_STATS.totalEvents}</h4>
                            <p className="text-xs text-gray-500 font-medium">Total Events</p>
                        </div>
                    </div>

                    {/* Stat 2: Volunteer */}
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-100 transition-colors border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <Heart size={20} className="text-green-600" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold text-gray-900">{MOCK_STATS.volunteerEvents}</h4>
                            <p className="text-xs text-gray-500 font-medium">Volunteer</p>
                        </div>
                    </div>

                    {/* Stat 3: Meetups */}
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-100 transition-colors border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                            <Users size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold text-gray-900">{MOCK_STATS.meetups}</h4>
                            <p className="text-xs text-gray-500 font-medium">Meetups</p>
                        </div>
                    </div>

                    {/* Stat 4: Volunteer Hrs */}
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-100 transition-colors border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                            <Clock size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold text-gray-900">{MOCK_STATS.totalHours}</h4>
                            <p className="text-xs text-gray-500 font-medium">Volunteer Hrs</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column: Navigation & Quick Info */}
                <div className="w-full lg:w-1/4 space-y-6">
                    <nav className="flex lg:flex-col gap-1 p-1.5 bg-gray-100 rounded-2xl sticky top-24 z-20 overflow-x-auto">
                        {[
                            { id: 'overview', label: 'Overview', icon: Star },
                            { id: 'history', label: 'History', icon: Clock },
                            { id: 'applications', label: 'Applications', icon: CheckCircle },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap lg:whitespace-normal ${activeTab === tab.id
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* Resume Card */}
                    <Link
                        href="/profile/volunteer-resume"
                        className="block bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[20px] p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-900">Volunteer Resume</h3>
                            <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                <ChevronRight size={16} className="text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                            Your verified profile for volunteer work applications.
                        </p>
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide">
                            <span className="px-2 py-1 bg-white text-emerald-700 rounded-lg shadow-sm">
                                3 Skills
                            </span>
                            <span className="px-2 py-1 bg-white text-emerald-700 rounded-lg shadow-sm">
                                48 Hours
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Right Column: Tab Content */}
                <div className="w-full lg:w-3/4">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Achievements / Badges */}
                                <div className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-gray-900">Achievements in Progress</h3>
                                        <Link href="/achievements" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                                            View All
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {MOCK_BADGES.map((badge) => (
                                            <div
                                                key={badge.id}
                                                className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all group"
                                            >
                                                {/* Large Icon Container */}
                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${badge.bg} border border-gray-100 shadow-sm overflow-hidden`}>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={badge.image} alt={badge.name} className="w-12 h-12 object-contain drop-shadow-sm transform group-hover:scale-110 transition-transform duration-500" />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <h4 className="font-bold text-gray-900 truncate pr-2 text-lg">{badge.name}</h4>
                                                        <span className={`text-sm font-bold ${badge.color.replace('bg-', 'text-')}`}>
                                                            {badge.progress}/{badge.max}
                                                        </span>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-1.5">
                                                        <div
                                                            className={`h-full rounded-full ${badge.color} transition-all duration-1000 ease-out`}
                                                            style={{ width: `${(badge.progress / badge.max) * 100}%` }}
                                                        ></div>
                                                    </div>

                                                    <p className="text-xs text-gray-500 font-medium truncate">{badge.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Upcoming */}
                                <div className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-gray-900">Upcoming Schedule</h3>
                                        <Link href="/events" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                            Find more
                                        </Link>
                                    </div>
                                    <div className="space-y-3">
                                        {MOCK_UPCOMING.map((event) => {
                                            const CategoryIcon = getCategoryIcon(event.category);
                                            return (
                                                <div
                                                    key={event.id}
                                                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors group cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-sm ${getCategoryColor(event.category).replace('bg-', 'text-')}`}>
                                                            <div className={`absolute w-12 h-12 rounded-xl opacity-10 ${getCategoryColor(event.category)}`}></div>
                                                            <CategoryIcon size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{event.title}</h4>
                                                            <p className="text-xs text-gray-500 font-medium">{event.date}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(event.status)}`}>
                                                        {event.status}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm">
                                {/* Header with Controls */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                        <h3 className="text-xl font-bold text-gray-900">Attendance History</h3>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setHistoryView(historyView === 'grid' ? 'list' : 'grid')}
                                            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                            title="Toggle View"
                                        >
                                            {historyView === 'grid' ? <List size={20} /> : <LayoutGrid size={20} />}
                                        </button>
                                        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                            <ArrowUpDown size={16} />
                                            Sort
                                        </button>
                                        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                            <SlidersHorizontal size={16} />
                                            Filter
                                        </button>
                                    </div>
                                </div>

                                {/* History Grid */}
                                <div className={`grid gap-4 ${historyView === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                    {MOCK_EVENT_HISTORY.map((event) => (
                                        <div
                                            key={event.id}
                                            className="relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col h-full border border-gray-100"
                                        >
                                            {/* Notches */}
                                            <div className="absolute top-[60%] -left-3 w-6 h-6 bg-white rounded-full border-r border-gray-100 z-20" />
                                            <div className="absolute top-[60%] -right-3 w-6 h-6 bg-white rounded-full border-l border-gray-100 z-20" />

                                            {/* Main Content (Top) - with Image Background */}
                                            <div className="relative h-[60%] min-h-[180px]">
                                                {/* Background Image */}
                                                <div className="absolute inset-0">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={event.image}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                    {/* Gradient Overlay for Text Readability */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
                                                </div>

                                                <div className="relative p-5 h-full flex flex-col justify-between z-10 text-white">
                                                    {/* Header: Date & Status */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-white/90 text-xs font-medium uppercase tracking-wide bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                                                            <Calendar size={12} className="text-white/80" />
                                                            {event.date}
                                                        </div>
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border border-white/20 backdrop-blur-md shadow-sm ${event.status === 'On Time' ? 'bg-emerald-500/80 text-white' :
                                                            event.status === 'Late' ? 'bg-amber-500/80 text-white' :
                                                                'bg-gray-500/80 text-white'
                                                            }`}>
                                                            {event.status}
                                                        </span>
                                                    </div>

                                                    {/* Title & Location */}
                                                    <div>
                                                        <h3 className="font-extrabold text-white text-xl leading-tight mb-2 text-shadow-sm group-hover:text-emerald-300 transition-colors line-clamp-2">
                                                            {event.title}
                                                        </h3>
                                                        <div className="flex items-start gap-1.5 text-xs text-white/90 font-medium">
                                                            <MapPin size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                                            <span className="line-clamp-1">{event.location}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="relative flex items-center justify-center bg-white">
                                                <div className="w-full border-t-2 border-dashed border-gray-200 mx-1"></div>
                                            </div>

                                            {/* Stub Content (Bottom) */}
                                            <div className="p-4 bg-white flex justify-between items-center relative flex-1">
                                                <div>
                                                    <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Check In</p>
                                                    <p className="text-xl font-bold text-gray-900 font-mono tracking-tight">{event.checkIn}</p>
                                                </div>
                                                {/* Barcode decoration (visual only) */}
                                                <div className="h-8 w-px bg-gray-200 mx-auto hidden sm:block opacity-50"></div>
                                                <div>
                                                    <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-0.5 text-right">Check Out</p>
                                                    <p className="text-xl font-bold text-gray-900 font-mono tracking-tight text-right">{event.checkOut}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="flex justify-center items-center gap-2 mt-8">
                                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-bold shadow-sm">1</button>
                                    {[2, 3, 4].map(page => (
                                        <button key={page} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors">
                                            {page}
                                        </button>
                                    ))}
                                    <span className="text-gray-400 text-xs">...</span>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors">8</button>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors">9</button>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors">10</button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'applications' && (
                            <div className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Clock size={32} className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">No Pending Applications</h3>
                                <p className="text-gray-500 text-sm max-w-xs mt-2">
                                    You have no pending volunteer or event applications at the moment.
                                </p>
                                <Link
                                    href="/events"
                                    className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-full font-semibold text-sm hover:bg-indigo-700 transition-colors"
                                >
                                    Browse Events
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

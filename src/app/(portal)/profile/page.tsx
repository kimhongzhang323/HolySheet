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
import { VOLUNTEER_ACTIVITIES, USER_ASSIGNMENTS, USER_APPLICATIONS } from '@/lib/mockData';
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
// Initial stats state
const INITIAL_STATS = {
    volunteerEvents: 0,
    totalHours: 0,
    upcomingEvents: 5, // Keep mock for now
    pendingApplications: 2, // Keep mock for now
};

// Mock event history - Volunteer only
const MOCK_EVENT_HISTORY = [
    {
        id: '1',
        title: 'Beach Cleanup',
        organization: 'Green Earth Foundation',
        location: 'East Coast Park, Area B',
        date: 'March 08 2023',
        hours: 4,
        status: 'On Time',
        checkIn: '08:53',
        checkOut: '17:15',
        category: 'volunteer',
        type: 'Environment',
        image: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&q=80',
    },
    {
        id: '2',
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
];

export default function ProfilePage() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState(DEFAULT_USER);
    const [stats, setStats] = useState(INITIAL_STATS);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [historyEvents, setHistoryEvents] = useState<any[]>([]);
    const [achievements, setAchievements] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
    const [isUpcomingOpen, setIsUpcomingOpen] = useState(false);
    const [historyView, setHistoryView] = useState<'grid' | 'list'>('grid');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
    const [pendingApplications, setPendingApplications] = useState<any[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;
    const totalPages = Math.max(1, Math.ceil(historyEvents.length / ITEMS_PER_PAGE));
    const paginatedHistory = historyEvents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!session?.user) return;

            try {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 600));

                // 1. Stats & Profile Info - Mocked
                setStats(prev => ({
                    ...prev,
                    volunteerEvents: USER_ASSIGNMENTS.length,
                    totalHours: 12, // Hardcoded for demo
                }));
                // In a real app we'd merge session user with DB user. Here just use session.
                setProfile(prev => ({
                    ...prev,
                    name: session.user?.name || prev.name,
                    email: session.user?.email || prev.email,
                    avatar: session.user?.image || prev.avatar,
                    skills: ['Teamwork', 'Communication'] // Mock skills
                }));
                setAchievements(MOCK_BADGES); // Use the static mock badges for now

                // 2. Upcoming Activities & History
                // Split USER_ASSIGNMENTS into upcoming vs history relative to now
                const now = new Date();

                // For demo purposes, let's just split the static USER_ASSIGNMENTS or use them as is.
                // Assuming USER_ASSIGNMENTS are 'tasks' or 'activities'.
                // Let's rely on date fields if they exist, or just arbitrary split.

                // We'll treat USER_ASSIGNMENTS as confirmed upcoming for now for simplicity
                const allAssignments = USER_ASSIGNMENTS.map((item: any) => {
                    // Find full activity details if possible
                    const actDetails = VOLUNTEER_ACTIVITIES.find((v: any) => v.id === item.id || v._id === item.id) || {};
                    return { ...item, ...actDetails };
                });

                const upcoming = allAssignments.slice(0, 3).map((item: any) => ({
                    ...item,
                    status: 'confirmed',
                    activity: {
                        title: item.title,
                        start_time: item.date || item.start_time,
                        image_url: item.image || item.image_url
                    }
                }));

                setUpcomingEvents(upcoming);

                // Mock history separately since USER_ASSIGNMENTS might be sparse
                const history = MOCK_EVENT_HISTORY.map(h => ({
                    ...h,
                    activity: {
                        title: h.title,
                        location: h.location,
                        start_time: h.date, // loose mapping
                        image_url: h.image
                    }
                }));
                setHistoryEvents(history);


                // 3. Applications
                const dynamicApps = USER_APPLICATIONS.map((app: any) => ({
                    id: app.id,
                    title: app.title,
                    location: 'Singapore', // Mock
                    date: app.date || 'TBD',
                    status: app.status,
                    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=400&fit=crop'
                }));
                setPendingApplications(dynamicApps);

            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
        };

        fetchAllData();
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
        return Heart;
    };

    const getCategoryColor = (category: string) => {
        return 'bg-green-100 text-green-600';
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
                        <Link
                            href="/profile/edit"
                            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold transition-all border border-gray-200 shadow-sm"
                        >
                            <Edit3 size={16} />
                            Edit Profile
                        </Link>
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
                <div>
                    {/* Mobile Header for Stats */}
                    <div
                        className="flex md:hidden items-center justify-between mb-4 cursor-pointer"
                        onClick={() => setIsStatsOpen(!isStatsOpen)}
                    >
                        <h3 className="text-lg font-bold text-gray-900">Overview Stats</h3>
                        <ChevronRight size={20} className={`text-gray-400 transition-transform duration-200 ${isStatsOpen ? 'rotate-90' : ''}`} />
                    </div>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${isStatsOpen ? '' : 'hidden md:grid'}`}>
                        {/* Stat 1: Volunteer */}
                        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-100 transition-colors border border-gray-100">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Heart size={20} className="text-green-600" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-gray-900">{stats.volunteerEvents}</h4>
                                <p className="text-xs text-gray-500 font-medium">Volunteer</p>
                            </div>
                        </div>

                        {/* Stat 2: Volunteer Hrs */}
                        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-100 transition-colors border border-gray-100">
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                <Clock size={20} className="text-orange-600" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-gray-900">{stats.totalHours}</h4>
                                <p className="text-xs text-gray-500 font-medium">Volunteer Hrs</p>
                            </div>
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
                                {(profile as any).skills?.length || 0} Skills
                            </span>
                            <span className="px-2 py-1 bg-white text-emerald-700 rounded-lg shadow-sm">
                                {stats.totalHours} Hours
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
                                {/* Achievements section */}
                                <div className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm">
                                    <div
                                        className="flex items-center justify-between mb-4 md:mb-6 cursor-pointer md:cursor-default"
                                        onClick={() => setIsAchievementsOpen(!isAchievementsOpen)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold text-gray-900">Achievements in Progress</h3>
                                            <ChevronRight size={20} className={`text-gray-400 md:hidden transition-transform duration-200 ${isAchievementsOpen ? 'rotate-90' : ''}`} />
                                        </div>
                                        <Link href="/achievements" className="hidden md:block text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                                            View All
                                        </Link>
                                    </div>
                                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isAchievementsOpen ? '' : 'hidden md:grid'}`}>
                                        {achievements.length === 0 && (
                                            <div className="col-span-2 text-center py-8 text-gray-500 text-sm">
                                                No achievements yet. Start volunteering to earn badges!
                                            </div>
                                        )}
                                        {achievements.map((badge: any, idx: number) => (
                                            <div key={idx} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all group">
                                                <Award className="text-blue-500 shrink-0" size={24} />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 truncate pr-2 text-lg">{badge.title || badge.name || 'Badge'}</h4>
                                                    <p className="text-xs text-gray-500 font-medium truncate">{badge.description || 'Awarded for volunteering.'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Upcoming Schedule section */}
                                <div className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm">
                                    <div
                                        className="flex items-center justify-between mb-4 md:mb-6 cursor-pointer md:cursor-default"
                                        onClick={() => setIsUpcomingOpen(!isUpcomingOpen)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold text-gray-900">Upcoming Schedule</h3>
                                            <ChevronRight size={20} className={`text-gray-400 md:hidden transition-transform duration-200 ${isUpcomingOpen ? 'rotate-90' : ''}`} />
                                        </div>
                                        <Link href="/events" className="hidden md:block text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                            Find more
                                        </Link>
                                    </div>
                                    <div className={`space-y-3 ${isUpcomingOpen ? '' : 'hidden md:block'}`}>
                                        {upcomingEvents.length === 0 && (
                                            <div className="text-center py-4 text-gray-500 text-sm">No upcoming activities.</div>
                                        )}
                                        {upcomingEvents.map((event: any, idx: number) => (
                                            <div key={event.id || idx} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors group cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-sm text-green-600">
                                                        <Calendar size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{event.activity?.title || 'Unknown Event'}</h4>
                                                        <p className="text-xs text-gray-500 font-medium">
                                                            {event.activity?.start_time ? new Date(event.activity.start_time).toLocaleDateString() : '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(event.status)}`}>
                                                    {event.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm">
                                {/* Header with Controls */}
                                <div
                                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 cursor-pointer md:cursor-default"
                                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                >
                                    <div className="flex items-center justify-between w-full md:w-auto">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                            <h3 className="text-xl font-bold text-gray-900">Attendance History</h3>
                                        </div>
                                        <ChevronRight size={20} className={`text-gray-400 md:hidden transition-transform duration-200 ${isHistoryOpen ? 'rotate-90' : ''}`} />
                                    </div>

                                    <div className={`flex items-center gap-2 ${isHistoryOpen ? '' : 'hidden md:flex'}`}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setHistoryView(historyView === 'grid' ? 'list' : 'grid'); }}
                                            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                            title="Toggle View"
                                        >
                                            {historyView === 'grid' ? <List size={20} /> : <LayoutGrid size={20} />}
                                        </button>
                                        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={(e) => e.stopPropagation()}>
                                            <ArrowUpDown size={16} />
                                            Sort
                                        </button>
                                        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={(e) => e.stopPropagation()}>
                                            <SlidersHorizontal size={16} />
                                            Filter
                                        </button>
                                    </div>
                                </div>

                                {/* History Grid */}
                                <div className={`grid gap-4 ${isHistoryOpen ? '' : 'hidden md:grid'} ${historyView === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                    {paginatedHistory.length === 0 && (
                                        <div className="col-span-full text-center py-8 text-gray-500">No past activities found.</div>
                                    )}
                                    {paginatedHistory.map((event: any, index: number) => (
                                        <div
                                            key={event.id || `history-${index}`}
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
                                {totalPages > 0 && (
                                    <div className={`flex justify-center items-center gap-2 mt-8 ${isHistoryOpen ? '' : 'hidden md:flex'}`}>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all shadow-sm ${currentPage === page
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'applications' && (
                            <div className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm">
                                {/* Header for Applications */}
                                <div
                                    className="flex items-center justify-between mb-8 cursor-pointer md:cursor-default"
                                    onClick={() => setIsApplicationsOpen(!isApplicationsOpen)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                        <h3 className="text-xl font-bold text-gray-900">Your Applications</h3>
                                    </div>
                                    <ChevronRight size={20} className={`text-gray-400 md:hidden transition-transform duration-200 ${isApplicationsOpen ? 'rotate-90' : ''}`} />
                                </div>
                                <div className={`min-h-[400px] flex flex-col items-center justify-center text-center ${isApplicationsOpen ? 'flex' : 'hidden md:flex'}`}>
                                    {pendingApplications.length === 0 ? (
                                        <>
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <Clock size={32} className="text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">No Pending Applications</h3>
                                            <p className="text-gray-500 text-sm max-w-xs mt-2">
                                                You have no pending volunteer or event applications at the moment.
                                            </p>
                                        </>
                                    ) : (
                                        <div className="w-full space-y-4 text-left">
                                            {pendingApplications.map((app, index) => (
                                                <div key={app.id || `app-${index}`} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm overflow-hidden shrink-0">
                                                            <img src={app.image} className="w-full h-full object-cover" alt={app.title} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 leading-tight">{app.title}</h4>
                                                            <p className="text-xs text-gray-500 font-medium">{app.date} • {app.location}</p>
                                                        </div>
                                                    </div>
                                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700">
                                                        {app.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Link
                                        href="/events"
                                        className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-full font-semibold text-sm hover:bg-indigo-700 transition-colors"
                                    >
                                        Browse Events
                                    </Link>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

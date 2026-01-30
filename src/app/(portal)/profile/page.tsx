'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut, useSession } from "next-auth/react";
import { motion } from 'framer-motion';
import {
    Calendar, Heart, Clock, Award, MapPin, Mail,
    Edit3, ChevronRight, Star, TrendingUp, Users, CheckCircle, Ticket,
    LayoutGrid, List, SlidersHorizontal, ArrowUpDown, ArrowDownToLine, LogOut, QrCode, X, ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';

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
    const router = useRouter();
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
    const [selectedApplication, setSelectedApplication] = useState<any>(null);

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
                        start_time: item.start_time || item.date, // Prefer start_time (ISO format) over date (human-readable)
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
                    image: app.image || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=400&fit=crop'
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

                {/* Gamified Tier Progression */}
                <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-3xl p-6 relative overflow-hidden border border-gray-200 shadow-sm">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-100/50 to-transparent rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-100/50 to-transparent rounded-full blur-2xl" />

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <Award size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Current Tier</p>
                                    <h3 className="text-xl font-black text-gray-900">Silver Volunteer</h3>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black text-emerald-600">{stats.totalHours}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Hours Logged</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-500">Progress to <span className="text-amber-600">Gold Volunteer</span></span>
                                <span className="text-xs font-black text-emerald-600">{Math.min(100, Math.round((stats.totalHours / 50) * 100))}%</span>
                            </div>
                            <div className="h-4 bg-gray-200 rounded-full overflow-hidden border border-gray-300/50">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (stats.totalHours / 50) * 100)}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/30 rounded-full" />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg animate-pulse" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Tier Milestones */}
                        <div className="flex items-center justify-between text-[10px] font-bold">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-gray-300" />
                                <span className="text-gray-500">Bronze</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 border-2 border-gray-500 shadow-sm" />
                                <span className="text-gray-800 font-black">Silver</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-amber-400/50 border-2 border-amber-500/50" />
                                <span className="text-amber-600">Gold</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-purple-400/30 border-2 border-purple-400/40" />
                                <span className="text-purple-500">Platinum</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column: Navigation & Quick Info */}
                <div className="w-full lg:w-1/4 space-y-6 relative">
                    <nav className="flex lg:flex-col gap-1 p-1.5 bg-gray-100 rounded-2xl lg:sticky lg:top-24 z-20 overflow-x-auto">
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

                    {/* Resume Card - Hidden on mobile */}
                    <Link
                        href="/profile/volunteer-resume"
                        className="hidden lg:block bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[20px] p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all group"
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
                                <div className={`${isApplicationsOpen ? 'block' : 'hidden md:block'}`}>
                                    {pendingApplications.length === 0 ? (
                                        <div className="min-h-[300px] flex flex-col items-center justify-center text-center">
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
                                    ) : (
                                        <>
                                            <div className="w-full space-y-4">
                                                {pendingApplications.map((app, index) => (
                                                    <div
                                                        key={app.id || `app-${index}`}
                                                        onClick={() => setSelectedApplication(app)}
                                                        className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 hover:border-gray-200 transition-all group cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm overflow-hidden shrink-0">
                                                                <img src={app.image} className="w-full h-full object-cover" alt={app.title} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">{app.title}</h4>
                                                                <p className="text-xs text-gray-500 font-medium">{app.date} • {app.location}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${app.status === 'Approved'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-center mt-6">
                                                <Link
                                                    href="/events"
                                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-semibold text-sm hover:bg-indigo-700 transition-colors"
                                                >
                                                    Browse Events
                                                </Link>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Application Detail Modal with QR Code */}
            <AnimatePresence>
                {selectedApplication && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedApplication(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Header Image */}
                            <div className="relative h-40 overflow-hidden">
                                <img
                                    src={selectedApplication.image}
                                    alt={selectedApplication.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <button
                                    onClick={() => setSelectedApplication(null)}
                                    className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                                <div className="absolute bottom-4 left-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${selectedApplication.status === 'Approved'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-amber-500 text-white'
                                        }`}>
                                        {selectedApplication.status}
                                    </span>
                                </div>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedApplication.title}</h2>
                                    <p className="text-sm text-gray-500">{selectedApplication.date} • {selectedApplication.location}</p>
                                </div>

                                {/* QR Code Section - Only for Approved */}
                                {selectedApplication.status === 'Approved' ? (
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 text-center">
                                        <div className="flex items-center justify-center gap-2 mb-4">
                                            <QrCode className="text-emerald-600" size={20} />
                                            <h3 className="font-bold text-emerald-800">Your Check-In QR Code</h3>
                                        </div>
                                        {/* Clean QR Code using react-qr-code */}
                                        <div className="bg-white p-4 rounded-2xl inline-block shadow-lg border border-emerald-100">
                                            <QRCode
                                                value={JSON.stringify({
                                                    applicationId: selectedApplication.id,
                                                    eventId: selectedApplication.eventId,
                                                    title: selectedApplication.title,
                                                    status: selectedApplication.status
                                                })}
                                                size={160}
                                                level="H"
                                                className="w-full h-full"
                                            />
                                        </div>
                                        <p className="text-xs text-emerald-600 mt-4 font-medium">
                                            ID: {selectedApplication.id}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-2">
                                            Show this QR code at the event for check-in
                                        </p>

                                        {/* Add to Wallet Buttons */}
                                        <div className="flex flex-col gap-2 mt-5">
                                            {/* Add to Apple Wallet Button */}
                                            <button
                                                onClick={() => {
                                                    // In production, this would generate and download a .pkpass file
                                                    alert('Your ticket has been added to Apple Wallet! (Demo)');
                                                }}
                                                className="flex items-center justify-center gap-2 py-3 px-4 bg-black text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors group"
                                            >
                                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                                </svg>
                                                Add to Apple Wallet
                                            </button>

                                            {/* Add to Google Wallet Button */}
                                            <button
                                                onClick={() => {
                                                    // In production, this would redirect to Google Wallet API
                                                    alert('Your ticket has been added to Google Wallet! (Demo)');
                                                }}
                                                className="flex items-center justify-center gap-2 py-3 px-4 bg-white text-gray-800 rounded-xl font-medium text-sm border border-gray-200 hover:bg-gray-50 transition-colors group"
                                            >
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                </svg>
                                                Add to Google Wallet
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 text-center">
                                        <Clock className="text-amber-500 mx-auto mb-3" size={32} />
                                        <h3 className="font-bold text-amber-800 mb-2">Application Pending</h3>
                                        <p className="text-sm text-amber-700">
                                            Your application is being reviewed. You'll receive a QR code once approved.
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            const eventId = selectedApplication.eventId || selectedApplication.id;
                                            setSelectedApplication(null);
                                            router.push(`/events/${eventId}`);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
                                    >
                                        <ExternalLink size={16} />
                                        View Event Details
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

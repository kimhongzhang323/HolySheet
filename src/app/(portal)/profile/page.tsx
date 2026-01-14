'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Calendar, Heart, Clock, Award, MapPin, Mail,
    Edit3, ChevronRight, Star, TrendingUp, Users, CheckCircle, Ticket
} from 'lucide-react';

// Mock user data
const MOCK_USER = {
    name: 'Kim Hong Zhang',
    email: 'kimhongzhang@example.com',
    phone: '+65 9123 4567',
    location: 'Singapore',
    joinedDate: 'January 2025',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    bio: 'Passionate about making a difference in the community. Love organizing events and helping others.',
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
        date: '15 Dec 2025',
        hours: 4,
        status: 'completed',
        category: 'volunteer',
        type: 'Environment',
    },
    {
        id: '2',
        title: 'Tech Meetup',
        organization: 'Singapore Dev Community',
        date: '12 Dec 2025',
        hours: 3,
        status: 'completed',
        category: 'meetup',
        type: 'Tech',
    },
    {
        id: '3',
        title: 'Music Festival',
        organization: 'Live Nation',
        date: '08 Dec 2025',
        hours: 6,
        status: 'completed',
        category: 'conference',
        type: 'Music',
    },
    {
        id: '4',
        title: 'Food Distribution',
        organization: 'Community Kitchen',
        date: '10 Dec 2025',
        hours: 5,
        status: 'completed',
        category: 'volunteer',
        type: 'Community',
    },
    {
        id: '5',
        title: 'Startup Summit',
        organization: 'TechCrunch',
        date: '01 Dec 2025',
        hours: 8,
        status: 'completed',
        category: 'conference',
        type: 'Business',
    },
    {
        id: '6',
        title: 'Book Club Meetup',
        organization: 'Reading Society',
        date: '28 Nov 2025',
        hours: 2,
        status: 'completed',
        category: 'meetup',
        type: 'Education',
    },
    {
        id: '7',
        title: 'Teaching Workshop',
        organization: 'CodeForGood',
        date: '25 Nov 2025',
        hours: 3,
        status: 'completed',
        category: 'volunteer',
        type: 'Education',
    },
    {
        id: '8',
        title: 'Art Exhibition',
        organization: 'National Gallery',
        date: '20 Nov 2025',
        hours: 3,
        status: 'completed',
        category: 'conference',
        type: 'Art',
    },
];

// Mock upcoming events
const MOCK_UPCOMING = [
    {
        id: '1',
        title: 'Beach Cleanup',
        date: '18 Jan 2026',
        status: 'approved',
        category: 'volunteer',
    },
    {
        id: '2',
        title: 'Tech Meetup',
        date: '22 Jan 2026',
        status: 'registered',
        category: 'meetup',
    },
    {
        id: '3',
        title: 'Food Drive',
        date: '25 Jan 2026',
        status: 'pending',
        category: 'volunteer',
    },
    {
        id: '4',
        title: 'Music Festival',
        date: '27 Jan 2026',
        status: 'registered',
        category: 'conference',
    },
    {
        id: '5',
        title: 'Book Club',
        date: '28 Jan 2026',
        status: 'registered',
        category: 'meetup',
    },
];

// Mock badges/achievements
const MOCK_BADGES = [
    { id: '1', name: 'First Timer', icon: Star, color: 'bg-yellow-100 text-yellow-600', earned: true },
    { id: '2', name: '5 Events', icon: Award, color: 'bg-blue-100 text-blue-600', earned: true },
    { id: '3', name: '20 Hours', icon: Clock, color: 'bg-green-100 text-green-600', earned: true },
    { id: '4', name: 'Team Player', icon: Users, color: 'bg-purple-100 text-purple-600', earned: true },
    { id: '5', name: '50 Hours', icon: TrendingUp, color: 'bg-gray-100 text-gray-400', earned: false },
    { id: '6', name: 'Legend', icon: Award, color: 'bg-gray-100 text-gray-400', earned: false },
];

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [historyFilter, setHistoryFilter] = useState('all');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
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

    const getCategoryBadgeColor = (category: string) => {
        switch (category) {
            case 'volunteer': return 'bg-green-100 text-green-700';
            case 'meetup': return 'bg-blue-100 text-blue-700';
            case 'conference': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Filter event history
    const filteredHistory = historyFilter === 'all'
        ? MOCK_EVENT_HISTORY
        : MOCK_EVENT_HISTORY.filter(e => e.category === historyFilter);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm"
            >
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-pink-500 p-0.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={MOCK_USER.avatar}
                                alt={MOCK_USER.name}
                                className="w-full h-full rounded-2xl object-cover bg-white"
                            />
                        </div>
                        <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            <Edit3 size={14} className="text-gray-600" />
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">{MOCK_USER.name}</h1>
                        <p className="text-gray-500 mb-3">{MOCK_USER.bio}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                                <Mail size={14} />
                                {MOCK_USER.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MapPin size={14} />
                                {MOCK_USER.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar size={14} />
                                Joined {MOCK_USER.joinedDate}
                            </span>
                        </div>
                    </div>

                    {/* Edit Profile Button */}
                    <Link
                        href="/profile/edit"
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                    >
                        Edit Profile
                    </Link>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-5 gap-4"
            >
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-blue-100 rounded-xl">
                            <Calendar size={20} className="text-blue-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{MOCK_STATS.totalEvents}</p>
                    <p className="text-sm text-gray-500">Total Events</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-green-100 rounded-xl">
                            <Heart size={20} className="text-green-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{MOCK_STATS.volunteerEvents}</p>
                    <p className="text-sm text-gray-500">Volunteer</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-blue-100 rounded-xl">
                            <Users size={20} className="text-blue-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{MOCK_STATS.meetups}</p>
                    <p className="text-sm text-gray-500">Meetups</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-purple-100 rounded-xl">
                            <Ticket size={20} className="text-purple-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{MOCK_STATS.conferences}</p>
                    <p className="text-sm text-gray-500">Conferences</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-orange-100 rounded-xl">
                            <Clock size={20} className="text-orange-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{MOCK_STATS.totalHours}</p>
                    <p className="text-sm text-gray-500">Volunteer Hrs</p>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
                {['overview', 'history', 'applications'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${activeTab === tab
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Volunteer Resume Card */}
                        <Link
                            href="/profile/volunteer-resume"
                            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-bold text-gray-900">Volunteer Resume</h2>
                                <ChevronRight size={20} className="text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                            </div>
                            <p className="text-sm text-gray-600 mb-4">Your profile for volunteer applications</p>
                            <div className="flex gap-2 flex-wrap">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">3 Skills</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">3 Causes</span>
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">48 Hours</span>
                            </div>
                        </Link>

                        {/* Badges/Achievements */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Achievements</h2>
                            <div className="grid grid-cols-3 gap-3">
                                {MOCK_BADGES.map((badge) => (
                                    <div
                                        key={badge.id}
                                        className={`flex flex-col items-center p-3 rounded-xl ${badge.earned ? badge.color : 'bg-gray-50 opacity-50'
                                            }`}
                                    >
                                        <badge.icon size={24} />
                                        <span className="text-xs font-medium mt-2 text-center">{badge.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Upcoming Events */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
                                <button className="text-sm text-orange-500 font-medium hover:text-orange-600">
                                    View all
                                </button>
                            </div>
                            <div className="space-y-3">
                                {MOCK_UPCOMING.map((event) => {
                                    const CategoryIcon = getCategoryIcon(event.category);
                                    return (
                                        <div
                                            key={event.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${getCategoryColor(event.category)}`}>
                                                    <CategoryIcon size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                                                    <p className="text-xs text-gray-500">{event.date}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(event.status)}`}>
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
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Event History</h2>

                            {/* Filter Tabs */}
                            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'volunteer', label: 'Volunteer' },
                                    { id: 'meetup', label: 'Meetups' },
                                    { id: 'conference', label: 'Events' },
                                ].map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setHistoryFilter(filter.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${historyFilter === filter.id
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredHistory.map((event, index) => {
                                const CategoryIcon = getCategoryIcon(event.category);
                                return (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer"
                                    >
                                        <div className={`p-3 rounded-xl ${getCategoryColor(event.category)}`}>
                                            <CategoryIcon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getCategoryBadgeColor(event.category)}`}>
                                                    {event.category}
                                                </span>
                                                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600">
                                                    {event.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">{event.organization}</p>
                                        </div>
                                        <div className="text-right">
                                            {event.category === 'volunteer' && (
                                                <p className="font-semibold text-green-600">{event.hours} hrs</p>
                                            )}
                                            <p className="text-xs text-gray-500">{event.date}</p>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-400" />
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Summary Section */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Heart size={18} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-green-800">{MOCK_STATS.volunteerEvents}</p>
                                        <p className="text-xs text-green-600">Volunteer Events</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Users size={18} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-blue-800">{MOCK_STATS.meetups}</p>
                                        <p className="text-xs text-blue-600">Meetups Attended</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Ticket size={18} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-purple-800">{MOCK_STATS.conferences}</p>
                                        <p className="text-xs text-purple-600">Conferences/Events</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'applications' && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">My Applications</h2>

                        {/* Pending Applications */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Pending ({MOCK_STATS.pendingApplications})</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-yellow-100 rounded-lg">
                                            <Clock size={18} className="text-yellow-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Food Drive</p>
                                            <p className="text-sm text-gray-500">Community Kitchen • 25 Jan 2026</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                                        PENDING REVIEW
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-yellow-100 rounded-lg">
                                            <Clock size={18} className="text-yellow-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Teaching Workshop</p>
                                            <p className="text-sm text-gray-500">CodeForGood • 01 Feb 2026</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                                        PENDING REVIEW
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Approved Applications */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Approved</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <CheckCircle size={18} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Beach Cleanup</p>
                                            <p className="text-sm text-gray-500">Green Earth Foundation • 18 Jan 2026</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                        APPROVED
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

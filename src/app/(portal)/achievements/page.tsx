'use client';
import Link from 'next/link';
import { ArrowLeft, Star, Heart, Clock, Users } from 'lucide-react';

// Mock badges/achievements with progress and images
const ALL_ACHIEVEMENTS = [
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
    // Add more mock data to fill the page
    {
        id: '5',
        name: 'Early Bird',
        image: '/images/badges/time.png',
        color: 'bg-orange-500',
        bg: 'bg-orange-50',
        progress: 1,
        max: 1,
        description: 'First to check in at an event'
    },
    {
        id: '6',
        name: 'Team Player',
        image: '/images/badges/social.png',
        color: 'bg-pink-500',
        bg: 'bg-pink-50',
        progress: 5,
        max: 5,
        description: 'Receive 5 kudos from organizers'
    },
];

export default function AchievementsPage() {
    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-0">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <Link href="/profile" className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
                    <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">All Achievements</h1>
                    <p className="text-gray-500">Track your progress and badges</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ALL_ACHIEVEMENTS.map((badge) => (
                    <div
                        key={badge.id}
                        className="bg-white border border-gray-100 p-6 rounded-[24px] flex flex-col gap-4 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden"
                    >
                        {/* Decorative Background Blur */}
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 ${badge.color} blur-2xl group-hover:opacity-20 transition-opacity`}></div>

                        <div className="flex items-center gap-5 relative z-10">
                            {/* Large Image Container */}
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 ${badge.bg} border-2 border-white shadow-lg shadow-gray-100`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={badge.image} alt={badge.name} className="w-16 h-16 object-contain drop-shadow-md transform group-hover:scale-110 transition-transform duration-500" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 truncate text-xl mb-1">{badge.name}</h4>
                                <p className="text-sm text-gray-500 font-medium leading-tight mb-2">{badge.description}</p>
                            </div>
                        </div>

                        {/* Progress Section */}
                        <div className="relative z-10 bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Progress</span>
                                <span className={`text-sm font-bold ${badge.color.replace('bg-', 'text-')}`}>
                                    {badge.progress}/{badge.max}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${badge.color} transition-all duration-1000 ease-out`}
                                    style={{ width: `${(badge.progress / badge.max) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

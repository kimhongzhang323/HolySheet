'use client';

import { useEffect, useState } from 'react';
import ActivityCard from '@/components/ActivityCard';
import TicketCard from '@/components/TicketCard';
import { MOCK_TICKETS, CALENDAR_DAYS } from '@/lib/mockData';
import { Sparkles, ChevronLeft, ChevronRight, User } from 'lucide-react';

interface Activity {
    _id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    needs_help?: boolean;
}

export default function PortalPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFeed() {
            try {
                const res = await fetch('/api/activities/feed');
                if (res.ok) {
                    const data = await res.json();
                    setActivities(data.activities);
                }
            } catch (error) {
                console.error('Failed to fetch feed', error);
            } finally {
                setLoading(false);
            }
        }

        fetchFeed();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* LEFT COLUMN: Tickets & Popular (Span 3/4) */}
            <div className="lg:col-span-4 space-y-8">
                {/* Tickets Section */}
                <section className="space-y-4">
                    {MOCK_TICKETS.map((ticket, idx) => (
                        <TicketCard key={idx} {...ticket} />
                    ))}
                </section>

                {/* Popular Event Section (Mock) */}
                <section>
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Popular Event</h2>
                            <p className="text-xs text-gray-500">Events selling fast—join the crowd!</p>
                        </div>
                        <button className="text-xs font-medium text-gray-400">See more</button>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Sparkles className="text-orange-500" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Art Exhibition</h3>
                                <p className="text-xs text-gray-500">June 10 • 4:00 PM</p>
                            </div>
                        </div>

                        <div className="h-32 bg-gray-100 rounded-xl mb-3 relative overflow-hidden">
                            {/* Map Placeholder */}
                            <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs font-mono">
                                MAP VIEW
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* MIDDLE/RIGHT COLUMN: Upcoming Events & Calendar (Span 8/9) */}
            <div className="lg:col-span-8 flex flex-col gap-8">

                {/* Upcoming Events Row */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Upcoming Event</h2>
                            <p className="text-sm text-gray-500">Don't miss out—get notified for your favorite upcoming events.</p>
                        </div>
                        <button className="text-sm font-medium text-gray-400 hover:text-gray-600">See more</button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-72 bg-gray-100 rounded-[20px] animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {/* Render Actual Activities */}
                            {activities.slice(0, 3).map((activity) => (
                                <ActivityCard key={activity._id} activity={activity} />
                            ))}
                            {/* Fillers if empty */}
                            {activities.length === 0 && (
                                <div className="col-span-full py-12 text-center text-gray-500 border border-dashed rounded-xl">
                                    No upcoming activities found.
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Bottom Row: Top Destinations & Calendar */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                    {/* Top Destinations (Span 7) */}
                    <section className="xl:col-span-7">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Top Destinations</h2>
                                <p className="text-xs text-gray-500">Top locations where unforgettable events happen.</p>
                            </div>
                            <button className="text-xs text-gray-400">See more</button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {/* Mock Destinations */}
                            {['Boston', 'Chicago', 'Atlanta'].map(city => (
                                <div key={city} className="h-24 rounded-xl bg-gray-200 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
                                    <span className="absolute bottom-2 left-3 text-white font-bold text-sm text-shadow">{city}</span>
                                </div>
                            ))}
                        </div>

                        {/* Japan Event Large Card (Simulated) */}
                        <div className="mt-6 flex gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-24 h-24 bg-blue-100 rounded-xl shrink-0"></div>
                            <div className="flex-1 py-1">
                                <div className="flex justify-between">
                                    <h3 className="font-bold text-gray-900">Japan Event</h3>
                                    <span className="text-xs text-gray-400">See more</span>
                                </div>
                                <div className="mt-2 space-y-1">
                                    <p className="text-xs text-gray-600"><span className="text-gray-400">20 May</span> The Weekend</p>
                                    <p className="text-xs text-gray-600"><span className="text-gray-400">22 May</span> Blackpink</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Calendar Widget (Span 5) */}
                    <section className="xl:col-span-5">
                        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <button className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={16} /></button>
                                <span className="font-bold text-gray-900">April 2026</span>
                                <button className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={16} /></button>
                            </div>

                            <div className="grid grid-cols-7 text-center gap-y-4 mb-4">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                    <span key={d} className="text-xs text-gray-400 font-medium">{d}</span>
                                ))}
                                {CALENDAR_DAYS.map((d, i) => (
                                    <button
                                        key={i}
                                        className={`text-xs w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors
                                        ${d.active ? 'bg-orange-500 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        {d.day}
                                    </button>
                                ))}
                                {/* Fillers */}
                                <span className="text-xs text-gray-300">10</span>
                                <span className="text-xs text-gray-300">11</span>
                            </div>

                            {/* Mini Event List */}
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                <div className="flex gap-3 items-start">
                                    <div className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded text-center min-w-[36px]">
                                        14<br />Tue
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 line-clamp-1">Urban Wellness Expo</p>
                                        <p className="text-[10px] text-gray-400">Riverside Center, Bangkok</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded text-center min-w-[36px]">
                                        18<br />Sun
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 line-clamp-1">Neon Nights Live</p>
                                        <p className="text-[10px] text-gray-400">The Glass Hall, Tokyo</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}

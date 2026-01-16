'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ActivityCard from '@/components/ActivityCard';
import TicketCard from '@/components/TicketCard';
import MiniCalendar from '@/components/MiniCalendar';
import DatyAssistant from '@/components/DatyAssistant';
import { MOCK_TICKETS, CALENDAR_DAYS } from '@/lib/mockData';
import { Sparkles, ChevronLeft, ChevronRight, User } from 'lucide-react';

interface Activity {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    needs_help?: boolean;
}

export default function PortalPage() {
    const { data: session } = useSession();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFeed() {
            try {
                // Wait for session to be available if needed, or proceed
                const token = (session as any)?.accessToken;
                const headers: HeadersInit = token
                    ? { 'Authorization': `Bearer ${token}` }
                    : {};

                const res = await fetch('/api/activities/feed', { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setActivities(data);
                    } else if (data && data.activities && Array.isArray(data.activities)) {
                        setActivities(data.activities);
                    }
                } else {
                    console.error("Fetch failed:", res.status, res.statusText);
                }
            } catch (error) {
                console.error('Failed to fetch feed', error);
            } finally {
                setLoading(false);
            }
        }

        if (session) {
            fetchFeed();
        }
    }, [session]);

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
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15935.334099507856!2d101.69119295!3d3.139003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc362db7d05711%3A0xe5a363231317586a!2sKuala%20Lumpur%20City%20Centre%2C%20Kuala%20Lumpur%2C%20Federal%20Territory%20of%20Kuala%20Lumpur!5e0!3m2!1sen!2smy!4v1653846660000!5m2!1sen!2smy"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="absolute inset-0 opacity-80 hover:opacity-100 transition-opacity duration-500"
                            ></iframe>
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
                                <ActivityCard key={activity.id} activity={activity} />
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
                            {[
                                { city: 'Boston', img: '/images/city-boston.png' },
                                { city: 'Chicago', img: '/images/city-chicago.png' },
                                { city: 'Atlanta', img: '/images/city-atlanta.png' }
                            ].map(dest => (
                                <div key={dest.city} className="h-24 rounded-xl bg-gray-200 relative overflow-hidden group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={dest.img} alt={dest.city} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
                                    <span className="absolute bottom-2 left-3 text-white font-bold text-sm text-shadow">{dest.city}</span>
                                </div>
                            ))}
                        </div>

                        {/* Japan Event Large Card (Simulated) */}
                        <div className="mt-6 flex gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-24 h-24 bg-blue-100 rounded-xl shrink-0 overflow-hidden relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/images/japan-event.png" alt="Japan Event" className="w-full h-full object-cover" />
                            </div>
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
                        <MiniCalendar />
                    </section>

                </div>
            </div>
            {/* Floating Assistant */}
            <DatyAssistant />
        </div>
    );
}

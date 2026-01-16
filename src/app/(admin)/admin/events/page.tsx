'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, MapPin, Users, Clock, Filter, Plus, Search, MoreVertical, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Activity {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    volunteers_needed: number;
    volunteers_registered: number;
    skills_required: string[];
    status: string;
}

export default function EventsPage() {
    const { data: session } = useSession();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (session?.accessToken) {
            fetchActivities();
        }
    }, [session]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            if (!session?.accessToken) {
                console.log("No session token available yet");
                return;
            }
            console.log("Fetching activities with token:", session.accessToken.substring(0, 20) + "...");

            const res = await fetch('/api/admin/activities', {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            });
            console.log("Response status:", res.status);
            if (!res.ok) {
                const errorText = await res.text();
                console.error("Error response:", errorText);
                throw new Error('Failed to fetch activities');
            }
            const data = await res.json();
            console.log("Fetched activities:", data.length);
            setActivities(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (activity: Activity) => {
        const fillRate = activity.volunteers_needed > 0
            ? (activity.volunteers_registered / activity.volunteers_needed) * 100
            : 0;

        if (fillRate >= 100) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (fillRate < 50) return 'bg-rose-50 text-rose-700 border-rose-100';
        return 'bg-amber-50 text-amber-700 border-amber-100';
    };

    const getStatusText = (activity: Activity) => {
        const fillRate = activity.volunteers_needed > 0
            ? (activity.volunteers_registered / activity.volunteers_needed) * 100
            : 0;

        if (fillRate >= 100) return 'Fully Booked';
        if (fillRate < 50) return 'Critical Shortage';
        return 'Filling Up';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white relative p-8">
            {/* Header */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Events & Activities</h1>
                        <p className="text-gray-500">Manage all volunteer activities and track participation.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search events..."
                                className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 shadow-sm"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#101828] text-white text-sm font-bold rounded-lg hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all">
                            <Plus size={16} />
                            Create Event
                        </button>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-6">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No events found</p>
                        <p className="text-sm mt-1">Get started by creating a new event.</p>
                    </div>
                )}

                {activities.map((activity) => (
                    <Link key={activity.id} href={`/admin/events/${activity.id}`}>
                        <div className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden h-full">
                            {/* Status Badge */}
                            <div className={`absolute top-5 right-5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(activity)}`}>
                                {getStatusText(activity)}
                            </div>

                            <div className="mb-4">
                                <h3 className="font-bold text-gray-900 text-lg mb-1 pr-24 truncate">{activity.title}</h3>
                                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                                    <Clock size={14} />
                                    <span>
                                        {new Date(activity.start_time).toLocaleDateString()} • {new Date(activity.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-5">
                                <div className="flex items-start gap-2.5">
                                    <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-gray-600 line-clamp-1">{activity.location}</p>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <Users size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-sm text-gray-600">Volunteers</span>
                                            <span className="text-xs font-bold text-gray-900">{activity.volunteers_registered} / {activity.volunteers_needed}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${(activity.volunteers_registered / activity.volunteers_needed) >= 1 ? 'bg-emerald-500' : 'bg-indigo-500'
                                                    }`}
                                                style={{ width: `${Math.min(100, (activity.volunteers_registered / Math.max(1, activity.volunteers_needed)) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    {[...Array(Math.min(3, activity.volunteers_registered))].map((_, i) => (
                                        <div key={i} className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-500">
                                            {/* Placeholder avatars */}
                                        </div>
                                    ))}
                                    {activity.volunteers_registered > 3 && (
                                        <div className="w-7 h-7 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[9px] font-bold text-gray-500">
                                            +{activity.volunteers_registered - 3}
                                        </div>
                                    )}
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View Details</button>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

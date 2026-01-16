
'use client';

import { useState } from 'react';
import { Calendar, MapPin, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface Activity {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    needs_help?: boolean;
    image_url?: string;
}

export default function ActivityCard({ activity }: { activity: Activity }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'conflict' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [calendarLinks, setCalendarLinks] = useState<{ googleCalendar: string, ics: string } | null>(null);

    const handleBook = async () => {
        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activity_id: activity.id }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setCalendarLinks(data.links);
                setMessage('Booking confirmed!');
            } else if (res.status === 409) {
                setStatus('conflict');
                // Use the detailed error if available
                if (data.details) {
                    setMessage(`Conflict with ${data.details.conflictWith || 'another event'}`);
                } else {
                    setMessage(data.error || 'Scheduling conflict');
                }
            } else {
                setStatus('error');
                setMessage(data.error || 'Something went wrong');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error');
        }
    };

    // Format Date: "Mon, 12 Jan • 10:00 AM"
    const startDate = new Date(activity.start_time);
    const dateStr = startDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Generate a consistent gradient based on title length/char to match the "Abstract Art" look
    // Simple hash to pick a color
    const colorIndex = activity.title.length % 5;
    const gradients = [
        'from-pink-500 via-rose-500 to-orange-400', // Warm
        'from-teal-400 via-emerald-500 to-green-500', // Nature
        'from-blue-500 via-indigo-600 to-purple-600', // Cool
        'from-violet-500 via-purple-500 to-fuchsia-500', // Vibrant
        'from-orange-400 via-amber-500 to-yellow-500', // Sunset
    ];
    const gradient = gradients[colorIndex];

    return (
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 flex flex-col h-full group overflow-hidden">
            {/* Image Area */}
            <div className={`h-48 w-full relative overflow-hidden`}>
                {activity.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={activity.image_url}
                        alt={activity.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient}`}></div>
                )}

                {activity.needs_help && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-red-600 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider z-10">
                        Urgent
                    </div>
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
            </div>

            <div className="p-5 flex flex-col flex-1">
                {/* Title */}
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 leading-tight">
                    {activity.title}
                </h3>

                {/* Meta Details */}
                <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="truncate">{activity.location || 'Singapore'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{dateStr}</span>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <Clock size={14} className="text-gray-400" />
                        <span>{timeStr}</span>
                    </div>
                </div>

                <div className="mt-auto">
                    {status === 'idle' && (
                        <button
                            onClick={handleBook}
                            className="w-full py-2.5 rounded-full border border-gray-900 text-gray-900 font-semibold text-sm hover:bg-gray-900 hover:text-white transition-all active:scale-95"
                        >
                            Book Spot
                        </button>
                    )}

                    {status === 'loading' && (
                        <button disabled className="w-full py-2.5 bg-gray-50 text-gray-400 rounded-full font-medium text-sm flex items-center justify-center gap-2 border border-gray-100 cursor-wait">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                            Booking...
                        </button>
                    )}

                    {status === 'success' && (
                        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-full py-2.5 bg-green-50 text-green-700 rounded-full font-medium text-sm flex items-center justify-center gap-2 border border-green-100">
                                <CheckCircle size={14} />
                                Confirmed
                            </div>
                            {calendarLinks && (
                                <a
                                    href={calendarLinks.googleCalendar}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block w-full text-center py-2 text-blue-600 text-xs font-semibold hover:underline"
                                >
                                    Add to Calendar
                                </a>
                            )}
                        </div>
                    )}

                    {(status === 'conflict' || status === 'error') && (
                        <div className="space-y-2 animate-in fade-in shake duration-300">
                            <div className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium px-3 text-center border border-red-100">
                                {message}
                            </div>
                            <button
                                onClick={handleBook}
                                className="block w-full text-center text-xs text-gray-400 hover:text-gray-600 underline"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

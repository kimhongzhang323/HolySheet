'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Plus, MoreHorizontal, RefreshCcw } from 'lucide-react';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 6); // 6 AM to 6 PM

interface CalendarEvent {
    id: number;
    title: string;
    start: number;
    duration: number;
    date: string; // YYYY-MM-DD
    color: string;
    attendees?: string[];
    hasImage?: boolean;
}

const MOCK_EVENTS: CalendarEvent[] = [
    {
        id: 1,
        title: 'Booking taxi app',
        start: 6,
        duration: 1.5,
        date: new Date().toISOString().split('T')[0], // Today
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        attendees: ['https://i.pravatar.cc/150?u=1', 'https://i.pravatar.cc/150?u=2', 'https://i.pravatar.cc/150?u=3']
    },
    {
        id: 2,
        title: 'Design onboarding',
        start: 9,
        duration: 1.2,
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    }
];

export default function CalendarPage() {
    const [selectedView, setSelectedView] = useState<'Month' | 'Week' | 'Day'>('Week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState<{ day: string; date: number; fullDate: string; isToday: boolean; isCurrentMonth?: boolean }[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);

    useEffect(() => {
        // Default to 'Day' view on mobile
        const handleResize = () => {
            if (window.innerWidth < 768 && selectedView === 'Week') {
                // Only switch if we are in initial default (which is Week usually) or user hasn't explicitly chosen? 
                // For now, let's just run this once on mount if we want strict default
            }
        };

        // Check once on mount
        if (window.innerWidth < 768) {
            setSelectedView('Day');
        }
    }, []);

    useEffect(() => {
        const data = [];
        const curr = new Date(currentDate);

        if (selectedView === 'Week') {
            // Get Start of Week (Sunday)
            const day = curr.getDay();
            const diff = curr.getDate() - day;
            const startOfWeek = new Date(curr.setDate(diff));

            for (let i = 0; i < 7; i++) {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                data.push({
                    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    date: d.getDate(),
                    fullDate: d.toISOString().split('T')[0],
                    isToday: d.toDateString() === new Date().toDateString()
                });
            }
        } else if (selectedView === 'Day') {
            data.push({
                day: curr.toLocaleDateString('en-US', { weekday: 'long' }),
                date: curr.getDate(),
                fullDate: curr.toISOString().split('T')[0],
                isToday: curr.toDateString() === new Date().toDateString()
            });
        } else if (selectedView === 'Month') {
            const year = curr.getFullYear();
            const month = curr.getMonth();

            // First day of the month
            const firstDay = new Date(year, month, 1);
            // Starting day of the week (0-6)
            const startDay = firstDay.getDay();

            // Start date for the grid (go back to Sunday)
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - startDay);

            // Generate 6 weeks (42 days) to cover all scenarios
            for (let i = 0; i < 42; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                data.push({
                    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    date: d.getDate(),
                    fullDate: d.toISOString().split('T')[0],
                    isToday: d.toDateString() === new Date().toDateString(),
                    isCurrentMonth: d.getMonth() === month
                });
            }
        }

        setCalendarData(data);
    }, [currentDate, selectedView]);

    const navigate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (selectedView === 'Week') newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        else if (selectedView === 'Day') newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        else newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const response = await fetch('/api/calendar/sync');
            const data = await response.json();

            if (response.ok && data.events) {
                setEvents(data.events);
            } else {
                console.error("Sync failed:", data.error);
                // If 401, they might need to re-login to grant permission
                if (response.status === 401) {
                    alert("Please log out and log back in to grant Google Calendar permissions.");
                }
            }
        } catch (error) {
            console.error("Sync error:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 relative h-[calc(100vh-140px)] flex flex-col">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 shrink-0">
                <div className="flex items-center gap-4 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h1>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                        {(['Month', 'Week', 'Day'] as const).map((view) => (
                            <button
                                key={view}
                                onClick={() => setSelectedView(view)}
                                className={`px-3 py-1 md:px-4 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${selectedView === view
                                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {view}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium rounded-lg text-xs md:text-sm hover:bg-emerald-100 transition-all ${isSyncing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        <RefreshCcw size={14} className={`${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Sync' : 'Sync Calendar'}
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>
                        <button onClick={() => navigate('prev')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={goToToday} className="px-3 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg text-xs md:text-sm hover:bg-gray-50 transition-colors">
                            Today
                        </button>
                        <button onClick={() => navigate('next')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid Container - Edge to Edge on Mobile */}
            <div className="-mx-4 md:mx-0 bg-white md:rounded-3xl p-0 md:p-6 shadow-none md:shadow-sm border-t border-b md:border border-gray-100 md:border-gray-200 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 h-full">
                    <div className={`min-w-full h-full ${selectedView === 'Month' ? 'flex flex-col' : ''}`}>
                        {/* Days Header */}
                        {selectedView !== 'Month' ? (
                            <div className="grid grid-cols-[36px_1fr] md:grid-cols-[60px_1fr] mb-2 md:mb-6 sticky top-0 bg-white z-10 border-b md:border-none pb-2 md:pb-0">
                                <div className="flex items-center justify-center">
                                    <Clock size={16} className="text-gray-400 md:hidden" />
                                    <CalendarIcon size={20} className="text-gray-400 hidden md:block" />
                                </div>
                                <div className={`grid ${selectedView === 'Week' ? 'grid-cols-7 divide-x divide-transparent' : 'grid-cols-1'} gap-0 md:gap-4 text-center`}>
                                    {calendarData.map((d, i) => (
                                        <div key={i} className="flex flex-col items-center justify-center cursor-pointer group">
                                            <span className={`block text-[10px] md:text-xs font-semibold mb-0.5 md:mb-1 uppercase tracking-wide truncate w-full ${d.isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                                                <span className="md:hidden">{d.day.charAt(0)}</span>
                                                <span className="hidden md:inline">{d.day}</span>
                                            </span>
                                            <div className={`w-7 h-7 md:w-10 md:h-10 flex items-center justify-center rounded-full text-sm md:text-lg font-bold transition-all ${d.isToday
                                                ? 'bg-gray-900 text-white shadow-md'
                                                : 'text-gray-900 group-hover:bg-gray-100'
                                                }`}>
                                                {d.date}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Month View Header */
                            <div className="grid grid-cols-7 mb-2 border-b border-gray-100 pb-2 md:pb-4 sticky top-0 bg-white z-10">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                                    <div key={i} className="text-center text-[10px] md:text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                        <span className="md:hidden">{day.charAt(0)}</span>
                                        <span className="hidden md:inline">{day}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* View Content */}
                        {selectedView === 'Month' ? (
                            <div className="grid grid-cols-7 grid-rows-6 gap-px md:gap-2 h-full bg-gray-200 md:bg-transparent border md:border-none">
                                {calendarData.map((day, i) => {
                                    const dayEvents = events.filter(e => e.date === day.fullDate);
                                    return (
                                        <div
                                            key={i}
                                            className={`min-h-[80px] md:min-h-[100px] p-0.5 md:p-2 bg-white flex flex-col ${!day.isCurrentMonth ? 'text-gray-300' : ''
                                                } ${day.isToday ? 'bg-blue-50/30' : ''} md:rounded-xl md:border md:transition-all md:hover:bg-gray-50 md:cursor-pointer overflow-hidden`}
                                        >
                                            <div className="flex justify-center md:justify-between items-start p-1">
                                                <span className={`text-[10px] md:text-sm font-medium w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full ${day.isToday ? 'bg-blue-600 text-white' : ''
                                                    }`}>
                                                    {day.date}
                                                </span>
                                            </div>

                                            {/* Mobile & Desktop: Text Bars */}
                                            <div className="mt-0.5 md:mt-2 flex-1 flex flex-col gap-0.5 md:gap-1 overflow-hidden">
                                                {dayEvents.map(event => (
                                                    <div
                                                        key={event.id}
                                                        className={`text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 md:py-1 rounded-[3px] md:rounded-md truncate font-medium ${event.color}`}
                                                    >
                                                        {event.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Time Grid for Week/Day */
                            <div className="relative grid grid-cols-[36px_1fr] md:grid-cols-[60px_1fr]">
                                {/* Time Column */}
                                <div className="space-y-12 pt-2 border-r border-gray-100 pr-1 md:pr-4">
                                    {HOURS.map((h) => (
                                        <div key={h} className="text-[9px] md:text-xs text-gray-400 md:text-gray-500 font-medium text-right h-4 transform -translate-y-2">
                                            {h}
                                        </div>
                                    ))}
                                </div>

                                {/* Events Grid */}
                                <div className={`grid ${selectedView === 'Week' ? 'grid-cols-7' : 'grid-cols-1'} gap-2 md:gap-4 relative border-l border-gray-200`}>
                                    {/* Horizontal Lines */}
                                    {HOURS.map((h, i) => (
                                        <div
                                            key={h}
                                            className="absolute w-full border-t border-gray-200 pointer-events-none"
                                            style={{ top: `${i * 64 + 8}px` }}
                                        ></div>
                                    ))}

                                    {/* Vertical Lines for Week View */}
                                    {selectedView === 'Week' && Array.from({ length: 7 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute h-full border-r border-gray-100 pointer-events-none"
                                            style={{ left: `${(i + 1) * (100 / 7)}%` }}
                                        ></div>
                                    ))}

                                    {/* Columns per day */}
                                    {calendarData.map((day, colIndex) => (
                                        <div key={colIndex} className="relative h-[850px]">
                                            {/* Render Events for this day */}
                                            {events.filter(e => e.date === day.fullDate).map(event => (
                                                <div
                                                    key={event.id}
                                                    className={`absolute inset-x-0 mx-0.5 md:mx-1 rounded md:rounded-lg p-1 md:p-3 border text-[10px] md:text-xs cursor-pointer hover:shadow-md transition-all group ${event.color} z-10`}
                                                    style={{
                                                        top: `${(event.start - 6) * 64 + 8}px`,
                                                        height: `${event.duration * 64}px`
                                                    }}
                                                >
                                                    <div className="font-bold mb-0.5 line-clamp-1 text-[10px] md:text-sm">{event.title}</div>
                                                    <div className="hidden md:block text-[10px] opacity-90 mb-2 font-medium">
                                                        {Math.floor(event.start)}:{((event.start % 1) * 60).toString().padStart(2, '0')} - {Math.floor(event.start + event.duration)}:{(((event.start + event.duration) % 1) * 60).toString().padStart(2, '0')}
                                                    </div>

                                                    {event.attendees && (
                                                        <div className="flex -space-x-1.5 mt-auto">
                                                            {event.attendees.slice(0, 3).map((src, i) => (
                                                                <img key={i} src={src} className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-white" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

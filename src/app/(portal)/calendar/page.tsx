'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Plus, MoreHorizontal } from 'lucide-react';

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

    return (
        <div className="space-y-6 relative h-[calc(100vh-140px)] flex flex-col">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h1>
                    <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                        {(['Month', 'Week', 'Day'] as const).map((view) => (
                            <button
                                key={view}
                                onClick={() => setSelectedView(view)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedView === view
                                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {view}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('prev')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={goToToday} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50 transition-colors">
                        Today
                    </button>
                    <button onClick={() => navigate('next')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 h-full">
                    <div className={`min-w-[800px] h-full ${selectedView === 'Month' ? 'flex flex-col' : ''}`}>
                        {/* Days Header */}
                        {selectedView !== 'Month' ? (
                            <div className="grid grid-cols-[60px_1fr] mb-6 sticky top-0 bg-white z-10">
                                <div className="flex items-center justify-center">
                                    <CalendarIcon size={20} className="text-gray-400" />
                                </div>
                                <div className={`grid ${selectedView === 'Week' ? 'grid-cols-7' : 'grid-cols-1'} gap-4`}>
                                    {calendarData.map((d, i) => (
                                        <div key={i} className="text-center group cursor-pointer">
                                            <span className={`block text-xs font-semibold mb-1 uppercase tracking-wide ${d.isToday ? 'text-blue-600' : 'text-gray-500'}`}>{d.day}</span>
                                            <div className={`mx-auto w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold transition-all ${d.isToday
                                                    ? 'bg-gray-900 text-white shadow-md'
                                                    : 'text-gray-900 hover:bg-gray-100'
                                                }`}>
                                                {d.date}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Month View Header */
                            <div className="grid grid-cols-7 mb-4 border-b border-gray-100 pb-4">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                        {day}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* View Content */}
                        {selectedView === 'Month' ? (
                            <div className="grid grid-cols-7 grid-rows-6 gap-2 h-full">
                                {calendarData.map((day, i) => {
                                    const dayEvents = MOCK_EVENTS.filter(e => e.date === day.fullDate);
                                    return (
                                        <div
                                            key={i}
                                            className={`min-h-[100px] p-2 rounded-xl border transition-all hover:bg-gray-50 cursor-pointer flex flex-col ${!day.isCurrentMonth ? 'bg-gray-50/50 border-transparent text-gray-400' : 'bg-white border-gray-100'
                                                } ${day.isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${day.isToday ? 'bg-blue-600 text-white' : ''
                                                    }`}>
                                                    {day.date}
                                                </span>
                                            </div>

                                            <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px]">
                                                {dayEvents.map(event => (
                                                    <div
                                                        key={event.id}
                                                        className={`text-[10px] px-1.5 py-1 rounded-md truncate font-medium ${event.color}`}
                                                    >
                                                        {event.title}
                                                    </div>
                                                ))}
                                                {/* Add placeholder event logic if needed */}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Time Grid for Week/Day */
                            <div className="relative grid grid-cols-[60px_1fr]">
                                {/* Time Column */}
                                <div className="space-y-12 pt-2">
                                    {HOURS.map((h) => (
                                        <div key={h} className="text-xs text-gray-500 font-medium text-right pr-4 h-4 transform -translate-y-2">
                                            {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
                                        </div>
                                    ))}
                                </div>

                                {/* Events Grid */}
                                <div className={`grid ${selectedView === 'Week' ? 'grid-cols-7' : 'grid-cols-1'} gap-4 relative border-l border-gray-200`}>
                                    {/* Horizontal Lines (Darker Contrast) */}
                                    {HOURS.map((h, i) => (
                                        <div
                                            key={h}
                                            className="absolute w-full border-t border-gray-200 pointer-events-none"
                                            style={{ top: `${i * 64 + 8}px` }}
                                        ></div>
                                    ))}

                                    {/* Columns per day */}
                                    {calendarData.map((day, colIndex) => (
                                        <div key={colIndex} className="relative h-[850px]">
                                            {/* Render Events for this day */}
                                            {MOCK_EVENTS.filter(e => e.date === day.fullDate).map(event => (
                                                <div
                                                    key={event.id}
                                                    className={`absolute inset-x-0 mx-1 rounded-lg p-3 border text-xs cursor-pointer hover:shadow-md transition-all group ${event.color}`}
                                                    style={{
                                                        top: `${(event.start - 6) * 64 + 8}px`, // Offset to align with line
                                                        height: `${event.duration * 64}px`
                                                    }}
                                                >
                                                    <div className="font-bold mb-0.5 line-clamp-1 text-sm">{event.title}</div>
                                                    <div className="text-[10px] opacity-90 mb-2 font-medium">
                                                        {Math.floor(event.start)}:{((event.start % 1) * 60).toString().padStart(2, '0')} - {Math.floor(event.start + event.duration)}:{(((event.start + event.duration) % 1) * 60).toString().padStart(2, '0')}
                                                    </div>

                                                    {event.attendees && (
                                                        <div className="flex -space-x-1.5 mt-auto">
                                                            {event.attendees.map((src, i) => (
                                                                <img key={i} src={src} className="w-5 h-5 rounded-full border border-white" />
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

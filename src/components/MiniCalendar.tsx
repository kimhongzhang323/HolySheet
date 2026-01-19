'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface MiniCalendarProps {
    activities?: any[];
    enrolledEventIds?: string[];
}

export default function MiniCalendar({ activities = [], enrolledEventIds = ['VOL001'] }: MiniCalendarProps) {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [hoveredDay, setHoveredDay] = useState<number | null>(null);

    // Handle month navigation
    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Helper to get days in month
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0-6 (Sun-Sat)

        return { daysInMonth, startingDay };
    };

    const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

    // Generate array for grid
    const gridDays = [];

    // Previous month filler
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
        gridDays.push({ day: prevMonthLastDay - i, isCurrent: false });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
        gridDays.push({ day: i, isCurrent: true });
    }

    // Next month filler
    const remaining = 42 - gridDays.length;
    for (let i = 1; i <= remaining; i++) {
        gridDays.push({ day: i, isCurrent: false });
    }

    const isToday = (day: number) => {
        return today.getDate() === day &&
            today.getMonth() === currentDate.getMonth() &&
            today.getFullYear() === currentDate.getFullYear();
    };

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthLabel = monthNames[currentDate.getMonth()];

    // Helper to extract day and month from activity
    const getActivityDateInfo = (activity: any) => {
        const date = new Date(activity.start_time);
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        return { day, month, year, dayName };
    };

    // Filter activities for this month/year and prioritize enrolled ones
    const calendarEvents = activities
        .map(act => {
            const dateInfo = getActivityDateInfo(act);
            return {
                ...act,
                ...dateInfo,
                isEnrolled: enrolledEventIds.includes(act._id || act.id || act.VOL_ID)
            };
        })
        .filter(act =>
            act.month === currentMonthLabel &&
            act.year === currentDate.getFullYear()
        )
        .sort((a, b) => (b.isEnrolled ? 1 : 0) - (a.isEnrolled ? 1 : 0));

    return (
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={handlePrevMonth}
                    className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="font-bold text-lg text-gray-900">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                    onClick={handleNextMonth}
                    className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 text-center gap-y-4 mb-8">
                {/* Day Headers */}
                {DAYS.map((d, i) => (
                    <span key={i} className="text-xs text-gray-400 font-medium">{d}</span>
                ))}

                {/* Date Cells */}
                {gridDays.map((d, i) => {
                    const daysEvents = calendarEvents.filter(e => e.day === d.day && d.isCurrent);
                    const hasEvent = daysEvents.length > 0;
                    const enrolledEvent = daysEvents.find(e => e.isEnrolled);
                    const isHovered = hoveredDay === d.day && d.isCurrent;

                    return (
                        <div key={i} className="flex items-center justify-center relative">
                            <button
                                disabled={!d.isCurrent}
                                onMouseEnter={() => d.isCurrent && hasEvent && setHoveredDay(d.day)}
                                onMouseLeave={() => setHoveredDay(null)}
                                className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all relative z-10
                                    ${!d.isCurrent ? 'text-gray-100 opacity-20' : ''}
                                    ${isToday(d.day) && d.isCurrent ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 ring-2 ring-emerald-50' : ''}
                                    ${d.isCurrent && !isToday(d.day) ? 'text-gray-700 hover:bg-gray-50 hover:text-emerald-600' : ''}
                                `}
                            >
                                {d.day}
                            </button>
                            {/* Dot indicator for events */}
                            {hasEvent && !isToday(d.day) && (
                                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${enrolledEvent ? 'bg-emerald-500' : 'bg-blue-400'}`}></div>
                            )}

                            {/* Hover Popover */}
                            <AnimatePresence>
                                {isHovered && daysEvents.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 pointer-events-none"
                                    >
                                        <div className="flex flex-col gap-2">
                                            {daysEvents.slice(0, 1).map((event) => (
                                                <div key={event._id || event.id}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${event.isEnrolled ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {event.isEnrolled ? 'Enrolled' : 'Available'}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400">{event.date} {event.month}</span>
                                                    </div>
                                                    <h5 className="text-[11px] font-bold text-gray-900 leading-tight mb-1 content-normal whitespace-normal text-left">
                                                        {event.title}
                                                    </h5>
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1 text-[9px] text-gray-500">
                                                            <MapPin size={10} className="shrink-0" />
                                                            <span className="truncate">{event.location?.split('(')[0].trim() || 'Location'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[9px] text-gray-500">
                                                            <Clock size={10} className="shrink-0" />
                                                            <span>{event.time || 'Flexible Time'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {daysEvents.length > 1 && (
                                                <div className="text-[9px] font-bold text-gray-400 text-center pt-1 border-t border-gray-50">
                                                    + {daysEvents.length - 1} more mission{daysEvents.length > 2 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>
                                        {/* Tooltip arrow */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white"></div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            <div className="border-t border-gray-100 my-4"></div>

            {/* Upcoming Events List */}
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Missions this month</h3>
                    <span className="text-[10px] font-bold text-gray-900 leading-none">{calendarEvents.length} Tasks</span>
                </div>
                {calendarEvents.length > 0 ? (
                    calendarEvents.map((event) => (
                        <div key={event._id || event.id} className="flex gap-4 items-center group cursor-pointer">
                            <div className={`w-[50px] h-[50px] rounded-xl flex flex-col items-center justify-center shrink-0 transition-all ${event.isEnrolled ? 'bg-emerald-500 shadow-md shadow-emerald-100' : 'bg-gray-50 group-hover:bg-blue-50'}`}>
                                <span className={`text-xs font-black leading-none ${event.isEnrolled ? 'text-white' : 'text-gray-700 group-hover:text-blue-600'}`}>{event.day}</span>
                                <span className={`text-[8px] font-bold uppercase tracking-tight ${event.isEnrolled ? 'text-emerald-50/80' : 'text-gray-400 group-hover:text-blue-400'}`}>{event.dayName}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <h4 className={`font-bold text-sm truncate transition-colors ${event.isEnrolled ? 'text-emerald-700' : 'text-gray-900 group-hover:text-blue-600'}`}>
                                        {event.title}
                                    </h4>
                                    {event.isEnrolled && (
                                        <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                    <span className={`w-1 h-1 rounded-full ${event.isEnrolled ? 'bg-emerald-300' : 'bg-gray-300'}`}></span>
                                    {event.location}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-100">
                        <p className="text-xs text-gray-400 italic">No missions found for this month.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

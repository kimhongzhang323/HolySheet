'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { EVENTS } from '@/lib/mockData';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

export default function MiniCalendar() {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

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

    // Navigation handlers
    const goToPrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Check if a day is today
    const isToday = (day: number, isCurrent: boolean) => {
        return isCurrent &&
            day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();
    };

    // Get current month name for filtering events
    const currentMonthName = MONTH_NAMES[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear().toString();

    // Filter events for current month - show upcoming ones first
    const monthEvents = EVENTS.filter(event =>
        event.month === currentMonthName && event.year === currentYear
    ).sort((a, b) => parseInt(a.date) - parseInt(b.date));

    // Get event dates for highlighting on calendar
    const eventDates = monthEvents.map(e => parseInt(e.date));

    // Show max 2 events
    const displayEvents = monthEvents.slice(0, 2);

    // Helper to get day of week abbreviation
    const getDayOfWeek = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    return (
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={goToPrevMonth}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="font-bold text-lg text-gray-900">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                    onClick={goToNextMonth}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
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
                {gridDays.slice(0, 35).map((d, i) => {
                    const hasEvent = d.isCurrent && eventDates.includes(d.day);
                    const isTodayDate = isToday(d.day, d.isCurrent);

                    return (
                        <div key={i} className="flex items-center justify-center">
                            <button
                                disabled={!d.isCurrent}
                                className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center transition-all relative
                                    ${!d.isCurrent ? 'text-gray-300' : ''}
                                    ${isTodayDate ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : ''}
                                    ${d.isCurrent && !isTodayDate ? 'text-gray-700 hover:bg-gray-50' : ''}
                                `}
                            >
                                {d.day}
                                {hasEvent && !isTodayDate && (
                                    <span className="absolute bottom-0.5 w-1 h-1 bg-green-500 rounded-full"></span>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="border-t border-gray-100 my-4"></div>

            {/* Upcoming Events List */}
            <div className="space-y-4">
                {displayEvents.length > 0 ? (
                    displayEvents.map((event, index) => (
                        <Link
                            key={event._id}
                            href={`/events/${event._id}`}
                            className="flex gap-4 items-center group cursor-pointer"
                        >
                            <div className={`${index === 0 ? 'bg-orange-100' : 'bg-gray-100'} w-[50px] h-[50px] rounded-xl flex flex-col items-center justify-center shrink-0`}>
                                <span className={`${index === 0 ? 'text-orange-500' : 'text-gray-600'} text-xs font-bold leading-tight`}>
                                    {event.date}
                                </span>
                                <span className={`${index === 0 ? 'text-orange-400' : 'text-gray-400'} text-[10px] font-medium leading-tight`}>
                                    {getDayOfWeek(parseInt(event.date))}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-bold text-gray-900 text-sm ${index === 0 ? 'group-hover:text-orange-500' : 'group-hover:text-gray-600'} transition-colors truncate`}>
                                    {event.title}
                                </h4>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{event.location}</p>
                            </div>
                        </Link>
                    ))
                ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No events this month</p>
                )}

                {/* See More Link */}
                <Link
                    href="/events"
                    className="block text-center py-2 text-sm font-medium text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                >
                    See all events →
                </Link>
            </div>
        </div>
    );
}

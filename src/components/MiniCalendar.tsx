'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function MiniCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // Start at April 2026 as per screenshot

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
    // We need 42 cells (6 rows) to be safe, or just enough rows
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

    return (
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <button className="p-1 text-gray-300 hover:text-gray-600 transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <span className="font-bold text-lg text-gray-900">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button className="p-1 text-gray-300 hover:text-gray-600 transition-colors">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 text-center gap-y-4 mb-8">
                {/* Day Headers */}
                {DAYS.map((d, i) => (
                    <span key={i} className="text-xs text-gray-400 font-medium">{d}</span>
                ))}

                {/* Date Cells - Showing only first 5 rows to match compact look if possible, but standard is 6 */}
                {gridDays.slice(0, 35).map((d, i) => (
                    <div key={i} className="flex items-center justify-center">
                        <button
                            disabled={!d.isCurrent}
                            className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center transition-all
                                ${!d.isCurrent ? 'text-gray-300' : ''}
                                ${d.isCurrent && d.day === 6 ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'text-gray-700 hover:bg-gray-50'}
                                ${d.isCurrent && d.day === 29 ? 'bg-gray-100 text-gray-600' : ''} 
                            `}
                        >
                            {d.day}
                        </button>
                    </div>
                ))}
            </div>

            <div className="border-t border-gray-100 my-4"></div>

            {/* Upcoming Events List */}
            <div className="space-y-5">
                {/* Event 1 */}
                <div className="flex gap-4 items-center group cursor-pointer">
                    <div className="bg-orange-100 w-[50px] h-[50px] rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-orange-500 text-xs font-bold leading-tight">14</span>
                        <span className="text-orange-400 text-[10px] font-medium leading-tight">Tue</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-orange-500 transition-colors">Urban Wellness Expo</h4>
                        <p className="text-xs text-gray-400 mt-0.5">Suntec City, Singapore</p>
                    </div>
                </div>

                {/* Event 2 */}
                <div className="flex gap-4 items-center group cursor-pointer">
                    <div className="bg-gray-100 w-[50px] h-[50px] rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-gray-600 text-xs font-bold leading-tight">18</span>
                        <span className="text-gray-400 text-[10px] font-medium leading-tight">Sun</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-gray-600 transition-colors">Neon Nights Live</h4>
                        <p className="text-xs text-gray-400 mt-0.5">The Glass Hall, Singapore</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

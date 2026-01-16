'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import {
    Calendar as CalendarIcon,
    Filter,
    Download,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Home,
    MoreHorizontal
} from 'lucide-react';

export default function JointAttendancePage() {
    const [view, setView] = useState('dayGridMonth');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Mock Data - Generating relative to today
    const today = new Date();
    const getDate = (offset: number) => {
        const d = new Date(today);
        d.setDate(today.getDate() + offset);
        return d.toISOString().split('T')[0];
    };

    // Styling helpers for events based on reference image
    // Blue: bg-blue-50 text-blue-700
    // Orange: bg-orange-50 text-orange-700
    // Purple: bg-purple-50 text-purple-700
    // Green: bg-green-50 text-green-700
    const events = [
        {
            title: 'Monday standup',
            start: `${getDate(-today.getDay() + 1)}T09:00:00`,
            extendedProps: { type: 'default' }
        },
        {
            title: 'Coffee with Alina',
            start: `${getDate(-today.getDay() + 1)}T11:30:00`,
            extendedProps: { type: 'purple' }
        },
        {
            title: 'Marketing site redesign',
            start: `${getDate(-today.getDay() + 1)}T14:30:00`,
            extendedProps: { type: 'blue' }
        },
        {
            title: 'One-on-one with Gre...',
            start: `${getDate(-today.getDay() + 4)}T10:00:00`,
            extendedProps: { type: 'pink' }
        },
        {
            title: 'Deep work',
            start: `${getDate(-today.getDay() + 3)}T09:00:00`,
            extendedProps: { type: 'blue-dark' }
        },
        {
            title: 'Design sync',
            start: `${getDate(-today.getDay() + 3)}T10:30:00`,
            extendedProps: { type: 'blue' }
        },
        {
            title: 'Lunch with Zahir',
            start: `${getDate(-today.getDay() + 4)}T12:00:00`,
            extendedProps: { type: 'green' }
        },
        {
            title: 'House inspection',
            start: `${getDate(-today.getDay() + 5)}T10:30:00`,
            extendedProps: { type: 'orange' }
        },
        {
            title: 'Product planning',
            start: `${getDate(-today.getDay() + 8)}T09:30:00`,
            extendedProps: { type: 'blue' }
        },
    ];

    const renderEventContent = (eventInfo: any) => {
        const type = eventInfo.event.extendedProps.type;
        let colorClass = 'bg-gray-50 text-gray-700'; // default

        switch (type) {
            case 'purple': colorClass = 'bg-purple-50 text-purple-700 border border-purple-100'; break;
            case 'blue': colorClass = 'bg-blue-50 text-blue-700 border border-blue-100'; break;
            case 'blue-dark': colorClass = 'bg-blue-100 text-blue-800 border border-blue-200'; break;
            case 'pink': colorClass = 'bg-pink-50 text-pink-700 border border-pink-100'; break;
            case 'green': colorClass = 'bg-green-50 text-green-700 border border-green-100'; break;
            case 'orange': colorClass = 'bg-orange-50 text-orange-700 border border-orange-100'; break;
        }

        return (
            <div className={`px-2 py-1 rounded-md text-[11px] font-semibold w-full truncate ${colorClass} flex items-center gap-1.5`}>
                <div className={`w-1.5 h-1.5 rounded-full bg-current opacity-50`}></div>
                <span className="truncate">{eventInfo.event.title}</span>
                {eventInfo.timeText && <span className="opacity-70 font-normal">{eventInfo.timeText}</span>}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white relative p-8">
            {/* Top Breadcrumb & Search */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <Home size={16} className="text-gray-400" />
                        <span className="text-gray-300">/</span>
                        <span>Untitled UI</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-900 font-bold bg-gray-50 px-2 py-0.5 rounded-md">Calendar</span>
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
                        {/* Tabs */}
                        <div className="flex gap-1 p-1 bg-gray-50/50 rounded-lg border border-gray-100 w-fit">
                            <button className="px-4 py-1.5 bg-white text-gray-900 text-xs font-bold rounded-md shadow-sm border border-gray-200">All events</button>
                            <button className="px-4 py-1.5 text-gray-500 hover:text-gray-900 text-xs font-medium transition-colors">Shared</button>
                            <button className="px-4 py-1.5 text-gray-500 hover:text-gray-900 text-xs font-medium transition-colors">Public</button>
                            <button className="px-4 py-1.5 text-gray-500 hover:text-gray-900 text-xs font-medium transition-colors">Archived</button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search"
                                className="pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 w-64 shadow-sm"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 border border-gray-100 rounded px-1.5 py-0.5 bg-gray-50">⌘K</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Calendar Toolbar & Wrapper */}
            <div className="flex flex-col flex-1 bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
                {/* Custom Toolbar */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                {currentDate.toLocaleString('default', { month: 'short' }).toUpperCase()}
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-gray-900">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <button className="text-gray-400 hover:text-gray-600 p-2"><Search size={18} /></button>
                        </div>
                        <div className="h-6 w-px bg-gray-200 mx-1"></div>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 shadow-sm transition-all">
                                Today
                            </button>
                            <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
                                <button className="p-2 hover:bg-gray-50 border-r border-gray-200 rounded-l-lg text-gray-600">
                                    <ChevronLeft size={18} />
                                </button>
                                <button className="p-2 hover:bg-gray-50 rounded-r-lg text-gray-600">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 shadow-sm">
                                <span>Month view</span>
                                <ChevronDown size={14} className="text-gray-400" />
                            </button>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#101828] text-white text-sm font-bold rounded-lg hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all">
                            <Plus size={16} />
                            Add event
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 relative calendar-custom-theme">
                    <style jsx global>{`
                        .calendar-custom-theme .fc {
                            --fc-border-color: #F2F4F7;
                            --fc-today-bg-color: #F9FAFB;
                        }
                        .calendar-custom-theme .fc-theme-standard td, 
                        .calendar-custom-theme .fc-theme-standard th {
                            border-color: #F2F4F7;
                        }
                        .calendar-custom-theme .fc-col-header-cell {
                            background-color: #FFFFFF;
                            padding: 12px 0;
                        }
                        .calendar-custom-theme .fc-col-header-cell-cushion {
                            font-size: 13px;
                            font-weight: 600;
                            color: #475467;
                            text-transform: capitalize; 
                        }
                        .calendar-custom-theme .fc-daygrid-day-top {
                            flex-direction: row;
                            padding: 8px 12px;
                        }
                        .calendar-custom-theme .fc-daygrid-day-number {
                            font-size: 14px;
                            font-weight: 500;
                            color: #344054;
                        }
                        .calendar-custom-theme .fc-day-today .fc-daygrid-day-number {
                             background: #F2F4F7;
                             width: 28px;
                             height: 28px;
                             display: flex;
                             align-items: center;
                             justify-content: center;
                             border-radius: 50%;
                             color: #101828;
                             font-weight: 700;
                        }
                        .calendar-custom-theme .fc-daygrid-event {
                            background: transparent;
                            border: none;
                            margin-top: 2px;
                            margin-bottom: 2px;
                        }
                        .calendar-custom-theme .fc-daygrid-day-events {
                            padding: 0 8px 8px 8px;
                        }
                        .fc-h-event .fc-event-main {
                            color: inherit;
                        }
                    `}</style>
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={false} // Hiding default toolbar to use our custom one
                        events={events}
                        eventContent={renderEventContent}
                        height="100%"
                        dayMaxEvents={3}
                    />
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
    const { data: session } = useSession();
    const router = useRouter(); // For navigation
    const [view, setView] = useState('dayGridMonth');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        if (session?.accessToken) {
            fetchActivities();
        }
    }, [session]);

    const fetchActivities = async () => {
        try {
            const res = await fetch('/api/admin/activities', {
                headers: {
                    'Authorization': `Bearer ${session?.accessToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                const formattedEvents = data.map((act: any) => ({
                    id: act.id,
                    title: act.title,
                    start: act.start_time,
                    end: act.end_time,
                    extendedProps: {
                        type: getColorType(act.activity_type || 'default'),
                        description: act.description,
                        location: act.location,
                        volunteers_registered: act.volunteers_registered || 0,
                        volunteers_needed: act.volunteers_needed || 0
                    }
                }));
                setEvents(formattedEvents);
            }
        } catch (error) {
            console.error("Failed to fetch activities:", error);
        }
    };

    const getColorType = (type: string) => {
        // Map backend activity types to frontend color themes
        const map: Record<string, string> = {
            'workshop': 'purple',
            'community': 'blue',
            'outreach': 'green',
            'training': 'orange',
            'social': 'pink',
            'default': 'blue-dark'
        };
        return map[type.toLowerCase()] || 'default';
    };

    const handleEventClick = (info: any) => {
        router.push(`/admin/events/${info.event.id}`);
    };


    const calendarRef = useRef<FullCalendar>(null);

    const handleNext = () => {
        const calendarApi = calendarRef.current?.getApi();
        calendarApi?.next();
        setCurrentDate(calendarApi?.getDate() || new Date());
    };

    const handlePrev = () => {
        const calendarApi = calendarRef.current?.getApi();
        calendarApi?.prev();
        setCurrentDate(calendarApi?.getDate() || new Date());
    };

    const handleToday = () => {
        const calendarApi = calendarRef.current?.getApi();
        calendarApi?.today();
        setCurrentDate(calendarApi?.getDate() || new Date());
    };

    const handleViewChange = (newView: string) => {
        const calendarApi = calendarRef.current?.getApi();
        calendarApi?.changeView(newView);
        setView(newView);
    };

    const renderEventContent = (eventInfo: any) => {
        const props = eventInfo.event.extendedProps;
        const type = props.type;
        const registered = props.volunteers_registered || 0;
        const needed = props.volunteers_needed || 1; // Avoid division by zero
        const percentage = Math.min(100, Math.round((registered / needed) * 100));

        // Define colors for background, text, border, and progress bar
        let colors = {
            bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200',
            barBg: 'bg-gray-200', barFill: 'bg-gray-500'
        };

        switch (type) {
            case 'purple':
                colors = { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', barBg: 'bg-purple-200', barFill: 'bg-purple-600' };
                break;
            case 'blue':
                colors = { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', barBg: 'bg-blue-200', barFill: 'bg-blue-600' };
                break;
            case 'blue-dark':
                colors = { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', barBg: 'bg-blue-300', barFill: 'bg-blue-700' };
                break;
            case 'pink':
                colors = { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100', barBg: 'bg-pink-200', barFill: 'bg-pink-600' };
                break;
            case 'green':
                colors = { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100', barBg: 'bg-green-200', barFill: 'bg-green-600' };
                break;
            case 'orange':
                colors = { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', barBg: 'bg-orange-200', barFill: 'bg-orange-600' };
                break;
        }

        return (
            <div className={`px-2 py-1.5 rounded-md text-[11px] w-full ${colors.bg} ${colors.text} border ${colors.border} cursor-pointer hover:opacity-90 transition-all shadow-sm flex flex-col gap-1`}>
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{eventInfo.event.title}</span>
                </div>

                <div className="flex items-center gap-2 w-full">
                    <div className={`h-1.5 flex-1 rounded-full ${colors.barBg} overflow-hidden`}>
                        <div
                            className={`h-full rounded-full ${colors.barFill}`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <span className="text-[10px] opacity-80 font-medium shrink-0">
                        {registered}/{needed}
                    </span>
                </div>
            </div>
        );
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Filter events based on search query
    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.extendedProps?.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.extendedProps?.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ... (keep handleNext, handlePrev, handleToday, handleViewChange) ... 

    return (
        <div className="flex flex-col h-full bg-white relative p-8">
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
                        <div className="flex items-center gap-1 relative">
                            {isSearchOpen ? (
                                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 transition-all w-64">
                                    <Search size={16} className="text-gray-400 mr-2" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search events..."
                                        className="bg-transparent border-none focus:outline-none text-sm w-full"
                                        autoFocus
                                        onBlur={() => !searchQuery && setIsSearchOpen(false)}
                                    />
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Search size={18} />
                                </button>
                            )}
                        </div>
                        <div className="h-6 w-px bg-gray-200 mx-1"></div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleToday}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 shadow-sm transition-all"
                            >
                                Today
                            </button>
                            <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
                                <button
                                    onClick={handlePrev}
                                    className="p-2 hover:bg-gray-50 border-r border-gray-200 rounded-l-lg text-gray-600"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="p-2 hover:bg-gray-50 rounded-r-lg text-gray-600"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* View Toggle Placeholder - using a simple select for now or custom dropdown */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 shadow-sm">
                                <span>{view === 'dayGridMonth' ? 'Month' : view === 'timeGridWeek' ? 'Week' : 'Day'} view</span>
                                <ChevronDown size={14} className="text-gray-400 transition-transform group-hover:rotate-180" />
                            </button>
                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                <button onClick={() => handleViewChange('dayGridMonth')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg">Month</button>
                                <button onClick={() => handleViewChange('timeGridWeek')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Week</button>
                                <button onClick={() => handleViewChange('timeGridDay')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg">Day</button>
                            </div>
                        </div>

                        <button className="flex items-center gap-2 px-4 py-2 bg-[#101828] text-white text-sm font-bold rounded-lg hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all">
                            <Plus size={16} />
                            Add event
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 relative calendar-custom-theme">
                    {/* ... (styles remain same) ... */}
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
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={false}
                        events={filteredEvents}
                        eventContent={renderEventContent}
                        eventClick={handleEventClick}
                        height="100%"
                        dayMaxEvents={3}
                    />
                </div>
            </div>
        </div>
    );
}

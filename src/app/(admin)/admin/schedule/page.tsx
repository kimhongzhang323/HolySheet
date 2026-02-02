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
    CheckSquare,
    Download,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Home,
    MoreHorizontal
} from 'lucide-react';
import { ADMIN_MOCK_ACTIVITIES } from '@/lib/adminMockData';

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
            // Mock fetch
            setTimeout(() => {
                const data = ADMIN_MOCK_ACTIVITIES;
                const formattedEvents = data.map((act: any) => ({
                    id: act.id,
                    title: act.title,
                    start: act.start_time,
                    end: act.end_time,
                    extendedProps: {
                        type: getColorType(act.activity_type || 'default'),
                        rawType: act.activity_type || 'default',
                        description: act.description,
                        location: act.location,
                        volunteers_registered: act.volunteers_registered || 0,
                        volunteers_needed: act.volunteers_needed || 0,
                        engagement_level: act.engagement_level || 'Ad hoc'
                    }
                }));
                setEvents(formattedEvents);
            }, 500);
        } catch (error) {
            console.error("Failed to fetch activities:", error);
        }
    };

    const getColorType = (type: string) => {
        // Map backend activity types to frontend color themes
        const lowerType = type.toLowerCase();

        const map: Record<string, string> = {
            'workshop': 'purple',
            'community': 'teal',
            'outreach': 'green',
            'training': 'blue',
            'social': 'pink',
            'befriending': 'pink',
            'environment': 'green',
            'education': 'blue',
            'care circle': 'purple',
            'hub support': 'orange',
            'creative': 'indigo',
            'default': 'gray'
        };

        // Handle variations or substrings
        if (lowerType.includes('befriend')) return 'pink';
        if (lowerType.includes('hub')) return 'orange';
        if (lowerType.includes('care')) return 'purple';
        if (lowerType.includes('design') || lowerType.includes('creative') || lowerType.includes('photo')) return 'indigo';
        if (lowerType.includes('environment') || lowerType.includes('clean')) return 'green';

        return map[lowerType] || 'gray';
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

        // Define colors for background, text, border
        let colors = 'bg-gray-100 text-gray-700';

        switch (type) {
            case 'purple': colors = 'bg-purple-100 text-purple-700 border-l-2 border-purple-500'; break;
            case 'blue': colors = 'bg-blue-100 text-blue-700 border-l-2 border-blue-500'; break;
            case 'teal': colors = 'bg-teal-100 text-teal-700 border-l-2 border-teal-500'; break;
            case 'indigo': colors = 'bg-indigo-100 text-indigo-700 border-l-2 border-indigo-500'; break;
            case 'pink': colors = 'bg-pink-100 text-pink-700 border-l-2 border-pink-500'; break;
            case 'green': colors = 'bg-emerald-100 text-emerald-700 border-l-2 border-emerald-500'; break;
            case 'orange': colors = 'bg-amber-100 text-amber-700 border-l-2 border-amber-500'; break;
            default: colors = 'bg-gray-100 text-gray-700 border-l-2 border-gray-400';
        }

        // Simpler "Text Bar" style matching Portal
        const engagementColor =
            props.engagement_level === 'Ad hoc' ? 'bg-red-400' :
                props.engagement_level === 'Once a week' ? 'bg-blue-400' :
                    props.engagement_level === 'Twice a week' ? 'bg-purple-400' :
                        props.engagement_level === '3 or more times a week' ? 'bg-orange-400' : 'bg-gray-400';

        return (
            <div className={`px-1.5 py-0.5 md:py-1 rounded-sm md:rounded-md text-[10px] md:text-xs w-full ${colors} cursor-pointer hover:opacity-80 transition-opacity truncate font-medium flex items-center gap-1.5`}>
                <div className={`w-1.5 h-1.5 rounded-full ${engagementColor} shrink-0`}></div>
                <span className="truncate">{eventInfo.event.title}</span>
            </div>
        );
    };

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(true); // Default open for visibility
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [filterLocation, setFilterLocation] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, needs_volunteers, full

    const [filterEngagement, setFilterEngagement] = useState<string[]>([]);

    // Extract unique types for checkboxes
    const uniqueTypes = Array.from(new Set(events.map(e => e.extendedProps?.rawType))).filter(Boolean);

    // Toggle type selection
    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    // Filter events based on all criteria
    const filteredEvents = events.filter(event => {
        const props = event.extendedProps;
        const matchesSearch =
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            props?.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            props?.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(props?.rawType);

        const matchesLocation = !filterLocation || props?.location?.toLowerCase().includes(filterLocation.toLowerCase());

        let matchesStatus = true;
        if (filterStatus === 'needs_volunteers') {
            matchesStatus = (props?.volunteers_registered || 0) < (props?.volunteers_needed || 0);
        } else if (filterStatus === 'full') {
            matchesStatus = (props?.volunteers_registered || 0) >= (props?.volunteers_needed || 0);
        }

        const matchesEngagement = filterEngagement.length === 0 || filterEngagement.includes(props?.engagement_level);

        return matchesSearch && matchesType && matchesLocation && matchesStatus && matchesEngagement;
    });

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden relative">
            {/* Main Calendar Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300">

                {/* Simplified Top Toolbar */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
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

                        <div className="h-8 w-px bg-gray-200 mx-2"></div>

                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={handlePrev}
                                className="p-1 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={handleToday}
                                className="px-3 py-1 text-xs font-bold text-gray-700 hover:text-gray-900"
                            >
                                Today
                            </button>
                            <button
                                onClick={handleNext}
                                className="p-1 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="relative group z-10">
                            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 shadow-sm transition-all">
                                <span>{view === 'dayGridMonth' ? 'Month' : view === 'timeGridWeek' ? 'Week' : 'Day'}</span>
                                <ChevronDown size={14} className="text-gray-400" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                <button onClick={() => handleViewChange('dayGridMonth')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg">Month</button>
                                <button onClick={() => handleViewChange('timeGridWeek')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Week</button>
                                <button onClick={() => handleViewChange('timeGridDay')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg">Day</button>
                            </div>
                        </div>

                        <button className="flex items-center gap-2 px-4 py-2 bg-[#101828] text-white text-sm font-bold rounded-lg hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all">
                            <Plus size={16} />
                            <span>Add Event</span>
                        </button>

                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`p-2 rounded-lg border transition-all ${isFilterOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid Container */}
                <div className="flex-1 overflow-hidden relative calendar-custom-theme bg-white p-4">
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

            {/* Right Sidebar Filters */}
            <div className={`bg-white border-l border-gray-200 h-full transition-all duration-300 ease-in-out overflow-y-auto ${isFilterOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full opacity-0'}`}>
                <div className="p-6 space-y-8 w-80">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Filters</h3>
                        <p className="text-sm text-gray-500">Refine your calendar view</p>
                    </div>

                    {/* Search */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search events..."
                                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registration Status</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={filterStatus === 'all'}
                                    onChange={() => setFilterStatus('all')}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">All Events</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={filterStatus === 'needs_volunteers'}
                                    onChange={() => setFilterStatus('needs_volunteers')}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Needs Volunteers</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={filterStatus === 'full'}
                                    onChange={() => setFilterStatus('full')}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Fully Booked</span>
                            </label>
                        </div>
                    </div>

                    {/* Activity Types (Multi-select) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Activity Types</label>
                            <button
                                onClick={() => setSelectedTypes([])}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700"
                            >
                                RESET
                            </button>
                        </div>

                        <div className="space-y-1.5 h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {uniqueTypes.map(type => (
                                <label key={type} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors group">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedTypes.includes(type) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}>
                                        {selectedTypes.includes(type) && <CheckSquare size={12} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedTypes.includes(type)}
                                        onChange={() => toggleType(type)}
                                    />
                                    <span className="text-sm text-gray-600 capitalize">{type}</span>
                                </label>
                            ))}
                            {uniqueTypes.length === 0 && (
                                <div className="text-sm text-gray-400 italic p-2">No activity types found</div>
                            )}
                        </div>
                    </div>

                    {/* Engagement Level Filter */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Engagement Level</label>
                            <button
                                onClick={() => setFilterEngagement([])}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700"
                            >
                                RESET
                            </button>
                        </div>
                        <div className="space-y-2">
                            {['Ad hoc', 'Once a week', 'Twice a week', '3 or more times a week'].map(level => (
                                <label key={level} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={filterEngagement.includes(level)}
                                        onChange={() => {
                                            setFilterEngagement(prev =>
                                                prev.includes(level)
                                                    ? prev.filter(l => l !== level)
                                                    : [...prev, level]
                                            );
                                        }}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{level} engagement</span>
                                    {level === 'Ad hoc' && <span className="ml-auto w-2 h-2 rounded-full bg-red-400"></span>}
                                    {level === 'Once a week' && <span className="ml-auto w-2 h-2 rounded-full bg-blue-400"></span>}
                                    {level === 'Twice a week' && <span className="ml-auto w-2 h-2 rounded-full bg-purple-400"></span>}
                                    {level === '3 or more times a week' && <span className="ml-auto w-2 h-2 rounded-full bg-orange-400"></span>}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</label>
                        <input
                            type="text"
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            placeholder="Filter by location..."
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

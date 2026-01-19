'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Plus,
    MoreHorizontal,
    RefreshCcw,
    TrendingUp,
    CheckCircle2,
    Users,
    Zap
} from 'lucide-react';
import { VOLUNTEER_ACTIVITIES } from '@/lib/mockData';

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 00:00 to 23:00

interface CalendarEvent {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location: string;
    color: string;
    isEnrolled?: boolean;
    startHour: number;
    duration: number;
    day: number;
    month: string;
}

export default function CalendarPage() {
    const { data: session } = useSession();
    const [selectedView, setSelectedView] = useState<'Month' | 'Week' | 'Day'>('Month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState<{ day: string; date: number; fullDate: string; isToday: boolean; isCurrentMonth?: boolean }[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncAlert, setSyncAlert] = useState<{ type: 'success' | 'warning' | 'error', message: string } | null>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [googleEvents, setGoogleEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
    const [customIdentities, setCustomIdentities] = useState<Record<string, { color: string; label?: string }>>({});

    // Define available tag colors
    const tagColors = [
        { name: 'Emerald', bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-400', light: 'bg-emerald-50 text-emerald-700' },
        { name: 'Blue', bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-400', light: 'bg-blue-50 text-blue-700' },
        { name: 'Purple', bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-400', light: 'bg-purple-50 text-purple-700' },
        { name: 'Orange', bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-400', light: 'bg-orange-50 text-orange-700' },
        { name: 'Rose', bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-400', light: 'bg-rose-50 text-rose-700' },
    ];

    useEffect(() => {
        async function fetchFeed() {
            setLoading(true);
            try {
                // 1. Fetch Enrollments
                const enrollRes = await fetch('/api/user/activities?type=upcoming');
                let registeredIds: string[] = [];
                if (enrollRes.ok) {
                    const enrollData = await enrollRes.json();
                    registeredIds = (enrollData.activities || [])
                        .filter((a: any) => a.status === 'confirmed' || a.status === 'approved')
                        .map((a: any) => a.activity_id || a.id);
                    setEnrolledIds(registeredIds);
                }

                // 2. Fetch All Activities
                const res = await fetch('/api/activities/feed');
                let rawData = [];

                if (res.ok) {
                    const data = await res.json();
                    rawData = Array.isArray(data) ? data : (data?.activities || []);
                }

                if (rawData.length === 0) {
                    rawData = VOLUNTEER_ACTIVITIES;
                }

                // Process and normalize events for calendar
                const processed = rawData.map((act: any) => {
                    const start = new Date(act.start_time);
                    const end = new Date(act.end_time);
                    const isEnrolled = registeredIds.includes(act._id || act.id);

                    return {
                        ...act,
                        id: act._id || act.id,
                        isEnrolled,
                        startHour: start.getHours() + start.getMinutes() / 60,
                        duration: (end.getTime() - start.getTime()) / (1000 * 60 * 60),
                        day: start.getDate(),
                        month: start.toLocaleDateString('en-US', { month: 'short' }),
                        fullDate: start.toISOString().split('T')[0],
                    };
                });

                setActivities(processed);
            } catch (error) {
                console.error("Error fetching calendar events:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchFeed();
    }, [session]);

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
        setSyncAlert(null);

        try {
            const res = await fetch('/api/calendar/sync');
            if (res.ok) {
                const data = await res.json();
                const fetchedEvents = (data.events || []).map((e: any) => ({
                    ...e,
                    isExternal: true,
                    fullDate: e.date,
                    startHour: e.start
                }));
                setGoogleEvents(fetchedEvents);
                setSyncAlert({
                    type: 'success',
                    message: `Successfully synced ${fetchedEvents.length} events from Google Calendar!`
                });
            } else {
                const error = await res.json();
                setSyncAlert({
                    type: 'error',
                    message: error.error || 'Failed to sync with Google Calendar'
                });
            }
        } catch (error) {
            console.error("Sync error:", error);
            setSyncAlert({
                type: 'error',
                message: 'Internal error during sync'
            });
        } finally {
            setIsSyncing(false);
            // Auto-hide alert after 5s
            setTimeout(() => setSyncAlert(null), 5000);
        }
    };

    const getEventIdentity = (event: any) => {
        const custom = customIdentities[event.id];
        if (custom) {
            const colorObj = tagColors.find(c => c.name === custom.color) || tagColors[0];
            return {
                bg: colorObj.bg,
                text: colorObj.text,
                border: colorObj.border,
                light: colorObj.light,
                label: custom.label
            };
        }

        // High contrast branding for registered/unregistered
        if (event.isEnrolled) {
            return {
                bg: 'bg-emerald-600',
                text: 'text-white',
                border: 'border-emerald-700 shadow-lg shadow-emerald-100',
                light: 'bg-emerald-50 text-emerald-700',
                label: 'Registered'
            };
        }

        if (event.isExternal) {
            return {
                bg: 'bg-blue-500',
                text: 'text-white',
                border: 'border-blue-600 shadow-md',
                light: 'bg-blue-50 text-blue-700',
                label: 'Google Calendar'
            };
        }

        return {
            bg: 'bg-indigo-50/80',
            text: 'text-indigo-700',
            border: 'border-indigo-100 border-dashed',
            light: 'bg-indigo-50/50 text-indigo-400',
            label: 'Available'
        };
    };

    // Get next enrolled mission
    const nextMission = activities
        .filter(act => act.isEnrolled && new Date(act.start_time) >= new Date())
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

    const enrolledCount = activities.filter(act => act.isEnrolled).length;
    const totalHours = activities
        .filter(act => act.isEnrolled)
        .reduce((sum, act) => sum + act.duration, 0);

    return (
        <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-140px)] relative">
            {/* Sync Alert Banner */}
            <AnimatePresence>
                {syncAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className={`fixed top-24 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${syncAlert.type === 'success'
                            ? 'bg-emerald-500/90 text-white border-emerald-400'
                            : 'bg-orange-500/90 text-white border-orange-400'
                            }`}
                    >
                        <div className="bg-white/20 p-1.5 rounded-lg">
                            {syncAlert.type === 'success' ? <CheckCircle2 size={18} /> : <Zap size={18} />}
                        </div>
                        <p className="text-sm font-black tracking-tight">{syncAlert.message}</p>
                        <button onClick={() => setSyncAlert(null)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
                            <Plus size={18} className="rotate-45" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Main Calendar Area */}
            <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
                {/* Header Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 shrink-0">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="bg-emerald-50 p-2 rounded-xl">
                            <CalendarIcon className="text-emerald-600" size={20} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h1>
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                            {(['Month', 'Week', 'Day'] as const).map((view) => (
                                <button
                                    key={view}
                                    onClick={() => setSelectedView(view)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedView === view
                                        ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {view}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100">
                            <button onClick={() => navigate('prev')} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-gray-400 hover:text-emerald-600 transition-all">
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={goToToday} className="px-3 py-1 text-xs font-bold text-gray-600 hover:text-emerald-600">
                                Today
                            </button>
                            <button onClick={() => navigate('next')} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-gray-400 hover:text-emerald-600 transition-all">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className={`flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-bold rounded-xl text-xs hover:bg-gray-800 transition-all ${isSyncing ? 'opacity-70' : ''}`}
                        >
                            <RefreshCcw size={14} className={`${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Sync with Google'}
                        </button>
                    </div>
                </div>

                {/* Calendar Grid Container */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                    <div className="overflow-auto flex-1 h-full custom-scrollbar">
                        <div className={`min-w-full h-full ${selectedView === 'Month' ? 'flex flex-col' : ''}`}>
                            {selectedView !== 'Month' ? (
                                /* Week/Day Header */
                                <div className="grid grid-cols-[60px_1fr] mb-6 sticky top-0 bg-white z-10 pb-4 border-b border-gray-50">
                                    <div className="flex items-center justify-center">
                                        <Clock size={18} className="text-gray-300" />
                                    </div>
                                    <div className={`grid ${selectedView === 'Week' ? 'grid-cols-7' : 'grid-cols-1'} gap-4 text-center`}>
                                        {calendarData.map((d, i) => (
                                            <div key={i} className="flex flex-col items-center justify-center">
                                                <span className={`text-[10px] font-bold mb-1 uppercase tracking-widest ${d.isToday ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                    {d.day}
                                                </span>
                                                <div className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-black transition-all ${d.isToday
                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                                                    : 'text-gray-900'
                                                    }`}>
                                                    {d.date}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* Month Header */
                                <div className="grid grid-cols-7 mb-4 border-b border-gray-50 pb-4 sticky top-0 bg-white z-10">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                                        <div key={i} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Main Content View */}
                            {selectedView === 'Month' ? (
                                <div className="grid grid-cols-7 gap-3 flex-1">
                                    {calendarData.map((day, i) => {
                                        const dayEvents = [...activities, ...googleEvents].filter(e => e.fullDate === day.fullDate);
                                        return (
                                            <div
                                                key={i}
                                                className={`min-h-[110px] p-2 rounded-2xl border transition-all hover:border-emerald-100 hover:bg-emerald-50/10 flex flex-col gap-2 ${!day.isCurrentMonth ? 'opacity-25' : 'border-gray-50'
                                                    } ${day.isToday ? 'bg-emerald-50/30 ring-1 ring-emerald-100' : ''}`}
                                            >
                                                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${day.isToday ? 'bg-emerald-500 text-white' : 'text-gray-400'
                                                    }`}>
                                                    {day.date}
                                                </span>
                                                <div className="flex flex-col gap-1.5 overflow-hidden">
                                                    {dayEvents.map(event => {
                                                        const identity = getEventIdentity(event);
                                                        return (
                                                            <div
                                                                key={event.id}
                                                                onClick={() => setSelectedEvent(event)}
                                                                className={`text-[10px] px-2 py-1.5 rounded-lg truncate font-bold border transition-all hover:scale-[1.02] cursor-pointer shadow-sm ${identity.bg} ${identity.text} ${identity.border}`}
                                                            >
                                                                <div className="flex items-center gap-1">
                                                                    {identity.label && <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-pulse" />}
                                                                    {event.title}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Time Grid */
                                <div className="relative grid grid-cols-[60px_1fr]">
                                    <div className="space-y-16 pt-2">
                                        {HOURS.map((h) => (
                                            <div key={h} className="text-[10px] text-gray-400 font-bold text-right pr-4 h-4 transform -translate-y-2">
                                                {h}:00
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`grid ${selectedView === 'Week' ? 'grid-cols-7' : 'grid-cols-1'} gap-4 relative border-l border-gray-50`}>
                                        {HOURS.map((h, i) => (
                                            <div
                                                key={h}
                                                className="absolute w-full border-t border-gray-50 pointer-events-none"
                                                style={{ top: `${i * 80 + 8}px` }}
                                            ></div>
                                        ))}
                                        {calendarData.map((day, colIndex) => (
                                            <div key={colIndex} className="relative h-[1920px]">
                                                {[...activities, ...googleEvents].filter(e => e.fullDate === day.fullDate).map(event => {
                                                    const identity = getEventIdentity(event);
                                                    return (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            key={event.id}
                                                            onClick={() => setSelectedEvent(event)}
                                                            className={`absolute inset-x-1 rounded-2xl p-3 border shadow-md cursor-pointer hover:shadow-xl transition-all z-10 ${identity.bg} ${identity.text} ${identity.border}`}
                                                            style={{
                                                                top: `${(event.startHour) * 80 + 8}px`,
                                                                height: `${event.duration * 80}px`
                                                            }}
                                                        >
                                                            <div className="font-black text-xs leading-tight mb-1">{event.title}</div>
                                                            <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                                                                <div className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-white/20`}>
                                                                    {identity.label || (event.isEnrolled ? 'Confirmed' : 'Available')}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar (Span 3) */}
            <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto custom-scrollbar pr-1">
                {/* Next Mission Card */}
                <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl shadow-gray-200/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={80} strokeWidth={3} />
                    </div>
                    <span className="inline-block px-3 py-1 bg-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                        Next Mission
                    </span>
                    {nextMission ? (
                        <>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${getEventIdentity(nextMission).bg === 'bg-white' ? 'bg-blue-400' : 'bg-white'}`} />
                                <h3 className="text-xl font-black line-clamp-2 leading-tight">{nextMission.title}</h3>
                            </div>
                            <div className="space-y-3 mt-4">
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                        <CalendarIcon size={14} className="text-emerald-400" />
                                    </div>
                                    <span className="text-xs font-bold">{new Date(nextMission.start_time).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                        <Clock size={14} className="text-emerald-400" />
                                    </div>
                                    <span className="text-xs font-bold">10:00 AM - 1:00 PM</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                        <MapPin size={14} className="text-emerald-400" />
                                    </div>
                                    <span className="text-xs font-bold truncate">{nextMission.location.split('(')[0]}</span>
                                </div>
                            </div>
                            <button className="w-full mt-6 py-3 bg-white text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-black/10">
                                View Details
                            </button>
                        </>
                    ) : (
                        <p className="text-gray-400 text-xs italic">No upcoming missions found.</p>
                    )}
                </div>

                {/* Monthly Stats */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-500" />
                        Month Progress
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Missions</span>
                            <span className="text-2xl font-black text-gray-900">{enrolledCount}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Hours</span>
                            <span className="text-2xl font-black text-gray-900">{totalHours}h</span>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-500">Service Goal</span>
                            <span className="font-black text-emerald-600">85%</span>
                        </div>
                        <div className="h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '85%' }}
                                className="h-full bg-emerald-500 rounded-full shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100">
                                <CheckCircle2 size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-emerald-800 uppercase tracking-tight">On Track!</p>
                                <p className="text-[10px] text-emerald-600 font-bold leading-tight mt-0.5">Doing great this month, keep it up!</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="flex flex-col gap-3 mt-auto">
                    <button className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Plus size={18} className="text-blue-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black text-gray-900">Add Outside Event</p>
                                <p className="text-[10px] text-gray-400 font-bold">Sync personal tasks</p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
                    </button>
                    <button className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                <Users size={18} className="text-purple-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black text-gray-900">Team Calendar</p>
                                <p className="text-[10px] text-gray-400 font-bold">Coordination hub</p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Event Customization Popover */}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEvent(null)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[32px] w-full max-w-md shadow-2xl relative overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ${getEventIdentity(selectedEvent).light
                                            }`}>
                                            Edit Identity
                                        </span>
                                        <h3 className="text-2xl font-black text-gray-900 leading-tight">
                                            {selectedEvent.title}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setSelectedEvent(null)}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <Plus size={24} className="rotate-45 text-gray-400" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-3">
                                            Identity Color
                                        </label>
                                        <div className="flex flex-wrap gap-3">
                                            {tagColors.map((color) => (
                                                <button
                                                    key={color.name}
                                                    onClick={() => {
                                                        const current = customIdentities[selectedEvent.id] || {};
                                                        setCustomIdentities({
                                                            ...customIdentities,
                                                            [selectedEvent.id]: { ...current, color: color.name }
                                                        });
                                                    }}
                                                    className={`w-10 h-10 rounded-2xl transition-all ${color.bg} ${(customIdentities[selectedEvent.id]?.color === color.name || (!customIdentities[selectedEvent.id] && color.name === 'Emerald' && selectedEvent.isEnrolled))
                                                        ? 'ring-4 ring-offset-2 ring-gray-900 scale-110'
                                                        : 'opacity-40 hover:opacity-100 hover:scale-105'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-3">
                                            Custom Label (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Lead, Critical, Fun"
                                            defaultValue={customIdentities[selectedEvent.id]?.label || ''}
                                            onChange={(e) => {
                                                const current = customIdentities[selectedEvent.id] || { color: selectedEvent.isEnrolled ? 'Emerald' : 'Blue' };
                                                setCustomIdentities({
                                                    ...customIdentities,
                                                    [selectedEvent.id]: { ...current, label: e.target.value }
                                                });
                                            }}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button
                                        onClick={() => setSelectedEvent(null)}
                                        className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

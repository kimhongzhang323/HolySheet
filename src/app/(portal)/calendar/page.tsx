'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    Zap,
    Filter,
    Search,
    CheckSquare,
    X
} from 'lucide-react';
import { VOLUNTEER_ACTIVITIES, USER_ASSIGNMENTS, MOCK_GOOGLE_EVENTS } from '@/lib/mockData';
import QRCode from 'react-qr-code';

const getConflicts = (events: any[]) => {
    if (events.length < 2) return [];
    const sorted = [...events].sort((a, b) => a.startHour - b.startHour);
    const conflicts: { start: number; duration: number }[] = [];

    for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
            const a = sorted[i];
            const b = sorted[j];
            const start = Math.max(a.startHour, b.startHour);
            const end = Math.min(a.startHour + a.duration, b.startHour + b.duration);

            if (start < end) {
                conflicts.push({ start, duration: end - start });
            }
        }
    }
    return conflicts;
};

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
    const router = useRouter();
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

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'registered' | 'available' | 'google'>('all');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [filterLocation, setFilterLocation] = useState('');
    const [selectedEngagementLevels, setSelectedEngagementLevels] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(true);
    const [showQRModal, setShowQRModal] = useState(false);

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
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 800));

                // 1. Get Enrolled IDs from Mock Assignments
                // Assuming USER_ASSIGNMENTS are all 'confirmed' or 'approved'
                const registeredIds = USER_ASSIGNMENTS.map(a => a.id);
                setEnrolledIds(registeredIds as string[]);

                // 2. Use Mock Activities
                const rawData = VOLUNTEER_ACTIVITIES;

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

    const handleQuickRegister = async (eventId: string) => {
        try {
            setLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            setEnrolledIds(prev => [...prev, eventId]);
            setActivities(prev => prev.map(act =>
                act.id === eventId ? { ...act, isEnrolled: true } : act
            ));

            setSyncAlert({
                type: 'success',
                message: 'Successfully registered for activity!'
            });
            setSelectedEvent(null);
        } catch (error) {
            console.error("Registration error:", error);
            setSyncAlert({
                type: 'error',
                message: 'Failed to register. Please try again.'
            });
        } finally {
            setLoading(false);
            setTimeout(() => setSyncAlert(null), 5000);
        }
    };

    const handleUnregister = async (eventId: string) => {
        try {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1000));

            setEnrolledIds(prev => prev.filter(id => id !== eventId));
            setActivities(prev => prev.map(act =>
                act.id === eventId ? { ...act, isEnrolled: false } : act
            ));

            setSyncAlert({
                type: 'success',
                message: 'Successfully unregistered from activity.'
            });
            setSelectedEvent(null);
        } catch (error) {
            console.error("Unregistration error:", error);
        } finally {
            setLoading(false);
            setTimeout(() => setSyncAlert(null), 5000);
        }
    };

    const navigate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (selectedView === 'Week') newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        else if (selectedView === 'Day') newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        else newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    // Filter Logic
    const combinedEvents = [...activities, ...googleEvents];

    // Extract unique categories for filter
    const categories = Array.from(new Set(activities.map(act => act.category))).filter(Boolean);

    // Extract unique engagement levels
    const engagementLevels = Array.from(new Set(activities.map(act => act.engagement_frequency))).filter(Boolean);

    const filteredEvents = combinedEvents.filter(event => {
        // 1. Search Filter
        const matchesSearch = !searchQuery ||
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location?.toLowerCase().includes(searchQuery.toLowerCase());

        // 2. Status Filter
        let matchesStatus = true;
        if (filterStatus === 'registered') matchesStatus = !!event.isEnrolled;
        else if (filterStatus === 'available') matchesStatus = !event.isEnrolled && !event.isExternal;
        else if (filterStatus === 'google') matchesStatus = !!event.isExternal;

        // 3. Category Filter
        const eventCategory = (event.category || '').toLowerCase();
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.some(cat => eventCategory === cat.toLowerCase());

        // 4. Location Filter
        const matchesLocation = !filterLocation || event.location?.toLowerCase().includes(filterLocation.toLowerCase());

        // 5. Engagement Level Filter
        const matchesEngagement = selectedEngagementLevels.length === 0 ||
            (event.engagement_frequency && selectedEngagementLevels.includes(event.engagement_frequency));

        return matchesSearch && matchesStatus && matchesCategory && matchesLocation && matchesEngagement;
    });

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncAlert(null);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Use Mock Google Events
            const fetchedEvents = MOCK_GOOGLE_EVENTS.map((e: any) => ({
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

        // Google Calendar Events - Blue with distinct styling
        if (event.isExternal) {
            return {
                bg: 'bg-blue-500/90',
                text: 'text-white',
                border: 'border-blue-600 shadow-md',
                light: 'bg-blue-50 text-blue-700',
                label: '📅 Google'
            };
        }

        // Registered Events - Emerald/Green with high contrast
        if (event.isEnrolled) {
            return {
                bg: 'bg-emerald-500/90',
                text: 'text-white',
                border: 'border-emerald-600 shadow-lg shadow-emerald-50',
                light: 'bg-emerald-50 text-emerald-700',
                label: '✓ Registered'
            };
        }

        // Available events - categorized colors with dashed borders
        const cat = (event.category || '').toLowerCase();

        if (cat === 'community' || cat === 'hub') {
            return {
                bg: 'bg-amber-100/90',
                text: 'text-amber-800',
                border: 'border-amber-200 border-dashed',
                light: 'bg-amber-50 text-amber-600',
                label: 'Community'
            };
        }

        if (cat === 'education' || cat === 'skills') {
            return {
                bg: 'bg-purple-100/90',
                text: 'text-purple-800',
                border: 'border-purple-200 border-dashed',
                light: 'bg-purple-50 text-purple-600',
                label: 'Education'
            };
        }

        if (cat === 'environmental' || cat === 'environment' || cat === 'outings') {
            return {
                bg: 'bg-teal-100/90',
                text: 'text-teal-800',
                border: 'border-teal-200 border-dashed',
                light: 'bg-teal-50 text-teal-600',
                label: 'Outing'
            };
        }

        if (cat === 'befriending') {
            return {
                bg: 'bg-rose-100/90',
                text: 'text-rose-800',
                border: 'border-rose-200 border-dashed',
                light: 'bg-rose-50 text-rose-600',
                label: 'Befriending'
            };
        }

        // Default "Available" look
        return {
            bg: 'bg-indigo-50/90',
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
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`p-2 rounded-xl border transition-all ${isFilterOpen ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-gray-100 text-gray-400 hover:text-emerald-600'}`}
                        >
                            <Filter size={18} />
                        </button>
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
                                        const dayEvents = filteredEvents.filter(e => e.fullDate === day.fullDate);
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
                                        {calendarData.map((day, colIndex) => {
                                            const dayEvents = filteredEvents.filter(e => e.fullDate === day.fullDate);
                                            const conflicts = getConflicts(dayEvents);

                                            return (
                                                <div key={colIndex} className="relative h-[1920px] isolate">
                                                    {/* Conflict Overlays */}
                                                    {conflicts.map((conf, ci) => (
                                                        <div
                                                            key={`conf-${ci}`}
                                                            className="absolute inset-x-0 bg-red-500/10 border-y border-red-200/30 z-0"
                                                            style={{
                                                                top: `${conf.start * 80 + 8}px`,
                                                                height: `${conf.duration * 80}px`
                                                            }}
                                                        />
                                                    ))}

                                                    {dayEvents.map(event => {
                                                        const identity = getEventIdentity(event);
                                                        return (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 0.9, scale: 1 }}
                                                                whileHover={{ opacity: 1, scale: 1.02, zIndex: 50 }}
                                                                key={event.id}
                                                                onClick={() => setSelectedEvent(event)}
                                                                className={`absolute inset-x-1 rounded-2xl p-3 border shadow-md cursor-pointer hover:shadow-xl transition-all z-10 mix-blend-multiply ${identity.bg} ${identity.text} ${identity.border}`}
                                                                style={{
                                                                    top: `${(event.startHour) * 80 + 8}px`,
                                                                    height: `${event.duration * 80}px`
                                                                }}
                                                            >
                                                                <div className="font-black text-xs leading-tight mb-1 cursor-pointer">{event.title}</div>
                                                                <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                                                                    <div className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-white/20`}>
                                                                        {identity.label || (event.isEnrolled ? 'Confirmed' : 'Available')}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar (Span 3) */}
            <AnimatePresence>
                {isFilterOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0, x: 20 }}
                        animate={{ width: '320px', opacity: 1, x: 0 }}
                        exit={{ width: 0, opacity: 0, x: 20 }}
                        className="w-full xl:w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto custom-scrollbar pr-1"
                    >
                        {/* Filters Section */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <Filter size={16} className="text-emerald-500" />
                                    Filters
                                </h4>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setFilterStatus('all');
                                        setSelectedCategories([]);
                                        setFilterLocation('');
                                        setSelectedEngagementLevels([]);
                                    }}
                                    className="text-[10px] font-bold text-gray-400 hover:text-emerald-600 uppercase tracking-widest"
                                >
                                    Reset
                                </button>
                            </div>

                            {/* Search */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Event or location..."
                                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Registration Status */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Status</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'all', label: 'All', icon: <Users size={12} /> },
                                        { id: 'registered', label: 'Registered', icon: <CheckCircle2 size={12} /> },
                                        { id: 'available', label: 'Available', icon: <Clock size={12} /> },
                                        { id: 'google', label: 'Google', icon: <Zap size={12} /> }
                                    ].map((status) => (
                                        <button
                                            key={status.id}
                                            onClick={() => setFilterStatus(status.id as any)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${filterStatus === status.id
                                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                                                : 'bg-white text-gray-500 border-gray-100 hover:border-emerald-200'
                                                }`}
                                        >
                                            {status.icon}
                                            {status.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Categories</label>
                                <div className="space-y-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {categories.map((cat) => (
                                        <label key={cat} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                                            <div className={`w-4 h-4 rounded-lg border flex items-center justify-center transition-colors ${selectedCategories.includes(cat) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 group-hover:border-emerald-300'}`}>
                                                {selectedCategories.includes(cat) && <CheckSquare size={10} className="text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedCategories.includes(cat)}
                                                onChange={() => {
                                                    setSelectedCategories(prev =>
                                                        prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                                                    );
                                                }}
                                            />
                                            <span className="text-[11px] font-bold text-gray-600 capitalize">{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Engagement Levels */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Engagement Level</label>
                                <div className="space-y-1 pr-2">
                                    {[
                                        { id: 'adhoc', label: 'Ad-hoc' },
                                        { id: 'once_week', label: 'Once a Week' },
                                        { id: 'twice_week', label: 'Twice a Week' },
                                        { id: 'three_plus_week', label: '3+ per Week' }
                                    ].map((level) => (
                                        <label key={level.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                                            <div className={`w-4 h-4 rounded-lg border flex items-center justify-center transition-colors ${selectedEngagementLevels.includes(level.id) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 group-hover:border-emerald-300'}`}>
                                                {selectedEngagementLevels.includes(level.id) && <CheckSquare size={10} className="text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedEngagementLevels.includes(level.id)}
                                                onChange={() => {
                                                    setSelectedEngagementLevels(prev =>
                                                        prev.includes(level.id) ? prev.filter(l => l !== level.id) : [...prev, level.id]
                                                    );
                                                }}
                                            />
                                            <span className="text-[11px] font-bold text-gray-600">{level.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Next Mission Card */}
                        <div className="bg-gray-900 rounded-3xl text-white shadow-xl shadow-gray-200/50 relative overflow-hidden group shrink-0">
                            {/* Hero Image */}
                            {nextMission && (
                                <div className="relative h-32 w-full overflow-hidden">
                                    <img
                                        src={nextMission.image_url || nextMission.image}
                                        alt={nextMission.title}
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900" />
                                </div>
                            )}
                            <div className="p-6 pt-4 -mt-8 relative z-10">
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
                                                <span className="text-xs font-bold">
                                                    {new Date(nextMission.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(nextMission.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                                    <MapPin size={14} className="text-emerald-400" />
                                                </div>
                                                <span className="text-xs font-bold truncate">{nextMission.location?.split('(')[0]}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => window.open('tel:+6512345678')}
                                            className="w-full mt-6 py-3 bg-white text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                            </svg>
                                            Contact My Caregiver
                                        </button>

                                        {/* Quick Action Buttons - QR and Map */}
                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                            <button
                                                onClick={() => setShowQRModal(true)}
                                                className="flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all border border-white/20"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect width="5" height="5" x="3" y="3" rx="1" />
                                                    <rect width="5" height="5" x="16" y="3" rx="1" />
                                                    <rect width="5" height="5" x="3" y="16" rx="1" />
                                                    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                                                    <path d="M21 21v.01" />
                                                    <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                                                    <path d="M3 12h.01" />
                                                    <path d="M12 3h.01" />
                                                    <path d="M12 16v.01" />
                                                    <path d="M16 12h1" />
                                                    <path d="M21 12v.01" />
                                                    <path d="M12 21v-1" />
                                                </svg>
                                                Open QR
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const location = nextMission.location || 'Singapore';
                                                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
                                                }}
                                                className="flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all border border-white/20"
                                            >
                                                <MapPin size={16} />
                                                Open Map
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-gray-400 text-xs italic">No upcoming missions found.</p>
                                )}
                            </div>
                        </div>

                        {/* Monthly Stats */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6 shrink-0">
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
                    </motion.div>
                )}
            </AnimatePresence>

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
                            className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl relative overflow-hidden"
                        >
                            {/* Event Image Header */}
                            <div className="relative h-48 w-full overflow-hidden">
                                <img
                                    src={selectedEvent.image_url || selectedEvent.image || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80'}
                                    alt={selectedEvent.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md rounded-xl text-white hover:bg-black/40 transition-all"
                                >
                                    <X size={20} />
                                </button>
                                <div className="absolute bottom-4 left-6">
                                    <span className={`px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getEventIdentity(selectedEvent).text}`}>
                                        {getEventIdentity(selectedEvent).label || (selectedEvent.category || 'General')}
                                    </span>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="mb-6">
                                    <h3 className="text-2xl font-black text-gray-900 leading-tight mb-2">
                                        {selectedEvent.title}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                                        organized by <span className="text-emerald-600 underline cursor-pointer">{selectedEvent.organizer || 'HolySheet Community'}</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                            <CalendarIcon size={14} className="text-emerald-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Date</span>
                                            <span className="text-xs font-black text-gray-800">{new Date(selectedEvent.start_time).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                            <Clock size={14} className="text-emerald-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Time</span>
                                            <span className="text-xs font-black text-gray-800">
                                                {new Date(selectedEvent.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                            <MapPin size={14} className="text-emerald-500" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Location</span>
                                            <span className="text-xs font-black text-gray-800 truncate">{selectedEvent.location || 'Singapore'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">About this mission</h4>
                                    <p className="text-xs font-bold text-gray-600 line-clamp-3 leading-relaxed">
                                        {selectedEvent.description || 'Join us for this meaningful activity and make a difference in your community!'}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    {selectedEvent.isEnrolled ? (
                                        <button
                                            onClick={() => handleUnregister(selectedEvent.id)}
                                            disabled={loading}
                                            className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <X size={14} className="group-hover:scale-110 transition-transform" />
                                            {loading ? 'Processing...' : 'Unregister'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleQuickRegister(selectedEvent.id)}
                                            disabled={loading || selectedEvent.isExternal}
                                            className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200/50 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:bg-gray-400"
                                        >
                                            <Plus size={14} className="group-hover:scale-110 transition-transform" />
                                            {loading ? 'Registering...' : selectedEvent.isExternal ? 'Google Event' : 'Quick Register'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => router.push(`/events/${selectedEvent.id}`)}
                                        className="p-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* QR Code Modal */}
            <AnimatePresence>
                {showQRModal && nextMission && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowQRModal(false)}
                        />
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center"
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setShowQRModal(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>

                            {/* Title */}
                            <h3 className="text-lg font-black text-gray-900 mb-2">Your Event QR Code</h3>
                            <p className="text-sm text-gray-500 mb-6">{nextMission.title}</p>

                            {/* QR Code */}
                            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 inline-block mb-6">
                                <QRCode
                                    value={`jomcare://event/${nextMission.id}?user=${session?.user?.id || 'guest'}`}
                                    size={180}
                                    level="H"
                                />
                            </div>

                            {/* Instructions */}
                            <p className="text-xs text-gray-400 mb-4">
                                Show this QR code to the event organizer to check in
                            </p>

                            {/* Event Details */}
                            <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <CalendarIcon size={14} className="text-emerald-500" />
                                    {new Date(nextMission.start_time).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock size={14} className="text-emerald-500" />
                                    {new Date(nextMission.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin size={14} className="text-emerald-500" />
                                    {nextMission.location?.split('(')[0]}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

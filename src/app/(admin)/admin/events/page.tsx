
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, MapPin, Users, Clock, Filter, Plus, Search, MoreVertical, Loader2, AlertCircle, ChevronLeft, ChevronRight, CalendarDays, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

interface Activity {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    volunteers_needed: number;
    volunteers_registered: number;
    skills_required: string[];
    status: string;
}

export default function EventsPage() {
    const { data: session } = useSession();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'asc' });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // Grid of 3x2 ideal

    // Weekly View State
    const [viewMode, setViewMode] = useState<'grid' | 'weekly'>('grid');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedWeek, setSelectedWeek] = useState(0); // 0 to 4 (approx 4 weeks)

    useEffect(() => {
        if (session?.accessToken) {
            fetchActivities();
        }
    }, [session]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            if (!session?.accessToken) return;

            const res = await fetch('/api/admin/activities', {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            });

            if (!res.ok) throw new Error('Failed to fetch activities');

            const data = await res.json();
            setActivities(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (activity: Activity) => {
        const fillRate = activity.volunteers_needed > 0
            ? (activity.volunteers_registered / activity.volunteers_needed) * 100
            : 0;

        if (fillRate >= 100) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (fillRate < 50) return 'bg-rose-50 text-rose-700 border-rose-100';
        return 'bg-amber-50 text-amber-700 border-amber-100';
    };

    const getStatusText = (activity: Activity) => {
        const fillRate = activity.volunteers_needed > 0
            ? (activity.volunteers_registered / activity.volunteers_needed) * 100
            : 0;

        if (fillRate >= 100) return 'Fully Booked';
        if (fillRate < 50) return 'Critical Shortage';
        return 'Filling Up';
    };

    // Navigation Logic
    const nextMonth = () => {
        const next = new Date(currentMonth);
        next.setMonth(currentMonth.getMonth() + 1);
        setCurrentMonth(next);
        setSelectedWeek(0);
    };

    const prevMonth = () => {
        const prev = new Date(currentMonth);
        prev.setMonth(currentMonth.getMonth() - 1);
        setCurrentMonth(prev);
        setSelectedWeek(0);
    };

    // Filtering Logic
    const getFilteredActivities = () => {
        let filtered = [...activities];

        // 1. Search Filter (Always applied)
        filtered = filtered.filter(act =>
            act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            act.location?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // 2. View Mode Logic
        if (viewMode === 'weekly') {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();

            // Calculate start/end dates for Selected Week
            // Week 0: 1st - 7th
            // Week 1: 8th - 14th
            // Week 2: 15th - 21st
            // Week 3: 22nd - End of Month
            const startDay = (selectedWeek * 7) + 1;
            const endDay = selectedWeek === 3 ? 31 : startDay + 6; // Last week covers rest of month

            filtered = filtered.filter(act => {
                const actDate = new Date(act.start_time);
                return (
                    actDate.getFullYear() === year &&
                    actDate.getMonth() === month &&
                    actDate.getDate() >= startDay &&
                    actDate.getDate() <= endDay
                );
            });

            // Weekly view always sorts by date
            filtered.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        } else {
            // 'grid' mode sorting
            filtered.sort((a, b) => {
                if (sortConfig.key === 'date') {
                    return sortConfig.direction === 'asc'
                        ? new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                        : new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
                }
                if (sortConfig.key === 'title') {
                    return sortConfig.direction === 'asc'
                        ? a.title.localeCompare(b.title)
                        : b.title.localeCompare(a.title);
                }
                if (sortConfig.key === 'urgency') {
                    // Calculate shortage (needed - registered)
                    const shortageA = Math.max(0, a.volunteers_needed - a.volunteers_registered);
                    const shortageB = Math.max(0, b.volunteers_needed - b.volunteers_registered);
                    return sortConfig.direction === 'asc'
                        ? shortageA - shortageB
                        : shortageB - shortageA;
                }
                return 0;
            });
        }

        return filtered;
    };

    const displayedActivities = getFilteredActivities();

    // Pagination Logic
    const totalItems = displayedActivities.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedActivities = displayedActivities.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, viewMode, selectedWeek, sortConfig]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white relative p-8">
            {/* Header */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Events & Activities</h1>
                        <p className="text-gray-500">Manage all volunteer activities and track participation.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        {/* View Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('weekly')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'weekly' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <CalendarDays size={18} />
                            </button>
                        </div>

                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 shadow-sm"
                            />
                        </div>

                        {/* Sort Dropdown (Only separate when in grid mode, or kept for consistency) */}
                        {viewMode === 'grid' && (
                            <div className="relative group">
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 shadow-sm transition-all whitespace-nowrap">
                                    <Filter size={16} />
                                    Sort: <span className="text-indigo-600 font-bold capitalize">{sortConfig.key}</span>
                                </button>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 transform origin-top-right">
                                    <button onClick={() => setSortConfig({ key: 'date', direction: 'asc' })} className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 ${sortConfig.key === 'date' && sortConfig.direction === 'asc' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600'}`}>Date: Earliest First</button>
                                    <button onClick={() => setSortConfig({ key: 'date', direction: 'desc' })} className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 ${sortConfig.key === 'date' && sortConfig.direction === 'desc' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600'}`}>Date: Latest First</button>
                                    <div className="h-px bg-gray-100 my-1"></div>
                                    <button onClick={() => setSortConfig({ key: 'urgency', direction: 'desc' })} className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 ${sortConfig.key === 'urgency' && sortConfig.direction === 'desc' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600'}`}>Shortage: High to Low</button>
                                    <div className="h-px bg-gray-100 my-1"></div>
                                    <button onClick={() => setSortConfig({ key: 'title', direction: 'asc' })} className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 ${sortConfig.key === 'title' && sortConfig.direction === 'asc' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600'}`}>Name: A - Z</button>
                                </div>
                            </div>
                        )}

                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#101828] text-white text-sm font-bold rounded-lg hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all whitespace-nowrap">
                            <Plus size={16} />
                            Create Event
                        </button>
                    </div>
                </div>
            </div>

            {/* Weekly View Controls */}
            {viewMode === 'weekly' && (
                <div className="mb-6 space-y-4">
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-4">
                            <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-sm hover:shadow">
                                <ChevronLeft size={20} className="text-gray-600" />
                            </button>
                            <h2 className="text-lg font-bold text-gray-900 min-w-[140px] text-center">
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h2>
                            <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-sm hover:shadow">
                                <ChevronRight size={20} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                            {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((w, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedWeek(idx)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${selectedWeek === idx
                                        ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {w}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-6">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedActivities.length === 0 && !loading && (
                    <div className="col-span-full py-16 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium text-lg text-gray-900">No events found</p>
                        <p className="text-sm mt-1">
                            {viewMode === 'weekly'
                                ? `No events scheduled for Week ${selectedWeek + 1} of ${currentMonth.toLocaleDateString('en-US', { month: 'long' })}`
                                : "Try adjusting your search or filters"
                            }
                        </p>
                    </div>
                )}

                {paginatedActivities.map((activity) => (
                    <Link key={activity.id} href={`/admin/events/${activity.id}`}>
                        <div className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden h-full">
                            {/* Status Badge */}
                            <div className={`absolute top-5 right-5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(activity)}`}>
                                {getStatusText(activity)}
                            </div>

                            <div className="mb-4">
                                <h3 className="font-bold text-gray-900 text-lg mb-1 pr-24 truncate">{activity.title}</h3>
                                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                                    <Clock size={14} />
                                    <span>
                                        {new Date(activity.start_time).toLocaleDateString()} • {new Date(activity.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-5">
                                <div className="flex items-start gap-2.5">
                                    <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-gray-600 line-clamp-1">{activity.location}</p>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <Users size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-sm text-gray-600">Volunteers</span>
                                            <span className="text-xs font-bold text-gray-900">{activity.volunteers_registered} / {activity.volunteers_needed}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${(activity.volunteers_registered / activity.volunteers_needed) >= 1 ? 'bg-emerald-500' : 'bg-indigo-500'
                                                    }`}
                                                style={{ width: `${Math.min(100, (activity.volunteers_registered / Math.max(1, activity.volunteers_needed)) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    {[...Array(Math.min(3, activity.volunteers_registered))].map((_, i) => (
                                        <div key={i} className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-500">
                                        </div>
                                    ))}
                                    {activity.volunteers_registered > 3 && (
                                        <div className="w-7 h-7 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[9px] font-bold text-gray-500">
                                            +{activity.volunteers_registered - 3}
                                        </div>
                                    )}
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View Details</button>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-6 mt-8">
                    <p className="text-sm text-gray-500 hidden sm:block">
                        Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to <span className="font-bold text-gray-900">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-bold text-gray-900">{totalItems}</span> results
                    </p>

                    <div className="flex items-center gap-2 mx-auto sm:mx-0">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={20} className="text-gray-600" />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => goToPage(page)}
                                className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${currentPage === page
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={20} className="text-gray-600" />
                        </button>
                    </div>
                </div>
            )}
        </div>

    );
}

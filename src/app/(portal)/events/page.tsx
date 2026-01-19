'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, QrCode, Users, Heart, Sparkles, SlidersHorizontal, ChevronDown, Building2, Palette, Clock, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// Constants
const CATEGORIES = [
    { id: 'all', label: 'All Activities', icon: Sparkles },
    { id: 'befriending', label: 'Befriending', icon: Heart },
    { id: 'hub', label: 'Hub Activities', icon: Building2 },
    { id: 'skills', label: 'Skills-Based', icon: Palette },
    { id: 'outings', label: 'Outings', icon: MapPin },
];

const ACTIVITY_TYPES = [
    'All Types',
    'Care Circle',
    'Befriending',
    'Hub Support',
    'Creative',
    'Excursion',
    'Training Support',
];

const ENGAGEMENT_FREQUENCIES = [
    'All Engagements',
    'Ad Hoc',
    'Once a Week',
    'Twice a Week',
    '3 or More Times a Week',
];

const LOCATIONS = [
    'All Locations',
    'MINDS Hub (Clementi)',
    'MINDS Hub (Ang Mo Kio)',
    'MINDS Hub (Tampines)',
    'Me Too! Club',
    'Satellite Hubs',
    'Remote',
    'Various Locations',
];

interface VolunteerActivity {
    id: string;
    title: string;
    type?: string;
    activity_type?: string;
    category: string;
    engagement_frequency?: string;
    organizer?: string;
    organizer_label?: string;
    description?: string;
    location?: string;
    schedule?: string;
    start_time: string;
    end_time?: string;
    image_url?: string;
    tags?: string[];
    volunteers_needed?: number;
    // Computed fields for UI
    date?: string;
    month?: string;
    year?: string;
}

export default function EventsPage() {
    const router = useRouter();
    const [activities, setActivities] = useState<VolunteerActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedActivity, setSelectedActivity] = useState<VolunteerActivity | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedActivityType, setSelectedActivityType] = useState('All Types');
    const [selectedLocation, setSelectedLocation] = useState('All Locations');
    const [selectedEngagement, setSelectedEngagement] = useState('All Engagements');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [showQRModal, setShowQRModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [qrEventData, setQrEventData] = useState<VolunteerActivity | null>(null);

    // Events user has enrolled in (Care Circle VOL001) - TODO: Fetch from User Bookings
    const enrolledEventIds = ['VOL001'];

    useEffect(() => {
        async function fetchActivities() {
            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('activities')
                    .select('*')
                    .order('start_time', { ascending: true });

                if (error) throw error;

                if (data) {
                    const mappedActivities = data.map((act: any) => {
                        const startDate = new Date(act.start_time);
                        return {
                            ...act,
                            date: startDate.getDate().toString(),
                            month: startDate.toLocaleString('default', { month: 'long' }).toUpperCase(),
                            year: startDate.getFullYear().toString(),
                        };
                    });
                    setActivities(mappedActivities);
                }
            } catch (err) {
                console.error('Error fetching activities:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchActivities();
    }, []);

    // Check if user is enrolled in an event
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isEnrolled = (eventId: string) => enrolledEventIds.includes(eventId);

    // Map engagement frequency to display label
    const getEngagementLabel = (frequency?: string) => {
        switch (frequency) {
            case 'adhoc': return 'Ad Hoc';
            case 'once_week': return 'Once a Week';
            case 'twice_week': return 'Twice a Week';
            case 'three_plus_week': return '3+ Times/Week';
            default: return frequency;
        }
    };

    // Map engagement filter to value
    const getEngagementValue = (label: string) => {
        switch (label) {
            case 'Ad Hoc': return 'adhoc';
            case 'Once a Week': return 'once_week';
            case 'Twice a Week': return 'twice_week';
            case '3 or More Times a Week': return 'three_plus_week';
            default: return null;
        }
    };

    // Filter activities
    const filteredActivities = activities.filter(activity => {
        const matchesSearch =
            activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (activity.organizer && activity.organizer.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (activity.location && activity.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (activity.tags && activity.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())));

        const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
        const matchesActivityType = selectedActivityType === 'All Types' || activity.activity_type === selectedActivityType;
        const matchesLocation = selectedLocation === 'All Locations' || activity.location === selectedLocation;
        const engagementValue = getEngagementValue(selectedEngagement);
        const matchesEngagement = selectedEngagement === 'All Engagements' || activity.engagement_frequency === engagementValue;

        return matchesSearch && matchesCategory && matchesActivityType && matchesLocation && matchesEngagement;
    });

    // Get category color
    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'befriending': return 'bg-pink-100 text-pink-700';
            case 'hub': return 'bg-blue-100 text-blue-700';
            case 'skills': return 'bg-purple-100 text-purple-700';
            case 'outings': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Get engagement badge color
    const getEngagementBadgeColor = (frequency?: string) => {
        switch (frequency) {
            case 'adhoc': return 'bg-amber-100 text-amber-700';
            case 'once_week': return 'bg-teal-100 text-teal-700';
            case 'twice_week': return 'bg-indigo-100 text-indigo-700';
            case 'three_plus_week': return 'bg-rose-100 text-rose-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Check if any filter is active
    const hasActiveFilters = selectedActivityType !== 'All Types' || selectedLocation !== 'All Locations' || selectedEngagement !== 'All Engagements';

    // Clear all filters
    const clearFilters = () => {
        setSelectedActivityType('All Types');
        setSelectedLocation('All Locations');
        setSelectedEngagement('All Engagements');
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, selectedActivityType, selectedLocation, selectedEngagement]);

    // Calculate pagination
    const totalItems = filteredActivities.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Volunteer Opportunities</h1>
                    <p className="text-sm text-gray-500">Make a difference in the lives of persons with intellectual disabilities</p>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap items-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
                {CATEGORIES.map((category) => (
                    <motion.button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === category.id
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        whileTap={{ scale: 0.98 }}
                    >
                        <category.icon size={16} />
                        {category.label}
                        {category.id !== 'all' && (
                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${selectedCategory === category.id ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {activities.filter(e => e.category === category.id).length}
                            </span>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Search and Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search activities, programmes, locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all ${showFilters || hasActiveFilters
                        ? 'bg-green-50 border-green-200 text-green-600'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                >
                    <SlidersHorizontal size={16} />
                    Filters
                    {hasActiveFilters && (
                        <span className="w-5 h-5 bg-green-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                            {(selectedActivityType !== 'All Types' ? 1 : 0) + (selectedLocation !== 'All Locations' ? 1 : 0) + (selectedEngagement !== 'All Engagements' ? 1 : 0)}
                        </span>
                    )}
                </button>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Filter Activities</h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-green-500 hover:text-green-600 font-medium"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Activity Type Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
                                    <div className="relative">
                                        <select
                                            value={selectedActivityType}
                                            onChange={(e) => setSelectedActivityType(e.target.value)}
                                            className="w-full appearance-none px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 pr-10 cursor-pointer"
                                        >
                                            {ACTIVITY_TYPES.map((type: string) => (
                                                <option key={type} value={type} className="text-gray-900 bg-white py-2">{type}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Engagement Frequency Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Clock size={14} className="inline mr-1" />
                                        Engagement Frequency
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedEngagement}
                                            onChange={(e) => setSelectedEngagement(e.target.value)}
                                            className="w-full appearance-none px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 pr-10 cursor-pointer"
                                        >
                                            {ENGAGEMENT_FREQUENCIES.map((freq: string) => (
                                                <option key={freq} value={freq} className="text-gray-900 bg-white py-2">{freq}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Location Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                    <div className="relative">
                                        <select
                                            value={selectedLocation}
                                            onChange={(e) => setSelectedLocation(e.target.value)}
                                            className="w-full appearance-none px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 pr-10 cursor-pointer"
                                        >
                                            {LOCATIONS.map((loc: string) => (
                                                <option key={loc} value={loc} className="text-gray-900 bg-white py-2">{loc}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Count */}
            <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-900">{totalItems > 0 ? `${startIndex + 1}-${endIndex}` : '0'}</span> of <span className="font-semibold text-gray-900">{totalItems}</span> volunteer opportunities
                {selectedCategory !== 'all' && (
                    <> in <span className="font-semibold text-gray-900">{CATEGORIES.find(c => c.id === selectedCategory)?.label}</span></>
                )}
                {hasActiveFilters && (
                    <span className="text-green-500"> (filtered)</span>
                )}
            </p>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Activities Grid - Ticket Style Cards */}
            {!isLoading && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {paginatedActivities.map((activity, index) => (
                            <motion.div
                                key={activity.id}
                                layoutId={activity.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                onClick={() => router.push(`/events/${activity.id}`)}
                                className="group cursor-pointer"
                            >
                                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 flex">
                                    {/* Left: Activity Image */}
                                    <motion.div
                                        layoutId={`${activity.id}-image`}
                                        className="w-32 md:w-40 shrink-0 relative overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={activity.image_url}
                                            alt={activity.title}
                                            className="w-full h-full object-cover absolute inset-0 group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        {/* Category Badge */}
                                        {activity.category && (
                                            <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(activity.category)}`}>
                                                {activity.category}
                                            </div>
                                        )}

                                        {/* Engagement Frequency Badge */}
                                        {activity.engagement_frequency && (
                                            <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold ${getEngagementBadgeColor(activity.engagement_frequency)}`}>
                                                <Clock size={10} className="inline mr-1" />
                                                {getEngagementLabel(activity.engagement_frequency)}
                                            </div>
                                        )}
                                    </motion.div>

                                    {/* Middle: Content */}
                                    <div className="flex-1 p-5 md:p-6">
                                        {/* Title */}
                                        <motion.h3
                                            layoutId={`${activity.id}-title`}
                                            className="text-xl font-bold text-gray-900 mb-1"
                                        >
                                            <span className="text-green-600">{activity.title}</span>{' '}
                                            {activity.type && <span className="text-gray-400 font-normal">{activity.type}</span>}
                                        </motion.h3>

                                        {/* Organizer */}
                                        {activity.organizer && (
                                            <p className="text-sm text-gray-500 mb-2">
                                                {activity.organizer_label || 'Programme'}: <span className="text-gray-700">{activity.organizer}</span>
                                            </p>
                                        )}

                                        {/* Location */}
                                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                                            <MapPin size={12} className="text-gray-400" />
                                            <span className={activity.location === 'To Be Confirmed' ? 'italic text-gray-400' : ''}>
                                                {activity.location || 'Location TBC'}
                                            </span>
                                        </div>

                                        {/* Schedule Row */}
                                        {activity.schedule && (
                                            <div className="text-sm text-gray-600 mb-3">
                                                <span className="font-medium">{activity.schedule}</span>
                                            </div>
                                        )}

                                        {/* Date and Spots Row */}
                                        <div className="flex items-end gap-6">
                                            <div>
                                                <span className="text-4xl font-bold text-gray-900 leading-none">{activity.date}</span>
                                                <span className="block text-xs text-green-500 font-medium mt-1">{activity.month} {activity.year}</span>
                                            </div>
                                            {activity.volunteers_needed !== undefined && (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Users size={14} className="text-green-500" />
                                                    <span className="text-green-600 font-semibold">{activity.volunteers_needed} spots left</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: QR Code / Join */}
                                    <div
                                        className={`w-20 md:w-24 shrink-0 border-l border-dashed border-gray-200 flex flex-col items-center justify-center p-3 cursor-pointer bg-gray-50/50 hover:bg-gray-100 transition-colors`}
                                        onClick={() => router.push(`/events/${activity.id}`)}
                                    >
                                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
                                            <QrCode className="w-8 h-8 md:w-10 md:h-10 text-gray-700" />
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-2 text-center">
                                            View
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{endIndex}</span> of{' '}
                                        <span className="font-medium">{totalItems}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => goToPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <span className="sr-only">Previous</span>
                                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                        </button>

                                        {/* Example Page Numbers - Simplified for now, can be expanded */}
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            // Logic to show current page surroundings
                                            let pageNum = i + 1;
                                            if (totalPages > 5 && currentPage > 3) {
                                                pageNum = currentPage - 2 + i;
                                                if (pageNum > totalPages) pageNum -= (pageNum - totalPages);
                                            }

                                            // Simple clamp for this example to stick to valid range
                                            if (pageNum > totalPages) return null;

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => goToPage(pageNum)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                                        ? 'z-10 bg-green-50 border-green-500 text-green-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => goToPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <span className="sr-only">Next</span>
                                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </nav>
                                </div>
                            </div>

                            {/* Mobile Pagination (Simplified) */}
                            <div className="flex items-center justify-between sm:hidden w-full">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-700">
                                    Page {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredActivities.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200"
                >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">No volunteer opportunities found</p>
                    <p className="text-gray-400 text-sm mb-4">Try adjusting your search or filters</p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-green-500 hover:text-green-600 font-medium"
                        >
                            Clear all filters
                        </button>
                    )}
                </motion.div>
            )}

            {/* Activity Detail Modal - Only for QR now if needed, removing the quick view for simplicity as we navigate to detail page */}
        </div>
    );
}

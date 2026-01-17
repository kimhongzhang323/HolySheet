'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, ArrowUpRight, QrCode, Users, Heart, Sparkles, SlidersHorizontal, ChevronDown, Building2, Palette, Clock, CheckCircle2 } from 'lucide-react';
import QRCodeSVG from 'react-qr-code';

// Volunteer Category definitions
const CATEGORIES = [
    { id: 'all', label: 'All Activities', icon: Sparkles },
    { id: 'befriending', label: 'Befriending', icon: Heart },
    { id: 'hub', label: 'Hub Activities', icon: Building2 },
    { id: 'skills', label: 'Skills-Based', icon: Palette },
    { id: 'outings', label: 'Outings', icon: MapPin },
];

// Activity types for filtering
const ACTIVITY_TYPES = [
    'All Types',
    'Care Circle',
    'Befriending',
    'Hub Support',
    'Creative',
    'Excursion',
    'Training Support',
];

// Engagement frequency options
const ENGAGEMENT_FREQUENCIES = [
    'All Engagements',
    'Ad Hoc',
    'Once a Week',
    'Twice a Week',
    '3 or More Times a Week',
];

// Locations for filtering (MINDS centers)
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

// Volunteer activities data based on MINDS programs
const VOLUNTEER_ACTIVITIES = [
    {
        _id: 'VOL001',
        title: 'CARE CIRCLE',
        type: 'VOLUNTEER',
        activityType: 'Care Circle',
        category: 'befriending',
        engagementFrequency: 'once_week',
        organizer: 'MINDS Care Circle Programme',
        organizerLabel: 'Programme',
        description: 'Be a friend to persons with intellectual disabilities (PWIDs). Build meaningful relationships through regular befriending sessions, activities, and community outings. Training provided for all new volunteers.',
        location: 'MINDS Hub (Clementi)',
        schedule: 'Every Saturday, 10:00 AM - 1:00 PM',
        start_time: '10:00',
        end_time: '13:00',
        date: '18',
        month: 'JANUARY',
        year: '2026',
        tags: ['BEFRIENDING', 'PWID', 'COMMUNITY'],
        spotsLeft: 8,
        image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=600&fit=crop',
        requirements: ['18 years and above', 'Commit for at least 6 months'],
    },
    {
        _id: 'VOL002',
        title: 'WEEKDAY HUB',
        type: 'VOLUNTEER',
        activityType: 'Hub Support',
        category: 'hub',
        engagementFrequency: 'three_plus_week',
        organizer: 'MINDS Community Hub',
        organizerLabel: 'Centre',
        description: 'Support Training Officers during daily programmes and activities. Assist with arts & crafts, music sessions, sports activities, and life skills training for PWIDs.',
        location: 'MINDS Hub (Ang Mo Kio)',
        schedule: 'Mon-Fri, 9:00 AM - 4:00 PM (Flexible)',
        start_time: '09:00',
        end_time: '16:00',
        date: '20',
        month: 'JANUARY',
        year: '2026',
        tags: ['HUB', 'TRAINING', 'ACTIVITIES'],
        spotsLeft: 5,
        image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=600&fit=crop',
        requirements: ['Weekday availability', 'Patient and caring nature'],
    },
    {
        _id: 'VOL003',
        title: 'WEEKEND MYG',
        type: 'BEFRIENDER',
        activityType: 'Befriending',
        category: 'befriending',
        engagementFrequency: 'once_week',
        organizer: 'MINDS Youth Group',
        organizerLabel: 'Programme',
        description: 'Join the MINDS Youth Group as a weekend befriender! Engage young adults with intellectual disabilities through fun recreational activities, games, and social outings.',
        location: 'Various Locations',
        schedule: 'Saturdays OR Sundays, 2:00 PM - 5:00 PM',
        start_time: '14:00',
        end_time: '17:00',
        date: '25',
        month: 'JANUARY',
        year: '2026',
        tags: ['YOUTH', 'BEFRIENDING', 'RECREATION'],
        spotsLeft: 12,
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=600&fit=crop',
        requirements: ['Weekend availability', 'Age 18-35 preferred'],
    },
    {
        _id: 'VOL004',
        title: 'HOME',
        type: 'BEFRIENDER',
        activityType: 'Befriending',
        category: 'befriending',
        engagementFrequency: 'once_week',
        organizer: 'Me Too! Club',
        organizerLabel: 'Programme',
        description: 'Visit PWIDs at their homes and build a lasting friendship. Engage in conversations, simple activities, and provide companionship to those who may have limited social interactions.',
        location: 'Client Homes (Islandwide)',
        schedule: 'Flexible - 2 hours per week',
        start_time: '10:00',
        end_time: '12:00',
        date: '22',
        month: 'JANUARY',
        year: '2026',
        tags: ['HOME VISIT', 'BEFRIENDING', 'COMPANIONSHIP'],
        spotsLeft: 15,
        image: 'https://picsum.photos/seed/home-befriend/400/600',
        requirements: ['Commit for at least 1 year', 'Background check required'],
    },
    {
        _id: 'VOL005',
        title: 'ME TOO! CLUB',
        type: 'ACTIVITY',
        activityType: 'Hub Support',
        category: 'hub',
        engagementFrequency: 'twice_week',
        organizer: 'Me Too! Club',
        organizerLabel: 'Centre',
        description: 'Support rehabilitative activities at Me Too! Club. Help facilitate arts, music therapy, exercise sessions, and social skills programmes for PWIDs.',
        location: 'Me Too! Club',
        schedule: 'Tue & Thu, 2:00 PM - 5:00 PM',
        start_time: '14:00',
        end_time: '17:00',
        date: '21',
        month: 'JANUARY',
        year: '2026',
        tags: ['REHABILITATION', 'ACTIVITIES', 'THERAPY'],
        spotsLeft: 6,
        image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=600&fit=crop',
        requirements: ['Twice weekly commitment', 'Interest in therapeutic activities'],
    },
    {
        _id: 'VOL006',
        title: 'GRAPHIC',
        type: 'DESIGNER',
        activityType: 'Creative',
        category: 'skills',
        engagementFrequency: 'adhoc',
        organizer: 'MINDS Communications',
        organizerLabel: 'Department',
        description: 'Use your creative skills to design marketing materials, event posters, social media graphics, and newsletters for MINDS. Work remotely on project basis.',
        location: 'Remote',
        schedule: 'Flexible - Project Based',
        start_time: 'Flexible',
        end_time: 'Flexible',
        date: '01',
        month: 'FEBRUARY',
        year: '2026',
        tags: ['DESIGN', 'CREATIVE', 'REMOTE'],
        spotsLeft: 3,
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=600&fit=crop',
        requirements: ['Proficiency in design software', 'Portfolio required'],
    },
    {
        _id: 'VOL007',
        title: 'PHOTO',
        type: 'VOLUNTEER',
        activityType: 'Creative',
        category: 'skills',
        engagementFrequency: 'adhoc',
        organizer: 'MINDS Communications',
        organizerLabel: 'Department',
        description: 'Capture meaningful moments at MINDS events and activities. Help document the journey of PWIDs and create lasting memories through photography.',
        location: 'Various Locations',
        schedule: 'Event-based',
        start_time: '09:00',
        end_time: '17:00',
        date: '15',
        month: 'FEBRUARY',
        year: '2026',
        tags: ['PHOTOGRAPHY', 'EVENTS', 'DOCUMENTATION'],
        spotsLeft: 4,
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=600&fit=crop',
        requirements: ['Own camera equipment', 'Event photography experience'],
    },
    {
        _id: 'VOL008',
        title: 'VIDEO',
        type: 'EDITOR',
        activityType: 'Creative',
        category: 'skills',
        engagementFrequency: 'adhoc',
        organizer: 'MINDS Communications',
        organizerLabel: 'Department',
        description: 'Create compelling video content for MINDS. Edit event highlights, testimonial videos, and promotional content to raise awareness about PWIDs.',
        location: 'Remote',
        schedule: 'Flexible - Project Based',
        start_time: 'Flexible',
        end_time: 'Flexible',
        date: '01',
        month: 'MARCH',
        year: '2026',
        tags: ['VIDEO', 'EDITING', 'CONTENT'],
        spotsLeft: 2,
        image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=600&fit=crop',
        requirements: ['Video editing software proficiency', 'Showreel required'],
    },
    {
        _id: 'VOL009',
        title: 'GROUP',
        type: 'OUTING',
        activityType: 'Excursion',
        category: 'outings',
        engagementFrequency: 'adhoc',
        organizer: 'MINDS Community Outreach',
        organizerLabel: 'Programme',
        description: 'Accompany PWIDs on exciting community outings! Visit parks, museums, shopping malls, and recreational venues. Help create joyful experiences outside the hub.',
        location: 'Various Locations',
        schedule: 'Monthly - Weekends',
        start_time: '09:00',
        end_time: '16:00',
        date: '08',
        month: 'FEBRUARY',
        year: '2026',
        tags: ['OUTING', 'RECREATION', 'COMMUNITY'],
        spotsLeft: 20,
        image: 'https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?w=400&h=600&fit=crop',
        requirements: ['Physical fitness for walking', 'Patience and adaptability'],
    },
    {
        _id: 'VOL010',
        title: 'SATELLITE',
        type: 'HUB',
        activityType: 'Hub Support',
        category: 'hub',
        engagementFrequency: 'twice_week',
        organizer: 'MINDS Satellite Hub',
        organizerLabel: 'Centre',
        description: 'Support activities at MINDS Satellite Hub. Help with daily programmes, meal times, and recreational activities in a smaller, more intimate setting.',
        location: 'Satellite Hubs',
        schedule: 'Wed & Fri, 10:00 AM - 3:00 PM',
        start_time: '10:00',
        end_time: '15:00',
        date: '22',
        month: 'JANUARY',
        year: '2026',
        tags: ['SATELLITE', 'HUB', 'SUPPORT'],
        spotsLeft: 8,
        image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=600&fit=crop',
        requirements: ['Twice weekly commitment', 'Basic first aid knowledge preferred'],
    },
];

interface VolunteerActivity {
    _id: string;
    title: string;
    type: string;
    activityType: string;
    category: string;
    engagementFrequency: string;
    organizer: string;
    organizerLabel?: string;
    description: string;
    location: string;
    schedule: string;
    start_time: string;
    end_time: string;
    date: string;
    month: string;
    year: string;
    tags: string[];
    spotsLeft?: number;
    image: string;
    requirements?: string[];
}

export default function EventsPage() {
    const router = useRouter();
    const [activities] = useState<VolunteerActivity[]>(VOLUNTEER_ACTIVITIES);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedActivity, setSelectedActivity] = useState<VolunteerActivity | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedActivityType, setSelectedActivityType] = useState('All Types');
    const [selectedLocation, setSelectedLocation] = useState('All Locations');
    const [selectedEngagement, setSelectedEngagement] = useState('All Engagements');
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrEventData, setQrEventData] = useState<VolunteerActivity | null>(null);

    // Events user has enrolled in (Care Circle VOL001)
    const enrolledEventIds = ['VOL001'];

    // Check if user is enrolled in an event
    const isEnrolled = (eventId: string) => enrolledEventIds.includes(eventId);

    // Handle QR code click for enrolled events
    const handleQRClick = (activity: VolunteerActivity, e: React.MouseEvent) => {
        e.stopPropagation();
        setQrEventData(activity);
        setShowQRModal(true);
    };

    // Map engagement frequency to display label
    const getEngagementLabel = (frequency: string) => {
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

    // Filter activities based on search, category, activity type, location, and engagement
    const filteredActivities = activities.filter(activity => {
        const matchesSearch =
            activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
        const matchesActivityType = selectedActivityType === 'All Types' || activity.activityType === selectedActivityType;
        const matchesLocation = selectedLocation === 'All Locations' || activity.location === selectedLocation;
        const engagementValue = getEngagementValue(selectedEngagement);
        const matchesEngagement = selectedEngagement === 'All Engagements' || activity.engagementFrequency === engagementValue;

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
    const getEngagementBadgeColor = (frequency: string) => {
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
                Showing <span className="font-semibold text-gray-900">{filteredActivities.length}</span> volunteer opportunities
                {selectedCategory !== 'all' && (
                    <> in <span className="font-semibold text-gray-900">{CATEGORIES.find(c => c.id === selectedCategory)?.label}</span></>
                )}
                {hasActiveFilters && (
                    <span className="text-green-500"> (filtered)</span>
                )}
            </p>

            {/* Activities Grid - Ticket Style Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredActivities.map((activity: VolunteerActivity, index: number) => (
                    <motion.div
                        key={activity._id}
                        layoutId={activity._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        onClick={() => setSelectedActivity(activity)}
                        className="group cursor-pointer"
                    >
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 flex">
                            {/* Left: Activity Image */}
                            <motion.div
                                layoutId={`${activity._id}-image`}
                                className="w-32 md:w-40 shrink-0 relative overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={activity.image}
                                    alt={activity.title}
                                    className="w-full h-full object-cover absolute inset-0 group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                {/* Category Badge */}
                                <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(activity.category)}`}>
                                    {activity.category}
                                </div>

                                {/* Engagement Frequency Badge */}
                                <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold ${getEngagementBadgeColor(activity.engagementFrequency)}`}>
                                    <Clock size={10} className="inline mr-1" />
                                    {getEngagementLabel(activity.engagementFrequency)}
                                </div>
                            </motion.div>

                            {/* Middle: Content */}
                            <div className="flex-1 p-5 md:p-6">
                                {/* Title */}
                                <motion.h3
                                    layoutId={`${activity._id}-title`}
                                    className="text-xl font-bold text-gray-900 mb-1"
                                >
                                    <span className="text-green-600">{activity.title}</span>{' '}
                                    <span className="text-gray-400 font-normal">{activity.type}</span>
                                </motion.h3>

                                {/* Organizer */}
                                <p className="text-sm text-gray-500 mb-2">
                                    {activity.organizerLabel || 'Programme'}: <span className="text-gray-700">{activity.organizer}</span>
                                </p>

                                {/* Location */}
                                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                                    <MapPin size={12} className="text-gray-400" />
                                    <span className={activity.location === 'To Be Confirmed' ? 'italic text-gray-400' : ''}>
                                        {activity.location}
                                    </span>
                                </div>

                                {/* Schedule Row */}
                                <div className="text-sm text-gray-600 mb-3">
                                    <span className="font-medium">{activity.schedule}</span>
                                </div>

                                {/* Date and Spots Row */}
                                <div className="flex items-end gap-6">
                                    <div>
                                        <span className="text-4xl font-bold text-gray-900 leading-none">{activity.date}</span>
                                        <span className="block text-xs text-green-500 font-medium mt-1">{activity.month} {activity.year}</span>
                                    </div>
                                    {activity.spotsLeft !== undefined && (
                                        <div className="flex items-center gap-1 text-sm">
                                            <Users size={14} className="text-green-500" />
                                            <span className="text-green-600 font-semibold">{activity.spotsLeft} spots left</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: QR Code / Join */}
                            <div
                                className={`w-20 md:w-24 shrink-0 border-l border-dashed border-gray-200 flex flex-col items-center justify-center p-3 ${isEnrolled(activity._id) ? 'bg-emerald-50/50 cursor-pointer hover:bg-emerald-100/50 transition-colors' : 'bg-gray-50/50'}`}
                                onClick={isEnrolled(activity._id) ? (e) => handleQRClick(activity, e) : undefined}
                            >
                                {isEnrolled(activity._id) ? (
                                    <>
                                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-lg border-2 border-emerald-200 flex items-center justify-center shadow-sm">
                                            <QrCode className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
                                        </div>
                                        <span className="text-[10px] text-emerald-600 mt-2 text-center font-semibold flex items-center gap-0.5">
                                            <CheckCircle2 size={10} />
                                            Enrolled
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
                                            <QrCode className="w-8 h-8 md:w-10 md:h-10 text-gray-700" />
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-2 text-center">
                                            Join
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Empty State */}
            {filteredActivities.length === 0 && (
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

            {/* Activity Detail Modal */}
            <AnimatePresence>
                {selectedActivity && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedActivity(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            layoutId={selectedActivity._id}
                            className="fixed inset-4 lg:inset-16 z-50 bg-[#f5f2f0] rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row"
                        >
                            {/* Left: Image */}
                            <motion.div
                                layoutId={`${selectedActivity._id}-image`}
                                className="w-full lg:w-1/2 h-48 lg:h-auto relative overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={selectedActivity.image}
                                    alt={selectedActivity.title}
                                    className="w-full h-full object-cover absolute inset-0"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                <button
                                    onClick={() => setSelectedActivity(null)}
                                    className="absolute top-4 left-4 lg:hidden bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                {/* Category Badge - Top Left */}
                                <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getCategoryColor(selectedActivity.category)}`}>
                                    {selectedActivity.category}
                                </div>

                                {/* Engagement Badge - Top Right */}
                                <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold ${getEngagementBadgeColor(selectedActivity.engagementFrequency)}`}>
                                    <Clock size={12} className="inline mr-1" />
                                    {getEngagementLabel(selectedActivity.engagementFrequency)}
                                </div>

                                {/* Large Date Display */}
                                <div className="absolute bottom-8 left-8 text-white">
                                    <span className="block text-8xl font-bold leading-none drop-shadow-lg">
                                        {selectedActivity.date}
                                    </span>
                                    <span className="text-lg font-medium tracking-widest opacity-90">
                                        {selectedActivity.month} {selectedActivity.year}
                                    </span>
                                </div>
                            </motion.div>

                            {/* Right: Content */}
                            <div className="flex-1 p-8 lg:p-12 overflow-y-auto relative bg-[#f5f2f0]">
                                <button
                                    onClick={() => setSelectedActivity(null)}
                                    className="hidden lg:block absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    <X size={24} />
                                </button>

                                {/* Title */}
                                <motion.h2
                                    layoutId={`${selectedActivity._id}-title`}
                                    className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2 tracking-tight leading-tight"
                                >
                                    <span className="text-green-600">{selectedActivity.title}</span>{' '}
                                    <span className="text-gray-400 font-normal">{selectedActivity.type}</span>
                                </motion.h2>

                                {/* Organizer */}
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-lg text-gray-600 mb-6"
                                >
                                    {selectedActivity.organizerLabel || 'Programme'}: <span className="font-semibold text-gray-900">{selectedActivity.organizer}</span>
                                </motion.p>

                                {/* Schedule & Time Info */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex flex-wrap items-start gap-8 mb-6 p-4 bg-white rounded-xl"
                                >
                                    <div>
                                        <span className="text-xs text-gray-400 block">Schedule</span>
                                        <span className="text-lg font-bold text-gray-900">{selectedActivity.schedule}</span>
                                    </div>
                                    {selectedActivity.spotsLeft !== undefined && (
                                        <div>
                                            <span className="text-xs text-gray-400 block">Spots Left</span>
                                            <span className="text-2xl font-bold text-green-500">{selectedActivity.spotsLeft}</span>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Location */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex items-center gap-3 text-gray-600 mb-6"
                                >
                                    <MapPin size={18} />
                                    <span className={`font-medium ${selectedActivity.location === 'To Be Confirmed' ? 'italic text-gray-400' : ''}`}>
                                        {selectedActivity.location}
                                    </span>
                                </motion.div>

                                {/* Description */}
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-gray-600 leading-relaxed mb-6 text-lg"
                                >
                                    {selectedActivity.description}
                                </motion.p>

                                {/* Requirements */}
                                {selectedActivity.requirements && selectedActivity.requirements.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.45 }}
                                        className="mb-6"
                                    >
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Requirements:</h4>
                                        <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                                            {selectedActivity.requirements.map((req: string, idx: number) => (
                                                <li key={idx}>{req}</li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}

                                {/* Tags */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex flex-wrap gap-2 mb-8"
                                >
                                    {selectedActivity.tags.map((tag: string) => (
                                        <span
                                            key={tag}
                                            className="px-4 py-2 border border-gray-300 rounded text-xs font-bold text-gray-600 tracking-wider"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </motion.div>

                                {/* CTA Button */}
                                {isEnrolled(selectedActivity._id) ? (
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setSelectedActivity(null);
                                            setQrEventData(selectedActivity);
                                            setShowQRModal(true);
                                        }}
                                        className="w-full lg:w-auto px-8 py-4 font-bold tracking-wider rounded-full transition-colors flex items-center justify-center gap-3 bg-emerald-500 text-white hover:bg-emerald-600"
                                    >
                                        <CheckCircle2 size={20} />
                                        ALREADY ENROLLED - SHOW QR
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => router.push(`/events/${selectedActivity._id}`)}
                                        className="w-full lg:w-auto px-8 py-4 font-bold tracking-wider rounded-full transition-colors flex items-center justify-center gap-3 bg-green-600 text-white hover:bg-green-700"
                                    >
                                        <Heart size={20} />
                                        APPLY TO VOLUNTEER
                                        <ArrowUpRight size={20} />
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* QR Code Attendance Modal */}
            <AnimatePresence>
                {showQRModal && qrEventData && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowQRModal(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
                                {/* Modal Header */}
                                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white relative">
                                    <button
                                        onClick={() => setShowQRModal(false)}
                                        className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 size={18} />
                                        <span className="text-sm font-medium opacity-90">You&apos;re Enrolled!</span>
                                    </div>
                                    <h3 className="text-xl font-bold">Attendance QR Code</h3>
                                    <p className="text-white/80 text-sm mt-1">Show this to the admin for check-in</p>
                                </div>

                                {/* QR Code */}
                                <div className="p-8 flex flex-col items-center">
                                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
                                        <QRCodeSVG
                                            value={JSON.stringify({
                                                eventId: qrEventData._id,
                                                eventName: qrEventData.title,
                                                location: qrEventData.location,
                                                date: `${qrEventData.date} ${qrEventData.month} ${qrEventData.year}`,
                                                time: `${qrEventData.start_time} - ${qrEventData.end_time}`,
                                                timestamp: Date.now()
                                            })}
                                            size={200}
                                            level="H"
                                        />
                                    </div>

                                    {/* Event Details */}
                                    <div className="mt-6 text-center">
                                        <h4 className="font-bold text-gray-900 text-lg">{qrEventData.title}</h4>
                                        <p className="text-gray-500 text-sm flex items-center justify-center gap-1 mt-1">
                                            <MapPin size={12} />
                                            {qrEventData.location}
                                        </p>
                                        <div className="flex items-center justify-center gap-4 mt-3 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} className="text-emerald-500" />
                                                {qrEventData.date} {qrEventData.month}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} className="text-blue-500" />
                                                {qrEventData.start_time} - {qrEventData.end_time}
                                            </span>
                                        </div>
                                    </div>

                                    {/* ID */}
                                    <div className="mt-6 px-4 py-2 bg-emerald-50 rounded-full">
                                        <span className="text-xs text-emerald-600 font-medium">✓ Enrolled & Ready for Check-in</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}


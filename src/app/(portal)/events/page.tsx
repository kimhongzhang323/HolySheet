'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, ArrowUpRight, QrCode, Calendar, Users, Heart, Sparkles, SlidersHorizontal, ChevronDown } from 'lucide-react';

// Category definitions
const CATEGORIES = [
    { id: 'all', label: 'All Events', icon: Sparkles },
    { id: 'volunteer', label: 'Volunteer', icon: Heart },
    { id: 'meetup', label: 'Meetups', icon: Users },
    { id: 'conference', label: 'Big Events', icon: Calendar },
];

// Event types for filtering
const EVENT_TYPES = [
    'All Types',
    'Music',
    'Food',
    'Art',
    'Tech',
    'Business',
    'Sports',
    'Education',
    'Environment',
    'Community',
];

// Locations for filtering
const LOCATIONS = [
    'All Locations',
    'Singapore',
    'Malaysia',
    'Japan',
    'Hong Kong',
    'United States',
    'United Kingdom',
    'Others',
];

// Mock events data with categories and images
const MOCK_EVENTS = [
    {
        _id: 'VOL001',
        title: 'BEACH',
        type: 'CLEANUP',
        eventType: 'Environment',
        category: 'volunteer',
        artists: 'Green Earth Foundation',
        artistLabel: 'Organizer',
        description: 'Join us for a beach cleanup initiative! Help preserve marine life and keep our beaches beautiful. All cleaning supplies provided.',
        location: 'Sentosa Beach, Singapore',
        country: 'Singapore',
        start_time: '08:00',
        end_time: '12:00',
        date: '18',
        month: 'JANUARY',
        year: '2026',
        tags: ['VOLUNTEER', 'ENVIRONMENT', 'OUTDOOR'],
        attendees: 45,
        spotsLeft: 15,
        image: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=400&h=600&fit=crop',
    },
    {
        _id: 'TKY20394823',
        title: 'MUSIC',
        type: 'FESTIVAL',
        eventType: 'Music',
        category: 'conference',
        artists: 'DJ Nova, LUNA',
        description: 'An electrifying night of music featuring top DJs and live performances. Experience the best beats and immersive visuals.',
        location: 'Tokyo Dome, Japan',
        country: 'Japan',
        start_time: '17:00',
        end_time: '23:00',
        date: '27',
        month: 'AUGUST',
        year: '2025',
        tags: ['MUSIC', 'DJ', 'ENTERTAINMENT'],
        attendees: 5000,
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=600&fit=crop',
    },
    {
        _id: 'MTU002',
        title: 'TECH',
        type: 'MEETUP',
        eventType: 'Tech',
        category: 'meetup',
        artists: 'Local Developers',
        artistLabel: 'Community',
        description: 'Monthly tech meetup for developers. Share knowledge, network, and learn about the latest in web development.',
        location: 'WeWork Orchard, Singapore',
        country: 'Singapore',
        start_time: '19:00',
        end_time: '21:30',
        date: '22',
        month: 'JANUARY',
        year: '2026',
        tags: ['TECH', 'NETWORKING', 'DEVELOPERS'],
        attendees: 35,
        spotsLeft: 25,
        image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=600&fit=crop',
    },
    {
        _id: 'VOL003',
        title: 'FOOD',
        type: 'DRIVE',
        eventType: 'Food',
        category: 'volunteer',
        artists: 'Community Kitchen',
        artistLabel: 'Organizer',
        description: 'Help distribute meals to the elderly and less privileged families in the neighborhood. Make a difference in someones day!',
        location: 'Tampines Community Center, Singapore',
        country: 'Singapore',
        start_time: '10:00',
        end_time: '14:00',
        date: '25',
        month: 'JANUARY',
        year: '2026',
        tags: ['VOLUNTEER', 'COMMUNITY', 'FOOD'],
        attendees: 20,
        spotsLeft: 10,
        image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=600&fit=crop',
    },
    {
        _id: 'SGP99482101',
        title: 'STARTUP',
        type: 'SUMMIT',
        eventType: 'Business',
        category: 'conference',
        artists: 'Industry Leaders',
        artistLabel: 'Speakers',
        description: 'Connect with investors, mentors, and fellow entrepreneurs. Pitch your ideas and discover opportunities.',
        location: 'Marina Bay Sands, Singapore',
        country: 'Singapore',
        start_time: '09:00',
        end_time: '18:00',
        date: '15',
        month: 'FEBRUARY',
        year: '2026',
        tags: ['BUSINESS', 'STARTUP', 'INVESTMENT'],
        attendees: 450,
        image: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=400&h=600&fit=crop',
    },
    {
        _id: 'MTU004',
        title: 'BOOK',
        type: 'CLUB',
        eventType: 'Education',
        category: 'meetup',
        artists: 'Reading Society',
        artistLabel: 'Host',
        description: 'Monthly book club meeting. This month we are discussing "Atomic Habits". New members welcome!',
        location: 'To Be Confirmed',
        country: 'Singapore',
        start_time: '15:00',
        end_time: '17:00',
        date: '28',
        month: 'JANUARY',
        year: '2026',
        tags: ['BOOKS', 'SOCIAL', 'DISCUSSION'],
        attendees: 12,
        spotsLeft: 8,
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop',
    },
    {
        _id: 'VOL005',
        title: 'TEACHING',
        type: 'WORKSHOP',
        eventType: 'Education',
        category: 'volunteer',
        artists: 'CodeForGood',
        artistLabel: 'Program',
        description: 'Teach basic coding skills to underprivileged youth. No teaching experience required, just passion to help!',
        location: 'Community Library, Jurong East, Singapore',
        country: 'Singapore',
        start_time: '14:00',
        end_time: '17:00',
        date: '01',
        month: 'FEBRUARY',
        year: '2026',
        tags: ['VOLUNTEER', 'EDUCATION', 'CODING'],
        attendees: 8,
        spotsLeft: 4,
        image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=600&fit=crop',
    },
    {
        _id: 'NYC88723456',
        title: 'ART',
        type: 'EXHIBITION',
        eventType: 'Art',
        category: 'conference',
        artists: 'Various Artists',
        artistLabel: 'Featured',
        description: 'A curated collection of contemporary art from emerging and established artists around the world.',
        location: 'National Gallery, Singapore',
        country: 'Singapore',
        start_time: '10:00',
        end_time: '20:00',
        date: '03',
        month: 'MARCH',
        year: '2026',
        tags: ['ART', 'CULTURE', 'EXHIBITION'],
        attendees: 890,
        image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=600&fit=crop',
    },
];

interface Event {
    _id: string;
    title: string;
    type: string;
    eventType: string;
    category: string;
    artists: string;
    artistLabel?: string;
    description: string;
    location: string;
    country: string;
    start_time: string;
    end_time: string;
    date: string;
    month: string;
    year: string;
    tags: string[];
    attendees?: number;
    spotsLeft?: number;
    image: string;
}

export default function EventsPage() {
    const [events] = useState<Event[]>(MOCK_EVENTS);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedEventType, setSelectedEventType] = useState('All Types');
    const [selectedLocation, setSelectedLocation] = useState('All Locations');

    // Filter events based on search, category, event type, and location
    const filteredEvents = events.filter(event => {
        const matchesSearch =
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.artists.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
        const matchesEventType = selectedEventType === 'All Types' || event.eventType === selectedEventType;
        const matchesLocation = selectedLocation === 'All Locations' || event.country === selectedLocation;

        return matchesSearch && matchesCategory && matchesEventType && matchesLocation;
    });

    // Get category color
    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'volunteer': return 'bg-green-100 text-green-700';
            case 'meetup': return 'bg-blue-100 text-blue-700';
            case 'conference': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Check if any filter is active
    const hasActiveFilters = selectedEventType !== 'All Types' || selectedLocation !== 'All Locations';

    // Clear all filters
    const clearFilters = () => {
        setSelectedEventType('All Types');
        setSelectedLocation('All Locations');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Discover Events</h1>
                    <p className="text-sm text-gray-500">Find events to attend or volunteer opportunities to make a difference</p>
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
                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${selectedCategory === category.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {events.filter(e => e.category === category.id).length}
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
                        placeholder="Search events, organizers, locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all ${showFilters || hasActiveFilters
                        ? 'bg-orange-50 border-orange-200 text-orange-600'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                >
                    <SlidersHorizontal size={16} />
                    Filters
                    {hasActiveFilters && (
                        <span className="w-5 h-5 bg-orange-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                            {(selectedEventType !== 'All Types' ? 1 : 0) + (selectedLocation !== 'All Locations' ? 1 : 0)}
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
                                <h3 className="font-semibold text-gray-900">Filter Events</h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Event Type Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                                    <div className="relative">
                                        <select
                                            value={selectedEventType}
                                            onChange={(e) => setSelectedEventType(e.target.value)}
                                            className="w-full appearance-none px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 pr-10 cursor-pointer"
                                        >
                                            {EVENT_TYPES.map(type => (
                                                <option key={type} value={type} className="text-gray-900 bg-white py-2">{type}</option>
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
                                            className="w-full appearance-none px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 pr-10 cursor-pointer"
                                        >
                                            {LOCATIONS.map(loc => (
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
                Showing <span className="font-semibold text-gray-900">{filteredEvents.length}</span> events
                {selectedCategory !== 'all' && (
                    <> in <span className="font-semibold text-gray-900">{CATEGORIES.find(c => c.id === selectedCategory)?.label}</span></>
                )}
                {hasActiveFilters && (
                    <span className="text-orange-500"> (filtered)</span>
                )}
            </p>

            {/* Events Grid - Ticket Style Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredEvents.map((event, index) => (
                    <motion.div
                        key={event._id}
                        layoutId={event._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        onClick={() => setSelectedEvent(event)}
                        className="group cursor-pointer"
                    >
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 flex">
                            {/* Left: Event Image */}
                            <motion.div
                                layoutId={`${event._id}-image`}
                                className="w-32 md:w-40 shrink-0 relative overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    className="w-full h-full object-cover absolute inset-0 group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                {/* Category Badge */}
                                <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(event.category)}`}>
                                    {event.category}
                                </div>
                            </motion.div>

                            {/* Middle: Content */}
                            <div className="flex-1 p-5 md:p-6">
                                {/* Title */}
                                <motion.h3
                                    layoutId={`${event._id}-title`}
                                    className="text-xl font-bold text-gray-900 mb-1"
                                >
                                    <span className="text-blue-600">{event.title}</span>{' '}
                                    <span className="text-gray-400 font-normal">{event.type}</span>
                                </motion.h3>

                                {/* Organizer */}
                                <p className="text-sm text-gray-500 mb-2">
                                    {event.artistLabel || 'Artist(s)'}: <span className="text-gray-700">{event.artists}</span>
                                </p>

                                {/* Location */}
                                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                                    <MapPin size={12} className="text-gray-400" />
                                    <span className={event.location === 'To Be Confirmed' ? 'italic text-gray-400' : ''}>
                                        {event.location}
                                    </span>
                                </div>

                                {/* Time Row */}
                                <div className="flex items-start gap-6 mb-3">
                                    <div>
                                        <span className="text-xs text-gray-400 block">Start</span>
                                        <span className="text-lg font-semibold text-gray-900">{event.start_time}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-400 block">End</span>
                                        <span className="text-lg font-semibold text-gray-900">{event.end_time}</span>
                                    </div>
                                </div>

                                {/* Date and Spots Row */}
                                <div className="flex items-end gap-6">
                                    <div>
                                        <span className="text-4xl font-bold text-gray-900 leading-none">{event.date}</span>
                                        <span className="block text-xs text-blue-500 font-medium mt-1">{event.month} {event.year}</span>
                                    </div>
                                    {event.spotsLeft !== undefined && (
                                        <div className="flex items-center gap-1 text-sm">
                                            <Users size={14} className="text-orange-500" />
                                            <span className="text-orange-600 font-semibold">{event.spotsLeft} spots left</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: QR Code */}
                            <div className="w-20 md:w-24 shrink-0 border-l border-dashed border-gray-200 flex flex-col items-center justify-center p-3 bg-gray-50/50">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
                                    <QrCode className="w-8 h-8 md:w-10 md:h-10 text-gray-700" />
                                </div>
                                <span className="text-[10px] text-gray-400 mt-2 text-center">
                                    {event.category === 'volunteer' ? 'Join' : 'RSVP'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Empty State */}
            {filteredEvents.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200"
                >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">No events found</p>
                    <p className="text-gray-400 text-sm mb-4">Try adjusting your search or filters</p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                        >
                            Clear all filters
                        </button>
                    )}
                </motion.div>
            )}

            {/* Event Detail Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEvent(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            layoutId={selectedEvent._id}
                            className="fixed inset-4 lg:inset-16 z-50 bg-[#f5f2f0] rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row"
                        >
                            {/* Left: Image */}
                            <motion.div
                                layoutId={`${selectedEvent._id}-image`}
                                className="w-full lg:w-1/2 h-48 lg:h-auto relative overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={selectedEvent.image}
                                    alt={selectedEvent.title}
                                    className="w-full h-full object-cover absolute inset-0"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="absolute top-4 left-4 lg:hidden bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                {/* Category Badge */}
                                <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getCategoryColor(selectedEvent.category)}`}>
                                    {selectedEvent.category}
                                </div>

                                {/* Large Date Display */}
                                <div className="absolute bottom-8 left-8 text-white">
                                    <span className="block text-8xl font-bold leading-none drop-shadow-lg">
                                        {selectedEvent.date}
                                    </span>
                                    <span className="text-lg font-medium tracking-widest opacity-90">
                                        {selectedEvent.month} {selectedEvent.year}
                                    </span>
                                </div>
                            </motion.div>

                            {/* Right: Content */}
                            <div className="flex-1 p-8 lg:p-12 overflow-y-auto relative bg-[#f5f2f0]">
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="hidden lg:block absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    <X size={24} />
                                </button>

                                {/* Title */}
                                <motion.h2
                                    layoutId={`${selectedEvent._id}-title`}
                                    className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2 tracking-tight leading-tight"
                                >
                                    <span className="text-blue-600">{selectedEvent.title}</span>{' '}
                                    <span className="text-gray-400 font-normal">{selectedEvent.type}</span>
                                </motion.h2>

                                {/* Organizer */}
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-lg text-gray-600 mb-6"
                                >
                                    {selectedEvent.artistLabel || 'Organizer'}: <span className="font-semibold text-gray-900">{selectedEvent.artists}</span>
                                </motion.p>

                                {/* Time Info */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex items-start gap-8 mb-6 p-4 bg-white rounded-xl"
                                >
                                    <div>
                                        <span className="text-xs text-gray-400 block">Start</span>
                                        <span className="text-2xl font-bold text-gray-900">{selectedEvent.start_time}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-400 block">End</span>
                                        <span className="text-2xl font-bold text-gray-900">{selectedEvent.end_time}</span>
                                    </div>
                                    {selectedEvent.spotsLeft !== undefined && (
                                        <div>
                                            <span className="text-xs text-gray-400 block">Spots Left</span>
                                            <span className="text-2xl font-bold text-orange-500">{selectedEvent.spotsLeft}</span>
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
                                    <span className={`font-medium ${selectedEvent.location === 'To Be Confirmed' ? 'italic text-gray-400' : ''}`}>
                                        {selectedEvent.location}
                                    </span>
                                </motion.div>

                                {/* Description */}
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-gray-600 leading-relaxed mb-8 text-lg"
                                >
                                    {selectedEvent.description}
                                </motion.p>

                                {/* Tags */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex flex-wrap gap-2 mb-8"
                                >
                                    {selectedEvent.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="px-4 py-2 border border-gray-300 rounded text-xs font-bold text-gray-600 tracking-wider"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </motion.div>

                                {/* CTA Button */}
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full lg:w-auto px-8 py-4 font-bold tracking-wider rounded-full transition-colors flex items-center justify-center gap-3 ${selectedEvent.category === 'volunteer'
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                >
                                    {selectedEvent.category === 'volunteer' ? 'VOLUNTEER NOW' : 'GET TICKETS'}
                                    <ArrowUpRight size={20} />
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

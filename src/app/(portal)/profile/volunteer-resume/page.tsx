'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Save, Heart, BookOpen, Users, Leaf,
    GraduationCap, Stethoscope, Home, Utensils, Palette,
    Code, CheckCircle, Clock, Plus, Pencil, Trash2, Lock, X, Upload, FileText, Image
} from 'lucide-react';

// Skill options
const SKILLS = [
    { id: 'communication', label: 'Communication', icon: Users },
    { id: 'leadership', label: 'Leadership', icon: Users },
    { id: 'teamwork', label: 'Teamwork', icon: Users },
    { id: 'teaching', label: 'Teaching', icon: GraduationCap },
    { id: 'firstaid', label: 'First Aid', icon: Stethoscope },
    { id: 'cooking', label: 'Cooking', icon: Utensils },
    { id: 'driving', label: 'Driving', icon: Home },
    { id: 'photography', label: 'Photography', icon: Palette },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'coding', label: 'Coding', icon: Code },
    { id: 'writing', label: 'Writing', icon: BookOpen },
    { id: 'languages', label: 'Multiple Languages', icon: BookOpen },
];

// Interest/cause options
const INTERESTS = [
    { id: 'environment', label: 'Environment', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'education', label: 'Education', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'elderly', label: 'Elderly Care', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'children', label: 'Children & Youth', color: 'bg-pink-100 text-pink-700 border-pink-200' },
    { id: 'animals', label: 'Animal Welfare', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 'food', label: 'Food Security', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { id: 'health', label: 'Healthcare', color: 'bg-red-100 text-red-700 border-red-200' },
    { id: 'arts', label: 'Arts & Culture', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { id: 'disaster', label: 'Disaster Relief', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    { id: 'community', label: 'Community Service', color: 'bg-teal-100 text-teal-700 border-teal-200' },
];

// Volunteer event interface
interface VolunteerEvent {
    id: string;
    title: string;
    organization: string;
    date: string; // Display date or date range
    startDate?: string; // For periods (YYYY-MM-DD)
    endDate?: string; // For periods (YYYY-MM-DD)
    hours: number;
    category: string;
    source: 'app' | 'external'; // 'app' = from HolySheet (locked), 'external' = user-added (editable)
    proof?: {
        fileName: string;
        fileType: 'pdf' | 'image';
        fileUrl: string; // In real app, this would be a URL from file storage
    };
}

// Portfolio item interface
interface PortfolioItem {
    id: string;
    title: string;
    description?: string;
    type: 'link' | 'pdf' | 'image';
    url: string; // URL or File URL
    fileName?: string; // For files
}

// Mock past volunteer events (would come from API)
const INITIAL_VOLUNTEER_EVENTS: VolunteerEvent[] = [
    {
        id: '1',
        title: 'Beach Cleanup',
        organization: 'Green Earth Foundation',
        date: '15 Dec 2025',
        hours: 4,
        category: 'Environment',
        source: 'app',
    },
    {
        id: '2',
        title: 'Food Distribution',
        organization: 'Community Kitchen',
        date: '10 Dec 2025',
        hours: 5,
        category: 'Food Security',
        source: 'app',
    },
    {
        id: '3',
        title: 'Teaching Workshop',
        organization: 'CodeForGood',
        date: '28 Nov 2025',
        hours: 3,
        category: 'Education',
        source: 'app',
    },
    {
        id: '4',
        title: 'Hospital Volunteering',
        organization: 'National Hospital',
        date: 'Aug - Oct 2024',
        startDate: '2024-08-01',
        endDate: '2024-10-31',
        hours: 20,
        category: 'Healthcare',
        source: 'external',
    },
];

// Initial resume data (would come from API)
const INITIAL_RESUME = {
    bio: 'Passionate about making a difference in the community. I have experience in organizing community events and enjoy working with diverse groups of people.',
    skills: ['communication', 'teamwork', 'teaching'],
    interests: ['environment', 'education', 'community'],
    availability: 'weekends',
    portfolio: [
        {
            id: 'p1',
            title: 'Community Center Rebrand',
            description: 'Full branding package for local community center.',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1572044162444-ad60f128bde2?w=800&q=80',
            fileName: 'branding_preview.jpg'
        },
        {
            id: 'p2',
            title: 'Volunteer Match Dashboard',
            description: 'UI/UX design for a non-profit dashboard.',
            type: 'link',
            url: 'https://behance.net/portfolio/vmatch',
        }
    ]
};

export default function VolunteerResumePage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form state
    const [bio, setBio] = useState(INITIAL_RESUME.bio);
    const [selectedSkills, setSelectedSkills] = useState<string[]>(INITIAL_RESUME.skills);
    const [selectedInterests, setSelectedInterests] = useState<string[]>(INITIAL_RESUME.interests);
    const [selectedAvailability, setSelectedAvailability] = useState<string[]>(['weekends', 'mornings']);

    // Volunteer history state
    const [volunteerEvents, setVolunteerEvents] = useState<VolunteerEvent[]>(INITIAL_VOLUNTEER_EVENTS);
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<VolunteerEvent | null>(null);

    // Portfolio state
    const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(INITIAL_RESUME.portfolio as PortfolioItem[]);
    const [showPortfolioModal, setShowPortfolioModal] = useState(false);
    const [editingPortfolio, setEditingPortfolio] = useState<PortfolioItem | null>(null);

    // Portfolio modal state
    const [portfolioTitle, setPortfolioTitle] = useState('');
    const [portfolioDescription, setPortfolioDescription] = useState('');
    const [portfolioType, setPortfolioType] = useState<'link' | 'pdf' | 'image'>('link');
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [portfolioFile, setPortfolioFile] = useState<{ fileName: string; fileType: 'pdf' | 'image'; fileUrl: string } | null>(null);

    // Modal form state
    const [eventTitle, setEventTitle] = useState('');
    const [eventOrganization, setEventOrganization] = useState('');
    const [eventStartDate, setEventStartDate] = useState('');
    const [eventEndDate, setEventEndDate] = useState('');
    const [eventHours, setEventHours] = useState('');
    const [eventCategory, setEventCategory] = useState('');
    const [isPeriod, setIsPeriod] = useState(false); // Toggle for single date vs date range
    const [proofFile, setProofFile] = useState<{ fileName: string; fileType: 'pdf' | 'image'; fileUrl: string } | null>(null);

    // Handle proof file upload
    const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';
        const fileUrl = URL.createObjectURL(file); // In real app, upload to server

        setProofFile({
            fileName: file.name,
            fileType: fileType as 'pdf' | 'image',
            fileUrl
        });
    };

    const toggleSkill = (skillId: string) => {
        setSelectedSkills(prev =>
            prev.includes(skillId)
                ? prev.filter(s => s !== skillId)
                : [...prev, skillId]
        );
    };

    const toggleInterest = (interestId: string) => {
        setSelectedInterests(prev =>
            prev.includes(interestId)
                ? prev.filter(i => i !== interestId)
                : [...prev, interestId]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsSaving(false);
        setShowSuccess(true);

        setTimeout(() => {
            setShowSuccess(false);
        }, 3000);
    };

    // Format date for display (e.g., "15 Dec 2025" or "Aug - Oct 2024")
    const formatDateForDisplay = (startDate: string, endDate?: string): string => {
        const formatDate = (dateStr: string) => {
            const date = new Date(dateStr);
            const day = date.getDate();
            const month = date.toLocaleString('en-US', { month: 'short' });
            const year = date.getFullYear();
            return `${day} ${month} ${year}`;
        };

        if (endDate && endDate !== startDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const startMonth = start.toLocaleString('en-US', { month: 'short' });
            const endMonth = end.toLocaleString('en-US', { month: 'short' });
            const startYear = start.getFullYear();
            const endYear = end.getFullYear();

            if (startYear === endYear) {
                return `${startMonth} - ${endMonth} ${endYear}`;
            }
            return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
        }
        return formatDate(startDate);
    };

    // Open modal to add new experience
    const handleAddExperience = () => {
        setEditingEvent(null);
        setEventTitle('');
        setEventOrganization('');
        setEventStartDate('');
        setEventEndDate('');
        setEventHours('');
        setEventCategory('');
        setIsPeriod(false);
        setProofFile(null);
        setShowEventModal(true);
    };

    // Open modal to edit existing experience
    const handleEditEvent = (event: VolunteerEvent) => {
        setEditingEvent(event);
        setEventTitle(event.title);
        setEventOrganization(event.organization);
        setEventStartDate(event.startDate || '');
        setEventEndDate(event.endDate || '');
        setEventHours(event.hours.toString());
        setEventCategory(event.category);
        setIsPeriod(!!(event.startDate && event.endDate && event.startDate !== event.endDate));
        setProofFile(event.proof || null);
        setShowEventModal(true);
    };

    // Delete an external experience
    const handleDeleteEvent = (eventId: string) => {
        if (!window.confirm('Are you sure you want to delete this volunteer experience?')) {
            return;
        }
        setVolunteerEvents(prev => prev.filter(e => e.id !== eventId));
    };

    // Save event (add or edit)
    const handleSaveEvent = () => {
        if (!eventTitle || !eventOrganization || !eventStartDate || !eventHours) {
            return;
        }

        const displayDate = formatDateForDisplay(eventStartDate, isPeriod ? eventEndDate : undefined);

        if (editingEvent) {
            // Edit existing
            setVolunteerEvents(prev =>
                prev.map(e =>
                    e.id === editingEvent.id
                        ? {
                            ...e,
                            title: eventTitle,
                            organization: eventOrganization,
                            date: displayDate,
                            startDate: eventStartDate,
                            endDate: isPeriod ? eventEndDate : undefined,
                            hours: parseInt(eventHours),
                            category: eventCategory,
                            proof: proofFile || undefined,
                        }
                        : e
                )
            );
        } else {
            // Add new
            const newEvent: VolunteerEvent = {
                id: Date.now().toString(),
                title: eventTitle,
                organization: eventOrganization,
                date: displayDate,
                startDate: eventStartDate,
                endDate: isPeriod ? eventEndDate : undefined,
                hours: parseInt(eventHours),
                category: eventCategory || 'Other',
                source: 'external',
                proof: proofFile || undefined,
            };
            setVolunteerEvents(prev => [newEvent, ...prev]);
        }

        setShowEventModal(false);
    };

    // Portfolio Handlers
    const handlePortfolioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';
        const fileUrl = URL.createObjectURL(file);

        setPortfolioFile({
            fileName: file.name,
            fileType: fileType as 'pdf' | 'image',
            fileUrl
        });
        setPortfolioUrl(fileUrl);
    };

    const handleAddPortfolio = () => {
        setEditingPortfolio(null);
        setPortfolioTitle('');
        setPortfolioDescription('');
        setPortfolioType('link');
        setPortfolioUrl('');
        setPortfolioFile(null);
        setShowPortfolioModal(true);
    };

    const handleEditPortfolio = (item: PortfolioItem) => {
        setEditingPortfolio(item);
        setPortfolioTitle(item.title);
        setPortfolioDescription(item.description || '');
        setPortfolioType(item.type);
        setPortfolioUrl(item.url);
        if (item.type !== 'link') {
            setPortfolioFile({
                fileName: item.fileName || 'file',
                fileType: item.type as 'pdf' | 'image',
                fileUrl: item.url
            });
        } else {
            setPortfolioFile(null);
        }
        setShowPortfolioModal(true);
    };

    const handleDeletePortfolio = (id: string) => {
        setPortfolioItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSavePortfolio = () => {
        if (!portfolioTitle) return;

        if (editingPortfolio) {
            setPortfolioItems(prev =>
                prev.map(item =>
                    item.id === editingPortfolio.id
                        ? {
                            ...item,
                            title: portfolioTitle,
                            description: portfolioDescription,
                            type: portfolioType,
                            url: portfolioUrl,
                            fileName: portfolioFile?.fileName
                        }
                        : item
                )
            );
        } else {
            const newItem: PortfolioItem = {
                id: Date.now().toString(),
                title: portfolioTitle,
                description: portfolioDescription,
                type: portfolioType,
                url: portfolioUrl,
                fileName: portfolioFile?.fileName
            };
            setPortfolioItems(prev => [newItem, ...prev]);
        }
        setShowPortfolioModal(false);
    };

    const totalHours = volunteerEvents.reduce((sum: number, e: VolunteerEvent) => sum + e.hours, 0);

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Success Message */}
            {showSuccess && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-green-500 text-white rounded-full font-medium shadow-lg flex items-center gap-2"
                >
                    <CheckCircle size={20} />
                    Resume saved successfully!
                </motion.div>
            )}

            {/* Add/Edit Experience Modal */}
            <AnimatePresence>
                {showEventModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowEventModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingEvent ? 'Edit Experience' : 'Add Volunteer Experience'}
                                </h2>
                                <button
                                    onClick={() => setShowEventModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Activity/Event Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={eventTitle}
                                        onChange={(e) => setEventTitle(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-green-400 focus:bg-white transition-all"
                                        placeholder="e.g., Hospital Volunteering"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Organization *
                                    </label>
                                    <input
                                        type="text"
                                        value={eventOrganization}
                                        onChange={(e) => setEventOrganization(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-green-400 focus:bg-white transition-all"
                                        placeholder="e.g., National Hospital"
                                    />
                                </div>

                                {/* Duration Type Selector */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Duration Type
                                    </label>
                                    <div className="flex bg-gray-100 rounded-xl p-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsPeriod(false)}
                                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${!isPeriod
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            📅 Single Day
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsPeriod(true)}
                                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${isPeriod
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            📆 Date Range
                                        </button>
                                    </div>
                                </div>

                                {/* Date Fields */}
                                <div className={`grid ${isPeriod ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {isPeriod ? 'Start Date *' : 'Date *'}
                                        </label>
                                        <input
                                            type="date"
                                            value={eventStartDate}
                                            onChange={(e) => setEventStartDate(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-green-400 focus:bg-white transition-all"
                                        />
                                    </div>

                                    {isPeriod && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                End Date *
                                            </label>
                                            <input
                                                type="date"
                                                value={eventEndDate}
                                                onChange={(e) => setEventEndDate(e.target.value)}
                                                min={eventStartDate}
                                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-green-400 focus:bg-white transition-all"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Hours */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Total Hours * {!isPeriod && <span className="text-gray-400 font-normal">(max 24 for single day)</span>}
                                    </label>
                                    <input
                                        type="number"
                                        value={eventHours}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            // Only limit to 24 hours for single day events
                                            if (isPeriod || val <= 24 || isNaN(val)) {
                                                setEventHours(e.target.value);
                                            }
                                        }}
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-green-400 focus:bg-white transition-all"
                                        placeholder={isPeriod ? "e.g., 40" : "e.g., 4"}
                                        min="1"
                                        max={isPeriod ? undefined : 24}
                                    />
                                    {!isPeriod && parseInt(eventHours) > 24 && (
                                        <p className="text-xs text-red-500 mt-1">Maximum 24 hours for single day activity</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={eventCategory}
                                        onChange={(e) => setEventCategory(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-green-400 focus:bg-white transition-all"
                                    >
                                        <option value="">Select a category</option>
                                        {INTERESTS.map((interest) => (
                                            <option key={interest.id} value={interest.label}>
                                                {interest.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Proof Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Proof/Certificate <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>

                                    {proofFile ? (
                                        <div className="flex items-center gap-3 p-3 bg-green-50 border-2 border-green-200 rounded-xl">
                                            {proofFile.fileType === 'image' ? (
                                                <Image size={20} className="text-green-600" />
                                            ) : (
                                                <FileText size={20} className="text-green-600" />
                                            )}
                                            <span className="flex-1 text-sm text-gray-700 truncate">{proofFile.fileName}</span>
                                            <button
                                                type="button"
                                                onClick={() => setProofFile(null)}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all">
                                            <Upload size={24} className="text-gray-400" />
                                            <span className="text-sm text-gray-500">Upload PDF or Image</span>
                                            <span className="text-xs text-gray-400">Certificate, photo, or document</span>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={handleProofUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowEventModal(false)}
                                    className="flex-1 py-3 text-gray-600 font-medium rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEvent}
                                    disabled={!eventTitle || !eventOrganization || !eventStartDate || !eventHours || (!isPeriod && parseInt(eventHours) > 24) || (isPeriod && !eventEndDate)}
                                    className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingEvent ? 'Save Changes' : 'Add Experience'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Add/Edit Portfolio Modal */}
                {showPortfolioModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowPortfolioModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingPortfolio ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
                                </h2>
                                <button
                                    onClick={() => setShowPortfolioModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={portfolioTitle}
                                        onChange={(e) => setPortfolioTitle(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-green-400 focus:bg-white transition-all"
                                        placeholder="e.g., Graphic Design Samples"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        value={portfolioDescription}
                                        onChange={(e) => setPortfolioDescription(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-green-400 focus:bg-white transition-all resize-none"
                                        placeholder="Briefly describe what this represents..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Item Type
                                    </label>
                                    <div className="flex bg-gray-100 rounded-xl p-1">
                                        {[
                                            { id: 'link', label: '🔗 Link' },
                                            { id: 'image', label: '🖼️ Image' },
                                            { id: 'pdf', label: '📄 PDF' }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => {
                                                    setPortfolioType(t.id as any);
                                                    if (t.id === 'link') setPortfolioFile(null);
                                                }}
                                                className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all ${portfolioType === t.id
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {portfolioType === 'link' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Portfolio URL *
                                        </label>
                                        <input
                                            type="url"
                                            value={portfolioUrl}
                                            onChange={(e) => setPortfolioUrl(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-green-400 focus:bg-white transition-all"
                                            placeholder="https://behance.net/..."
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Upload {portfolioType.toUpperCase()} *
                                        </label>
                                        {portfolioFile ? (
                                            <div className="flex items-center gap-3 p-3 bg-green-50 border-2 border-green-200 rounded-xl">
                                                {portfolioFile.fileType === 'image' ? (
                                                    <Image size={20} className="text-green-600" />
                                                ) : (
                                                    <FileText size={20} className="text-green-600" />
                                                )}
                                                <span className="flex-1 text-sm text-gray-700 truncate">{portfolioFile.fileName}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPortfolioFile(null);
                                                        setPortfolioUrl('');
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center gap-2 p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all">
                                                <Upload size={24} className="text-gray-400" />
                                                <span className="text-sm text-gray-500">Select Portfolio {portfolioType.toUpperCase()}</span>
                                                <input
                                                    type="file"
                                                    accept={portfolioType === 'image' ? "image/*" : ".pdf"}
                                                    onChange={handlePortfolioFileUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowPortfolioModal(false)}
                                    className="flex-1 py-3 text-gray-600 font-medium rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePortfolio}
                                    disabled={!portfolioTitle || (portfolioType === 'link' ? !portfolioUrl : !portfolioFile)}
                                    className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingPortfolio ? 'Save Changes' : 'Add to Portfolio'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/profile')}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Volunteer Resume</h1>
                        <p className="text-sm text-gray-500">Your profile for volunteer applications</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Save size={18} />
                    )}
                    {isSaving ? 'Saving...' : 'Save Resume'}
                </button>
            </motion.div>

            {/* Stats Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-3 gap-4"
            >
                <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Heart size={18} className="text-green-600" />
                        <span className="text-sm text-green-700">Events</span>
                    </div>
                    <p className="text-2xl font-bold text-green-800">{volunteerEvents.length}</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={18} className="text-blue-600" />
                        <span className="text-sm text-blue-700">Hours</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-800">{totalHours}</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Leaf size={18} className="text-purple-600" />
                        <span className="text-sm text-purple-700">Causes</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-800">{selectedInterests.length}</p>
                </div>
            </motion.div>

            {/* About Me */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen size={20} className="text-gray-600" />
                    About Me
                </h2>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-green-400 focus:bg-white transition-all resize-none"
                    placeholder="Tell event organizers about yourself, your motivation to volunteer, and what makes you a great volunteer..."
                />
                <p className="text-xs text-gray-400 mt-2">{bio.length}/500 characters</p>
            </motion.div>

            {/* Skills */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
                <h2 className="text-lg font-bold text-gray-900 mb-4">Skills</h2>
                <p className="text-sm text-gray-500 mb-4">Select skills that you can offer as a volunteer</p>
                <div className="flex flex-wrap gap-2">
                    {SKILLS.map((skill) => {
                        const isSelected = selectedSkills.includes(skill.id);
                        return (
                            <button
                                key={skill.id}
                                onClick={() => toggleSkill(skill.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected
                                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                                    }`}
                            >
                                {isSelected && <CheckCircle size={14} />}
                                {skill.label}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Interests/Causes */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
                <h2 className="text-lg font-bold text-gray-900 mb-4">Causes I Care About</h2>
                <p className="text-sm text-gray-500 mb-4">Select causes and areas you&apos;re passionate about</p>
                <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => {
                        const isSelected = selectedInterests.includes(interest.id);
                        return (
                            <button
                                key={interest.id}
                                onClick={() => toggleInterest(interest.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border-2 ${isSelected
                                    ? interest.color
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                {isSelected && <CheckCircle size={14} />}
                                {interest.label}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Availability */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
                <h2 className="text-lg font-bold text-gray-900 mb-2">Availability</h2>
                <p className="text-sm text-gray-500 mb-4">Select all time slots when you&apos;re available to volunteer</p>

                {/* Days */}
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">Days</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'weekdays', label: 'Weekdays (Mon-Fri)' },
                            { id: 'weekends', label: 'Weekends (Sat-Sun)' },
                            { id: 'monday', label: 'Monday' },
                            { id: 'tuesday', label: 'Tuesday' },
                            { id: 'wednesday', label: 'Wednesday' },
                            { id: 'thursday', label: 'Thursday' },
                            { id: 'friday', label: 'Friday' },
                            { id: 'saturday', label: 'Saturday' },
                            { id: 'sunday', label: 'Sunday' },
                        ].map((option) => {
                            const isSelected = selectedAvailability.includes(option.id);
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        setSelectedAvailability(prev =>
                                            prev.includes(option.id)
                                                ? prev.filter(a => a !== option.id)
                                                : [...prev, option.id]
                                        );
                                    }}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isSelected
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time of Day */}
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">Time of Day</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'mornings', label: 'Mornings (6AM - 12PM)' },
                            { id: 'afternoons', label: 'Afternoons (12PM - 6PM)' },
                            { id: 'evenings', label: 'Evenings (6PM - 10PM)' },
                            { id: 'nights', label: 'Nights (10PM+)' },
                        ].map((option) => {
                            const isSelected = selectedAvailability.includes(option.id);
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        setSelectedAvailability(prev =>
                                            prev.includes(option.id)
                                                ? prev.filter(a => a !== option.id)
                                                : [...prev, option.id]
                                        );
                                    }}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isSelected
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Commitment Level */}
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Commitment Preference</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'one-time', label: 'One-time events' },
                            { id: 'short-term', label: 'Short-term (1-4 weeks)' },
                            { id: 'long-term', label: 'Long-term (ongoing)' },
                            { id: 'flexible', label: 'Flexible / Any' },
                        ].map((option) => {
                            const isSelected = selectedAvailability.includes(option.id);
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        setSelectedAvailability(prev =>
                                            prev.includes(option.id)
                                                ? prev.filter(a => a !== option.id)
                                                : [...prev, option.id]
                                        );
                                    }}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isSelected
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            {/* Portfolio */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Portfolio & Work Samples</h2>
                        <p className="text-sm text-gray-500">Showcase your skills through links or files</p>
                    </div>
                    <button
                        onClick={handleAddPortfolio}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={16} />
                        Add Item
                    </button>
                </div>

                {portfolioItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {portfolioItems.map((item) => (
                            <div
                                key={item.id}
                                className="group relative flex flex-col p-4 border border-gray-100 rounded-2xl bg-gray-50 hover:bg-white hover:border-blue-200 transition-all shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className={`p-2 rounded-lg ${item.type === 'link' ? 'bg-indigo-100 text-indigo-600' :
                                        item.type === 'image' ? 'bg-green-100 text-green-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                        {item.type === 'link' ? <Palette size={18} /> :
                                            item.type === 'image' ? <Image size={18} /> :
                                                <FileText size={18} />}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditPortfolio(item)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 bg-white rounded-lg border border-gray-100 shadow-sm"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePortfolio(item.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 bg-white rounded-lg border border-gray-100 shadow-sm"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate mb-1">{item.title}</h3>
                                    {item.description && (
                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                                    )}
                                </div>

                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center justify-center w-full py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors gap-1.5"
                                >
                                    {item.type === 'link' ? 'Visit Link ↗' : `View ${item.type.toUpperCase()}`}
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                        <Palette size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No portfolio items yet</p>
                    </div>
                )}
            </motion.div>

            {/* Past Volunteer Experience */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Volunteer History</h2>
                        <p className="text-sm text-gray-500">In-app events are locked • External experiences are editable</p>
                    </div>
                    <button
                        onClick={handleAddExperience}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                        <Plus size={16} />
                        Add Experience
                    </button>
                </div>

                {volunteerEvents.length > 0 ? (
                    <div className="space-y-3">
                        {volunteerEvents.map((event: VolunteerEvent) => (
                            <div
                                key={event.id}
                                className={`flex items-center gap-4 p-4 border rounded-xl ${event.source === 'app'
                                    ? 'bg-green-50 border-green-100'
                                    : 'bg-blue-50 border-blue-100'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${event.source === 'app'
                                    ? 'bg-green-100'
                                    : 'bg-blue-100'
                                    }`}>
                                    {event.source === 'app' ? (
                                        <CheckCircle size={18} className="text-green-600" />
                                    ) : (
                                        <Pencil size={18} className="text-blue-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">{event.title}</p>
                                        {event.source === 'app' && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-200 text-green-700 rounded text-xs font-medium">
                                                <Lock size={10} />
                                                Via HolySheet
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">{event.organization}</p>
                                </div>
                                <div className="text-right mr-2">
                                    <p className={`font-semibold ${event.source === 'app' ? 'text-green-600' : 'text-blue-600'
                                        }`}>{event.hours} hrs</p>
                                    <p className="text-xs text-gray-500">{event.date}</p>
                                </div>
                                {event.source === 'external' && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEditEvent(event)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEvent(event.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Heart size={32} className="mx-auto mb-2 text-gray-300" />
                        <p>No volunteer history yet</p>
                        <p className="text-sm">Add your past experiences or complete your first volunteer event!</p>
                    </div>
                )}
            </motion.div>

            {/* Note about AI matching */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-blue-50 rounded-2xl p-6 border border-blue-100"
            >
                <div className="flex gap-4">
                    <div className="p-2 bg-blue-100 rounded-xl h-fit">
                        <Leaf size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-blue-900 mb-1">Smart Matching</h3>
                        <p className="text-sm text-blue-700">
                            When you apply for volunteer events, we&apos;ll automatically share relevant parts of your resume with event organizers to help them understand your experience and interests.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

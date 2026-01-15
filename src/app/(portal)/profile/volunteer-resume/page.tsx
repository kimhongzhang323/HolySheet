'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Save, Heart, BookOpen, Users, Leaf,
    GraduationCap, Stethoscope, Home, Utensils, Palette,
    Code, CheckCircle, Clock, Plus, X, Pencil, Trash2, Upload, FileImage, Eye
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

// Category options for history entries
const CATEGORIES = [
    'Environment', 'Education', 'Elderly Care', 'Children & Youth',
    'Animal Welfare', 'Food Security', 'Healthcare', 'Arts & Culture',
    'Disaster Relief', 'Community Service', 'Other'
];

interface VolunteerHistoryEntry {
    id: string;
    title: string;
    organization: string;
    date: string;
    hours: number;
    category: string;
    proof?: string; // Base64 encoded image or file URL
    proofName?: string; // Original filename
}

export default function VolunteerResumePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [bio, setBio] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
    const [volunteerHistory, setVolunteerHistory] = useState<VolunteerHistoryEntry[]>([]);

    // Modal state for history editing
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<VolunteerHistoryEntry | null>(null);
    const [historyForm, setHistoryForm] = useState({
        title: '',
        organization: '',
        date: '',
        hours: 0,
        category: 'Community Service',
        proof: '',
        proofName: '',
    });

    // Get user email from localStorage
    const getUserEmail = () => {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return user.email;
            } catch {
                return null;
            }
        }
        return null;
    };

    // Fetch resume data on mount
    useEffect(() => {
        const fetchResume = async () => {
            const email = getUserEmail();
            if (!email) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/volunteer-resume?email=${encodeURIComponent(email)}`);
                if (res.ok) {
                    const data = await res.json();
                    setBio(data.bio || '');
                    setSelectedSkills(data.skills || []);
                    setSelectedInterests(data.interests || []);
                    setSelectedAvailability(data.availability || []);
                    setVolunteerHistory(data.history || []);
                }
            } catch (err) {
                console.error('Failed to fetch resume:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResume();
    }, []);

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
        const email = getUserEmail();
        if (!email) {
            setError('Please log in to save your resume');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const res = await fetch(`/api/volunteer-resume?email=${encodeURIComponent(email)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bio,
                    skills: selectedSkills,
                    interests: selectedInterests,
                    availability: selectedAvailability,
                    history: volunteerHistory,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to save resume');
            }

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to save resume:', err);
            setError('Failed to save resume. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // History entry management
    const openAddModal = () => {
        setEditingEntry(null);
        setHistoryForm({
            title: '',
            organization: '',
            date: '',
            hours: 0,
            category: 'Community Service',
            proof: '',
            proofName: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (entry: VolunteerHistoryEntry) => {
        setEditingEntry(entry);
        setHistoryForm({
            title: entry.title,
            organization: entry.organization,
            date: entry.date,
            hours: entry.hours,
            category: entry.category,
            proof: entry.proof || '',
            proofName: entry.proofName || '',
        });
        setIsModalOpen(true);
    };

    const handleDeleteEntry = (id: string) => {
        setVolunteerHistory(prev => prev.filter(e => e.id !== id));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit file size to 2MB
        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB');
            return;
        }

        // Only allow images and PDFs
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert('Only images (JPEG, PNG, WebP) and PDF files are allowed');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setHistoryForm(prev => ({
                ...prev,
                proof: reader.result as string,
                proofName: file.name,
            }));
        };
        reader.readAsDataURL(file);
    };

    const removeProof = () => {
        setHistoryForm(prev => ({
            ...prev,
            proof: '',
            proofName: '',
        }));
    };

    const handleSaveEntry = () => {
        if (!historyForm.title || !historyForm.organization) return;

        if (editingEntry) {
            // Update existing entry
            setVolunteerHistory(prev =>
                prev.map(e =>
                    e.id === editingEntry.id
                        ? { ...e, ...historyForm }
                        : e
                )
            );
        } else {
            // Add new entry
            const newEntry: VolunteerHistoryEntry = {
                id: Date.now().toString(),
                ...historyForm,
            };
            setVolunteerHistory(prev => [...prev, newEntry]);
        }

        setIsModalOpen(false);
    };

    const totalHours = volunteerHistory.reduce((sum, e) => sum + e.hours, 0);

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Success Message */}
            <AnimatePresence>
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
            </AnimatePresence>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

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
                    <p className="text-2xl font-bold text-green-800">{volunteerHistory.length}</p>
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

            {/* Volunteer History - Editable */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Volunteer History</h2>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium hover:bg-green-200 transition-colors"
                    >
                        <Plus size={16} />
                        Add Experience
                    </button>
                </div>

                {volunteerHistory.length > 0 ? (
                    <div className="space-y-3">
                        {volunteerHistory.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-xl group"
                            >
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle size={18} className="text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">{event.title}</p>
                                        {event.proof && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                <FileImage size={12} />
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">{event.organization}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-green-600">{event.hours} hrs</p>
                                    <p className="text-xs text-gray-500">
                                        {event.date ? new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                    </p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(event)}
                                        className="p-2 hover:bg-green-200 rounded-lg transition-colors"
                                    >
                                        <Pencil size={16} className="text-green-700" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEntry(event.id)}
                                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} className="text-red-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Heart size={32} className="mx-auto mb-2 text-gray-300" />
                        <p>No volunteer history yet</p>
                        <p className="text-sm">Add your past volunteer experiences!</p>
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

            {/* History Entry Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editingEntry ? 'Edit Experience' : 'Add Experience'}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Event Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={historyForm.title}
                                        onChange={(e) => setHistoryForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 text-gray-900 bg-white"
                                        placeholder="e.g., Beach Cleanup"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Organization *
                                    </label>
                                    <input
                                        type="text"
                                        value={historyForm.organization}
                                        onChange={(e) => setHistoryForm(prev => ({ ...prev, organization: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 text-gray-900 bg-white"
                                        placeholder="e.g., Green Earth Foundation"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={historyForm.date}
                                            onChange={(e) => setHistoryForm(prev => ({ ...prev, date: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 text-gray-900 bg-white"
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Hours
                                        </label>
                                        <input
                                            type="number"
                                            value={historyForm.hours || ''}
                                            onChange={(e) => setHistoryForm(prev => ({ ...prev, hours: Math.min(parseInt(e.target.value) || 0, 24) }))}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 text-gray-900 bg-white"
                                            min="0"
                                            max="24"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={historyForm.category}
                                        onChange={(e) => setHistoryForm(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 text-gray-900 bg-white"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Proof Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Proof / Documentation
                                        <span className="text-gray-400 font-normal ml-1">(optional)</span>
                                    </label>

                                    {historyForm.proof ? (
                                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <FileImage size={20} className="text-green-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {historyForm.proofName}
                                                </p>
                                                <p className="text-xs text-green-600">Uploaded</p>
                                            </div>
                                            <div className="flex gap-1">
                                                {historyForm.proof.startsWith('data:image') && (
                                                    <a
                                                        href={historyForm.proof}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                                    >
                                                        <Eye size={16} className="text-green-700" />
                                                    </a>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={removeProof}
                                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <X size={16} className="text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-colors">
                                            <Upload size={24} className="text-gray-400 mb-1" />
                                            <span className="text-sm text-gray-500">Click to upload</span>
                                            <span className="text-xs text-gray-400">Image or PDF (max 2MB)</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                                onChange={handleFileUpload}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEntry}
                                    disabled={!historyForm.title || !historyForm.organization}
                                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    {editingEntry ? 'Save Changes' : 'Add Experience'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

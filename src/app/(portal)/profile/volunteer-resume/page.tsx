'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Save, Heart, BookOpen, Users, Leaf,
    GraduationCap, Stethoscope, Home, Utensils, Palette,
    Code, CheckCircle, Clock, Plus
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

// Mock past volunteer events (would come from API)
const PAST_VOLUNTEER_EVENTS = [
    {
        id: '1',
        title: 'Beach Cleanup',
        organization: 'Green Earth Foundation',
        date: '15 Dec 2025',
        hours: 4,
        category: 'Environment',
    },
    {
        id: '2',
        title: 'Food Distribution',
        organization: 'Community Kitchen',
        date: '10 Dec 2025',
        hours: 5,
        category: 'Food Security',
    },
    {
        id: '3',
        title: 'Teaching Workshop',
        organization: 'CodeForGood',
        date: '28 Nov 2025',
        hours: 3,
        category: 'Education',
    },
];

// Initial resume data (would come from API)
const INITIAL_RESUME = {
    bio: 'Passionate about making a difference in the community. I have experience in organizing community events and enjoy working with diverse groups of people.',
    skills: ['communication', 'teamwork', 'teaching'],
    interests: ['environment', 'education', 'community'],
    availability: 'weekends',
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

    const totalHours = PAST_VOLUNTEER_EVENTS.reduce((sum, e) => sum + e.hours, 0);

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
                    <p className="text-2xl font-bold text-green-800">{PAST_VOLUNTEER_EVENTS.length}</p>
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

            {/* Past Volunteer Experience */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Volunteer History</h2>
                    <span className="text-sm text-gray-500">Auto-updated from completed events</span>
                </div>

                {PAST_VOLUNTEER_EVENTS.length > 0 ? (
                    <div className="space-y-3">
                        {PAST_VOLUNTEER_EVENTS.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-xl"
                            >
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle size={18} className="text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{event.title}</p>
                                    <p className="text-sm text-gray-500">{event.organization}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-green-600">{event.hours} hrs</p>
                                    <p className="text-xs text-gray-500">{event.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Heart size={32} className="mx-auto mb-2 text-gray-300" />
                        <p>No volunteer history yet</p>
                        <p className="text-sm">Complete your first volunteer event to see it here!</p>
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

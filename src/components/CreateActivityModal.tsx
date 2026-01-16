'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CreateActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (activityData: ActivityFormData) => void;
    initialDate?: Date;
}

export interface ActivityFormData {
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    capacity: number;
    volunteers_needed: number;
    skills_required: string[];
    allowed_tiers: string[];
    organiser: string;
}

const AVAILABLE_SKILLS = [
    'First Aid',
    'Lifeguard',
    'Swimming',
    'Art Therapy',
    'Music',
    'Cooking',
    'Teaching',
    'Counseling',
    'Transportation'
];

const TIERS = ['ad-hoc', 'once-a-week', 'twice-a-week', 'three-plus-a-week'];

export default function CreateActivityModal({
    isOpen,
    onClose,
    onSubmit,
    initialDate
}: CreateActivityModalProps) {
    const [formData, setFormData] = useState<ActivityFormData>({
        title: '',
        description: '',
        start_time: initialDate ? initialDate.toISOString().slice(0, 16) : '',
        end_time: '',
        location: '',
        capacity: 20,
        volunteers_needed: 0,
        skills_required: [],
        allowed_tiers: [],
        organiser: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.start_time) newErrors.start_time = 'Start time is required';
        if (!formData.end_time) newErrors.end_time = 'End time is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (formData.capacity <= 0) newErrors.capacity = 'Capacity must be greater than 0';

        if (new Date(formData.start_time) >= new Date(formData.end_time)) {
            newErrors.end_time = 'End time must be after start time';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSubmit(formData);
        onClose();
    };

    const toggleSkill = (skill: string) => {
        setFormData(prev => ({
            ...prev,
            skills_required: prev.skills_required.includes(skill)
                ? prev.skills_required.filter(s => s !== skill)
                : [...prev.skills_required, skill]
        }));
    };

    const toggleTier = (tier: string) => {
        setFormData(prev => ({
            ...prev,
            allowed_tiers: prev.allowed_tiers.includes(tier)
                ? prev.allowed_tiers.filter(t => t !== tier)
                : [...prev.allowed_tiers, tier]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-gray-900">Create New Activity</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Activity Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Swimming Session"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Describe the activity..."
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Start Time *
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.start_time && <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                End Time *
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.end_time && <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>}
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Location *
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Hall B"
                        />
                        {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                    </div>

                    {/* Capacity & Volunteers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Capacity *
                            </label>
                            <input
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="1"
                            />
                            {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Volunteers Needed
                            </label>
                            <input
                                type="number"
                                value={formData.volunteers_needed}
                                onChange={(e) => setFormData({ ...formData, volunteers_needed: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Organiser
                            </label>
                            <input
                                type="text"
                                value={formData.organiser}
                                onChange={(e) => setFormData({ ...formData, organiser: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Name"
                            />
                        </div>
                    </div>

                    {/* Skills Required */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Skills Required
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_SKILLS.map(skill => (
                                <button
                                    key={skill}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${formData.skills_required.includes(skill)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Allowed Tiers */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Allowed Membership Tiers (Leave empty for all)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {TIERS.map(tier => (
                                <button
                                    key={tier}
                                    type="button"
                                    onClick={() => toggleTier(tier)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${formData.allowed_tiers.includes(tier)
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {tier.replace(/-/g, ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30"
                        >
                            Create Activity
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

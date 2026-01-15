'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Camera, User, Mail, MapPin, Phone, FileText,
    Save, X, Check
} from 'lucide-react';

// Mock user data (in real app, this would come from API/database)
const INITIAL_USER_DATA = {
    name: 'Kim Hong Zhang',
    email: 'kimhongzhang@example.com',
    phone: '+65 9123 4567',
    location: 'Singapore',
    bio: 'Passionate about making a difference in the community. Love organizing events and helping others.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
};

export default function EditProfilePage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState(INITIAL_USER_DATA);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsSaving(false);
        setShowSuccess(true);

        // Redirect back to profile after a short delay
        setTimeout(() => {
            router.push('/profile');
        }, 1500);
    };

    const handleCancel = () => {
        router.push('/profile');
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Success Message */}
            {showSuccess && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-green-500 text-white rounded-full font-medium shadow-lg flex items-center gap-2"
                >
                    <Check size={20} />
                    Profile updated successfully!
                </motion.div>
            )}

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                        <p className="text-sm text-gray-500">Update your personal information</p>
                    </div>
                </div>
            </motion.div>

            {/* Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8"
            >
                {/* Profile Picture */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-pink-500 p-0.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={formData.avatar}
                                alt={formData.name}
                                className="w-full h-full rounded-2xl object-cover bg-white"
                            />
                        </div>
                        <button className="absolute -bottom-2 -right-2 p-3 bg-orange-500 rounded-xl shadow-lg hover:bg-orange-600 transition-colors">
                            <Camera size={18} className="text-white" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Click to upload a new photo</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <User size={16} />
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                            placeholder="Enter your full name"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Mail size={16} />
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                            placeholder="Enter your email"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Phone size={16} />
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                            placeholder="Enter your phone number"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <MapPin size={16} />
                            Location
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                            placeholder="Enter your city or country"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <FileText size={16} />
                            Bio
                        </label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition-all resize-none"
                            placeholder="Tell us about yourself..."
                        />
                        <p className="text-xs text-gray-400 mt-1">{formData.bio.length}/200 characters</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <button
                        onClick={handleCancel}
                        className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <X size={18} />
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

'use client';

import { motion, AnimatePresence } from 'motion/react';
import TiltedCard from './TiltedCard';
import { X } from 'lucide-react';

interface EventDetailPopupProps {
    event: {
        id: string;
        title: string;
        start: Date;
        end: Date;
        location?: string;
        volunteersNeeded?: number;
        volunteersRegistered?: number;
        capacity?: number;
        skillsRequired?: string[];
    } | null;
    onClose: () => void;
    backgroundColor?: string;
}

export default function EventDetailPopup({ event, onClose, backgroundColor = '#10b981' }: EventDetailPopupProps) {
    if (!event) return null;

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative max-w-2xl w-full mx-4"
                >
                    <TiltedCard
                        containerHeight="auto"
                        containerWidth="100%"
                        scaleOnHover={1.02}
                        rotateAmplitude={8}
                        className="w-full"
                    >
                        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                            {/* Event Image */}
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src="/event-placeholder.png"
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                />
                                <div
                                    className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
                                />
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Event Details */}
                            <div className="p-6 space-y-4">
                                {/* Title and Time */}
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                        {event.title}
                                    </h2>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <span className="text-lg">📅</span>
                                        <span className="text-sm font-medium">
                                            {formatDate(event.start)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mt-1">
                                        <span className="text-lg">🕐</span>
                                        <span className="text-sm font-medium">
                                            {formatTime(event.start)} - {formatTime(event.end)}
                                        </span>
                                    </div>
                                </div>

                                {/* Volunteer Status */}
                                {event.volunteersNeeded && (
                                    <div className="p-4 rounded-xl" style={{ backgroundColor: backgroundColor + '20' }}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                    Volunteer Progress
                                                </p>
                                                <p className="text-2xl font-bold" style={{ color: backgroundColor }}>
                                                    {event.volunteersRegistered || 0} / {event.volunteersNeeded}
                                                </p>
                                            </div>
                                            <div className="text-4xl">👥</div>
                                        </div>
                                        <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${Math.min(((event.volunteersRegistered || 0) / event.volunteersNeeded) * 100, 100)}%`,
                                                    backgroundColor: backgroundColor
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Additional Details */}
                                <div className="grid grid-cols-1 gap-3">
                                    {event.location && (
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <span className="text-xl">📍</span>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{event.location}</p>
                                            </div>
                                        </div>
                                    )}

                                    {event.capacity && (
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <span className="text-xl">👤</span>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Capacity</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{event.capacity} people</p>
                                            </div>
                                        </div>
                                    )}

                                    {event.skillsRequired && event.skillsRequired.length > 0 && (
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <span className="text-xl">🎯</span>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Skills Required</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {event.skillsRequired.map((skill, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-3 py-1 rounded-full text-xs font-medium"
                                                            style={{
                                                                backgroundColor: backgroundColor + '20',
                                                                color: backgroundColor
                                                            }}
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TiltedCard>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

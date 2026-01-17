'use client';

import { useState } from 'react';
import { QrCode, Calendar, Clock, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';

interface TicketProps {
    category: string;
    title: string;
    date: string;
    time: string;
    id: string;
    imageGradient?: string;
    image?: string;
}

export default function TicketCard({ category, title, date, time, id, imageGradient, image }: TicketProps) {
    const [role, location] = title.split(' • ');
    const [showQR, setShowQR] = useState(false);

    // Generate unique QR data for attendance verification
    const qrData = JSON.stringify({
        eventId: id,
        eventName: role,
        location: location,
        date: date,
        time: time,
        timestamp: Date.now()
    });

    return (
        <>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
                {/* Top Section with Image */}
                <div className="relative h-36 overflow-hidden">
                    {image ? (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={image}
                                alt={title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        </>
                    ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${imageGradient}`} />
                    )}

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800 uppercase tracking-wide">
                            {category}
                        </span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 bg-emerald-500 rounded-full text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            Active
                        </span>
                    </div>

                    {/* Role on Image */}
                    <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg font-bold text-white leading-tight">{role}</h3>
                        {location && (
                            <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
                                <MapPin size={10} />
                                {location}
                            </p>
                        )}
                    </div>
                </div>

                {/* Bottom Info Section */}
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        {/* Date & Time */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                    <Calendar size={16} className="text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Date</p>
                                    <p className="text-sm font-semibold text-gray-800">{date.split(' ').slice(0, 2).join(' ')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <Clock size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Time</p>
                                    <p className="text-sm font-semibold text-gray-800">{time}</p>
                                </div>
                            </div>
                        </div>

                        {/* QR Code Button */}
                        <button
                            onClick={() => setShowQR(true)}
                            className="flex flex-col items-center group/qr"
                        >
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 group-hover/qr:bg-emerald-50 group-hover/qr:border-emerald-200 transition-colors">
                                <QrCode size={24} className="text-gray-700 group-hover/qr:text-emerald-600 transition-colors" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* QR Code Modal */}
            <AnimatePresence>
                {showQR && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowQR(false)}
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
                                        onClick={() => setShowQR(false)}
                                        className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                    <h3 className="text-xl font-bold">Attendance QR Code</h3>
                                    <p className="text-white/80 text-sm mt-1">Show this to the admin for check-in</p>
                                </div>

                                {/* QR Code */}
                                <div className="p-8 flex flex-col items-center">
                                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
                                        <QRCode
                                            value={qrData}
                                            size={200}
                                            level="H"
                                            className="w-full h-full"
                                        />
                                    </div>

                                    {/* Event Details */}
                                    <div className="mt-6 text-center">
                                        <h4 className="font-bold text-gray-900 text-lg">{role}</h4>
                                        <p className="text-gray-500 text-sm flex items-center justify-center gap-1 mt-1">
                                            <MapPin size={12} />
                                            {location}
                                        </p>
                                        <div className="flex items-center justify-center gap-4 mt-3 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} className="text-emerald-500" />
                                                {date.split(' ').slice(0, 2).join(' ')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} className="text-blue-500" />
                                                {time}
                                            </span>
                                        </div>
                                    </div>

                                    {/* ID */}
                                    <div className="mt-6 px-4 py-2 bg-gray-50 rounded-full">
                                        <span className="text-xs text-gray-400">ID: </span>
                                        <span className="text-xs font-mono font-bold text-gray-600">{id}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

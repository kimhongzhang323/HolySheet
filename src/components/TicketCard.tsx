'use client';

import { QrCode } from 'lucide-react';
import Link from 'next/link';

interface TicketProps {
    category: string;
    title: string; // e.g., "DJ Nova..."
    date: string;  // "27 August 2025"
    time: string;  // "17:00 - 21:00"
    id: string;
    imageGradient?: string;
    image?: string; // Optional image URL
}

export default function TicketCard({ category, title, date, time, id, imageGradient, image }: TicketProps) {
    return (
        <Link href={`/events/${id}`} className="block">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex p-0 overflow-hidden relative group hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer">
                {/* Left Image Section */}
                <div className={`w-28 ${!image ? `bg-gradient-to-br ${imageGradient || 'from-gray-400 to-gray-500'}` : ''} relative overflow-hidden`}>
                    {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={image}
                            alt={category}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                    )}
                </div>

                {/* Middle Info Section */}
                <div className="flex-1 p-4 flex flex-col justify-center">
                    <div className="mb-3">
                        <h3 className="text-lg font-bold text-gray-900 uppercase leading-none mb-1">
                            {category} <span className="font-light text-gray-400">event</span>
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1">{title}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                        <div>
                            <span className="block text-gray-400 text-[10px]">Start</span>
                            <span className="font-semibold">{time.split(' - ')[0]}</span>
                        </div>
                        <div>
                            <span className="block text-gray-400 text-[10px]">End</span>
                            <span className="font-semibold">{time.split(' - ')[1]}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                        <div>
                            <span className="block text-2xl font-bold text-gray-800 leading-none">{date.split(' ')[0]}</span>
                            <span className="text-gray-400 text-[10px] uppercase">{date.split(' ').slice(1).join(' ')}</span>
                        </div>
                        <div className="text-[10px] text-gray-400">
                            ID <span className="text-gray-600 font-mono">{id}</span>
                        </div>
                    </div>
                </div>

                {/* Perforation Line */}
                <div className="relative w-0 border-r-2 border-dashed border-gray-200 my-2">
                    <div className="absolute -top-4 -left-2 w-4 h-4 bg-gray-50 rounded-full"></div>
                    <div className="absolute -bottom-4 -left-2 w-4 h-4 bg-gray-50 rounded-full"></div>
                </div>

                {/* Right QR Section */}
                <div className="w-16 flex flex-col items-center justify-center p-2 bg-gray-50/50">
                    <div className="hidden md:block rotate-90 text-[10px] text-gray-300 font-mono tracking-widest whitespace-nowrap mb-2 origin-center w-4 h-4">
                        ACCESS
                    </div>
                    <QrCode size={32} className="text-gray-800 opacity-80" />
                </div>
            </div>
        </Link>
    );
}

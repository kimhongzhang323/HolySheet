'use client';

import { motion } from 'framer-motion';
import { Clock, Heart, Star, ChevronRight, Calendar } from 'lucide-react';

interface ImpactHeaderProps {
    stats: {
        hours: number;
        missions: number;
        skills: number;
    };
    userName: string;
}

export default function ImpactHeader({ stats, userName }: ImpactHeaderProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userName.split(' ')[0]}!</h1>
                    <p className="text-gray-500 mt-1">Here is the impact you've made so far.</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                        <Calendar size={20} className="text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-emerald-600 leading-none mb-1">Next Shift</p>
                        <p className="text-sm font-bold text-gray-900 leading-none">Tomorrow, 08:00 AM</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Volunteered', value: `${stats.hours} Hrs`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Completed', value: `${stats.missions} Missions`, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Verified Skills', value: `${stats.skills} Skills`, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`${stat.bg} rounded-[24px] p-6 border border-white shadow-sm hover:shadow-md transition-all flex items-center gap-4 group cursor-default`}
                    >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <stat.icon size={22} className={stat.color} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

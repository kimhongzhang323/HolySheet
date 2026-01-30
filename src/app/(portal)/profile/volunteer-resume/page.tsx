'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Award, Calendar, Clock, MapPin, Mail, Phone,
    ArrowLeft, Download, CheckCircle2, Star,
    ShieldCheck, GraduationCap, Building2, ExternalLink, Edit3
} from 'lucide-react';

// Mock resume data for demonstration
const MOCK_RESUME_DATA = {
    name: 'John Doe',
    hours: 156,
    missions: 23,
    rank: 'Top 5%',
    bio: 'Passionate community volunteer with over 3 years of experience in social services, education outreach, and environmental conservation. Dedicated to creating meaningful impact through hands-on involvement and leadership in volunteer initiatives across Singapore.',
    skills: [
        'Community Outreach', 'Event Coordination', 'First Aid Certified',
        'Public Speaking', 'Mandarin (Fluent)', 'Team Leadership',
        'Youth Mentoring', 'Digital Literacy Training', 'Crisis Support'
    ],
    achievements: [
        { name: 'Community Champion', description: 'Completed 100+ volunteer hours in community service' },
        { name: 'Rising Star', description: 'Recognized for exceptional dedication in first year' },
        { name: 'Team Leader', description: 'Successfully led 5+ volunteer missions' },
        { name: 'Impact Maker', description: 'Touched 500+ lives through volunteer work' },
        { name: 'First Aid Hero', description: 'Certified in CPR and emergency response' }
    ],
    experience: [
        {
            role: 'Volunteer Coordinator',
            organization: 'Lions Befrienders',
            period: '2024 - Present',
            description: 'Lead a team of 15 volunteers for weekly senior home visits. Organized monthly community events reaching 200+ elderly residents.'
        },
        {
            role: 'Digital Ambassador',
            organization: 'IMDA Digital Readiness Programme',
            period: '2023 - 2024',
            description: 'Taught smartphone basics and digital skills to 150+ seniors across 30 workshop sessions.'
        },
        {
            role: 'Beach Cleanup Leader',
            organization: 'Beach Lovers Singapore',
            period: '2022 - Present',
            description: 'Organized and led monthly beach cleanup initiatives. Collected over 500kg of marine debris with 200+ volunteers.'
        }
    ],
    volunteerHistory: [
        { title: 'CNY Hamper Packing', location: 'Toa Payoh Hub', date: '2026-01-30', hours: 4 },
        { title: 'Senior Home Visit', location: 'Ang Mo Kio', date: '2026-01-15', hours: 3 },
        { title: 'Coding Workshop for Kids', location: 'Science Centre', date: '2026-01-12', hours: 3 },
        { title: 'Beach Cleanup @ East Coast', location: 'East Coast Park', date: '2025-12-28', hours: 4 },
        { title: 'Food Bank Distribution', location: 'Woodlands CC', date: '2025-12-15', hours: 3 },
        { title: 'Digital Skills Workshop', location: 'Jurong Library', date: '2025-12-08', hours: 2 },
        { title: 'Community Garden Day', location: 'Pasir Ris', date: '2025-11-20', hours: 3 }
    ]
};

export default function VolunteerResumePage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            // Use mock data for demonstration
            setStats({
                name: session?.user?.name || MOCK_RESUME_DATA.name,
                hours: MOCK_RESUME_DATA.hours,
                missions: MOCK_RESUME_DATA.missions,
                bio: MOCK_RESUME_DATA.bio,
                skills: MOCK_RESUME_DATA.skills,
                achievements: MOCK_RESUME_DATA.achievements,
                resume_json: {
                    summary: MOCK_RESUME_DATA.bio,
                    skills: MOCK_RESUME_DATA.skills,
                    experience: MOCK_RESUME_DATA.experience
                }
            });
            setHistory(MOCK_RESUME_DATA.volunteerHistory.map(h => ({
                activity: {
                    title: h.title,
                    location: h.location,
                    start_time: h.date
                },
                hours: h.hours
            })));
            setLoading(false);
        };

        // Simulate loading delay
        setTimeout(fetchData, 500);
    }, [session]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Button & Actions */}
                <div className="flex justify-between items-center mb-8 no-print">
                    <Link
                        href="/profile"
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Profile
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/profile/edit-resume"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all border border-gray-200 active:scale-95"
                        >
                            <Edit3 size={16} />
                            Edit Resume
                        </Link>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                        >
                            <Download size={16} />
                            Download PDF
                        </button>
                    </div>
                </div>

                {/* Main Resume Card */}
                <div className="bg-white rounded-[32px] shadow-xl overflow-hidden border border-gray-100 print:shadow-none print:border-none">
                    {/* Header/Banner */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white relative">
                        <div className="absolute top-8 right-8 no-print">
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                                <ShieldCheck size={18} />
                                <span className="text-xs font-bold uppercase tracking-wider">Verified Profile</span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="w-24 h-24 rounded-full border-4 border-white/30 overflow-hidden shadow-lg bg-white shrink-0">
                                <img
                                    src={stats?.image || session?.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Volunteer"}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="text-center md:text-left">
                                <h1 className="text-3xl font-extrabold tracking-tight mb-1">{stats?.name || session?.user?.name}</h1>
                                <p className="text-emerald-50 font-medium opacity-90 mb-4">Senior Volunteer • Verified by HolySheet</p>

                                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <Mail size={16} className="opacity-70" />
                                        <span>{session?.user?.email}</span>
                                    </div>
                                    {stats?.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className="opacity-70" />
                                            <span>{stats.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="opacity-70" />
                                        <span>{stats?.location || "Singapore"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-10">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-emerald-50 rounded-2xl p-5 text-center transition-all hover:bg-emerald-100/50">
                                <p className="text-emerald-600 font-extrabold text-3xl mb-1">{stats?.hours || 0}</p>
                                <p className="text-emerald-800/60 text-[10px] font-bold uppercase tracking-widest">Total Hours</p>
                            </div>
                            <div className="bg-teal-50 rounded-2xl p-5 text-center transition-all hover:bg-teal-100/50">
                                <p className="text-teal-600 font-extrabold text-3xl mb-1">{stats?.missions || 0}</p>
                                <p className="text-teal-800/60 text-[10px] font-bold uppercase tracking-widest">Missions Done</p>
                            </div>
                            <div className="bg-blue-50 rounded-2xl p-5 text-center transition-all hover:bg-blue-100/50">
                                <p className="text-blue-600 font-extrabold text-3xl mb-1">{stats?.achievements?.length || 0}</p>
                                <p className="text-blue-800/60 text-[10px] font-bold uppercase tracking-widest">Badges Earned</p>
                            </div>
                            <div className="bg-indigo-50 rounded-2xl p-5 text-center transition-all hover:bg-indigo-100/50">
                                <p className="text-indigo-600 font-extrabold text-3xl mb-1">Top 5%</p>
                                <p className="text-indigo-800/60 text-[10px] font-bold uppercase tracking-widest">Rank</p>
                            </div>
                        </div>

                        {/* Bio / About */}
                        <section>
                            <h2 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                                <Award size={20} className="text-emerald-600" />
                                Professional Summary
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                {stats?.resume_json?.summary || stats?.bio || "A dedicated volunteer committed to making a positive impact in the community through various initiatives including art therapy, education, and environmental conservation."}
                            </p>
                        </section>

                        <div className="grid md:grid-cols-2 gap-10">
                            {/* Skills */}
                            <section>
                                <h2 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                                    <GraduationCap size={20} className="text-teal-600" />
                                    Verified Skills
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {(stats?.resume_json?.skills?.length > 0 ? stats.resume_json.skills : stats?.skills)?.length > 0 ? (
                                        (stats?.resume_json?.skills?.length > 0 ? stats.resume_json.skills : stats.skills).map((skill: string, i: number) => (
                                            <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold border border-gray-200">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">No skills listed yet.</p>
                                    )}
                                </div>
                            </section>

                            {/* Achievements List */}
                            <section>
                                <h2 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                                    <Star size={20} className="text-amber-500" />
                                    Key Achievements
                                </h2>
                                <div className="space-y-3">
                                    {stats?.achievements?.length > 0 ? (
                                        stats.achievements.map((badge: any, i: number) => (
                                            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <Award size={18} className="text-amber-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{badge.name}</p>
                                                    <p className="text-xs text-gray-500">{badge.description}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Ready to earn your first badge!</p>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Professional Experience from resume_json if available */}
                        {stats?.resume_json?.experience?.length > 0 && (
                            <section>
                                <h2 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
                                    <GraduationCap size={20} className="text-blue-600" />
                                    Professional Experience
                                </h2>
                                <div className="space-y-6">
                                    {stats.resume_json.experience.map((exp: any, i: number) => (
                                        <div key={i} className="relative pl-6 border-l-2 border-blue-100">
                                            <div className="absolute -left-[9px] top-1 w-4 h-4 bg-white border-2 border-blue-500 rounded-full" />
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                <h3 className="font-bold text-gray-900">{exp.role}</h3>
                                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full">
                                                    {exp.period}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium">{exp.organization}</p>
                                            {exp.description && <p className="text-xs text-gray-500 mt-2">{exp.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Recent History / Experience */}
                        <section>
                            <h2 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
                                <Building2 size={20} className="text-emerald-600" />
                                Verified Volunteer History
                            </h2>
                            <div className="space-y-4">
                                {history.length > 0 ? (
                                    history.slice(0, 5).map((item: any, i: number) => (
                                        <div key={i} className="flex gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100">
                                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                                                <CheckCircle2 size={24} className="text-emerald-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                    <h3 className="font-bold text-gray-900">{item.activity?.title || "Mission"}</h3>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                        {item.activity?.start_time ? new Date(item.activity.start_time).toLocaleDateString() : "-"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin size={12} />
                                                        {item.activity?.location || "Singapore"}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        Verified Mission
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center py-10 text-gray-400 italic">History will appear here after your first mission.</p>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Verified Digital Resume by HolySheet</p>
                        <div className="flex items-center justify-center gap-4">
                            <Link href="/" className="text-xs font-semibold text-emerald-600 hover:underline">holysheet.com/verify/VOL-{session?.user?.id?.slice(0, 8)}</Link>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-8 text-xs text-gray-400 no-print">
                    This document is a digital representation of verified volunteer activities on the HolySheet platform.
                </p>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    .print\:shadow-none { shadow: none !important; }
                    .print\:border-none { border: none !important; }
                }
            `}</style>
        </div>
    );
}

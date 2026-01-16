'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sparkles, Calendar, Clock, Users, PlayCircle, Plus, Search, CheckCircle2, MoreHorizontal, ArrowRight, Zap, ListFilter, X, LayoutTemplate, PenTool } from 'lucide-react';
import AttendanceScanner from '@/components/AttendanceScanner';

interface Task {
    id: string;
    title: string;
    status: 'In progress' | 'On hold' | 'Done';
    time: string;
    icon_bg: string;
    icon_text: string;
}

const TASKS: Task[] = [
    {
        id: '1',
        title: 'Product Review for UI8 Market',
        status: 'In progress',
        time: '4h',
        icon_bg: 'bg-emerald-100',
        icon_text: '⚡'
    },
    {
        id: '2',
        title: 'UX Research for Product',
        status: 'On hold',
        time: '8h',
        icon_bg: 'bg-orange-100',
        icon_text: '🔍'
    },
    {
        id: '3',
        title: 'App design and development',
        status: 'Done',
        time: '32h',
        icon_bg: 'bg-blue-100',
        icon_text: '📱'
    }
];

export default function AdminDashboard() {
    const { data: session } = useSession();
    const router = useRouter(); // For navigation

    // Data State
    const [activities, setActivities] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalSignups: 0,
        volunteersNeeded: 0,
        activeEvents: 0,
        fulfillmentRate: 0,
        efficiencyRate: 0
    });
    const [loading, setLoading] = useState(true);

    // Form Generation State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [generationMode, setGenerationMode] = useState<'ai' | 'partial' | 'manual' | 'preview' | null>(null);
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedForm, setGeneratedForm] = useState<any>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            if (!session?.accessToken) return;

            // Fetch Weekly Report Data
            const res = await fetch('/api/admin/reports/weekly', {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();

                setActivities(data.activities.slice(0, 5)); // Top 5 activities
                setStats({
                    totalSignups: data.total_volunteers_registered,
                    volunteersNeeded: data.total_volunteers_needed - data.total_volunteers_registered,
                    activeEvents: data.total_activities,
                    fulfillmentRate: data.volunteer_fulfillment_rate,
                    efficiencyRate: data.avg_attendance_rate
                });
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [showScanner, setShowScanner] = useState(false); // Kept for AttendanceScanner component
    const handleScan = async (result: string) => { // Kept for AttendanceScanner component
        console.log('Scanned:', result);
        return { success: true, message: 'Scan received' };
    };

    const handleGenerateForm = async () => {
        if (!topic) return;
        setIsGenerating(true);
        try {
            const res = await fetch('/api/admin/ai/generate-form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic })
            });
            const data = await res.json();
            setGeneratedForm(data);
            setGenerationMode('preview'); // Switch to preview
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative p-8">
            {/* Header */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                        Hello, {session?.user?.name || 'Admin'} 👋
                    </h1>
                    <p className="text-gray-500 font-medium text-lg">Here's what's happening today.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsFormModalOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-[#101828] text-white font-bold rounded-xl hover:bg-gray-800 shadow-xl shadow-gray-200 transition-all hover:scale-105 active:scale-95">
                        <Sparkles size={18} className="text-yellow-400" />
                        Create Registration Form
                    </button>
                    <button className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 shadow-sm transition-all">
                        <Search size={20} />
                    </button>
                </div>
            </div>

            {/* Value Proposition Cards / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* Card 1: Efficiency / Total Signups */}
                <div className="bg-[#F8F9FB] rounded-3xl p-8 border border-gray-100 flex flex-col justify-between h-[280px] hover:border-indigo-100 hover:shadow-lg transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div>
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm mb-6 relative z-10">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-gray-900 font-bold text-3xl mb-1 relative z-10">{stats.efficiencyRate}%</h3>
                        <p className="text-gray-500 font-medium relative z-10">Avg. Attendance Rate</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 w-fit px-3 py-1 rounded-full">
                            <Users size={14} />
                            <span>{stats.totalSignups} Signed Up</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                            Across {stats.activeEvents} active events this week. Engagement is looking strong!
                        </p>
                    </div>
                </div>

                {/* Card 2: Volunteers Needed */}
                <div className="bg-[#F8F9FB] rounded-3xl p-8 border border-gray-100 flex flex-col justify-between h-[280px] hover:border-emerald-100 hover:shadow-lg transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div>
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm mb-6 relative z-10">
                            <Users size={24} />
                        </div>
                        <h3 className="text-gray-900 font-bold text-3xl mb-1 relative z-10">{stats.volunteersNeeded}</h3>
                        <p className="text-gray-500 font-medium relative z-10">Volunteers Needed</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full">
                            <PlayCircle size={14} />
                            <span>Urgent for 2 events</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                            We need more hands on deck. Consider sending a blast message.
                        </p>
                    </div>
                </div>

                {/* Card 3: AI Assistant / Smart Forms (Nav) */}
                <div onClick={() => setIsFormModalOpen(true)} className="bg-[#101828] rounded-3xl p-8 border border-gray-800 flex flex-col justify-between h-[280px] hover:shadow-xl hover:shadow-indigo-900/20 transition-all cursor-pointer group relative overflow-hidden">
                    {/* Abstract tech pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>

                    <div>
                        <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-yellow-400 mb-6 relative z-10 border border-gray-700">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-white font-bold text-2xl mb-1 relative z-10">Smart Forms</h3>
                        <p className="text-gray-400 font-medium relative z-10 text-sm">AI-Powered Generation</p>
                    </div>
                    <div className="relative z-10">
                        <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                            Create complex registration forms in seconds using our Gemini-powered AI agent.
                        </p>
                        <button className="w-full py-3 bg-white text-[#101828] font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm">
                            Try Generator
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Activities List */}
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <PlayCircle className="text-indigo-600" size={24} />
                        Upcoming Activities
                    </h2>
                    <button onClick={() => router.push('/admin/events')} className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">View All</button>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl p-2 flex-1 overflow-auto shadow-sm">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-gray-400">Loading activities...</div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                                    <th className="pb-4 pl-6 pt-4">Activity Name</th>
                                    <th className="pb-4 pt-4">Date</th>
                                    <th className="pb-4 pt-4">Volunteers</th>
                                    <th className="pb-4 pt-4">Status</th>
                                    <th className="pb-4 pt-4 pr-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {activities.map((activity, i) => (
                                    <tr key={i} className="group hover:bg-gray-50 transition-colors">
                                        <td className="py-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                    {activity.title.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{activity.title}</p>
                                                    <p className="text-xs text-gray-400">{activity.location || 'Location Pending'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm font-medium text-gray-600">
                                            {activity.date}
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full"
                                                        style={{ width: `${Math.min(100, ((activity.volunteers_registered || 0) / Math.max(1, activity.volunteers_needed || 1)) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-700">{activity.volunteers_registered || 0}/{activity.volunteers_needed || 0}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            {((activity.volunteers_registered || 0) / Math.max(1, activity.volunteers_needed || 1)) >= 1 ? (
                                                <span className="inline-flex px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wide">
                                                    Full
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wide">
                                                    Open
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 pr-6 text-right">
                                            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                                <ArrowRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Form Generation Modal */}
            {isFormModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">

                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Create Registration Form</h3>
                                <p className="text-sm text-gray-500">Choose how would you like to build your form</p>
                            </div>
                            <button onClick={() => { setIsFormModalOpen(false); setGenerationMode(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto flex-1">
                            {!generationMode ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setGenerationMode('ai')}
                                        className="flex flex-col items-center text-center p-6 border-2 border-indigo-50 hover:border-indigo-600 bg-indigo-50/30 hover:bg-indigo-50 rounded-2xl transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                            <Sparkles size={24} />
                                        </div>
                                        <h4 className="font-bold text-gray-900 mb-1">AI Generator</h4>
                                        <p className="text-xs text-gray-500">Describe your needs and let AI build the structure.</p>
                                    </button>

                                    <button
                                        onClick={() => setGenerationMode('partial')}
                                        className="flex flex-col items-center text-center p-6 border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 rounded-2xl transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                            <LayoutTemplate size={24} />
                                        </div>
                                        <h4 className="font-bold text-gray-900 mb-1">Cusom Template</h4>
                                        <p className="text-xs text-gray-500">Start from a pre-made template and customize it.</p>
                                    </button>

                                    <button
                                        onClick={() => setGenerationMode('manual')}
                                        className="flex flex-col items-center text-center p-6 border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 rounded-2xl transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                            <PenTool size={24} />
                                        </div>
                                        <h4 className="font-bold text-gray-900 mb-1">Manual</h4>
                                        <p className="text-xs text-gray-500">Build from scratch, field by field.</p>
                                    </button>
                                </div>
                            ) : generationMode === 'ai' ? (
                                <div className="space-y-6">
                                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                            What is this form for?
                                        </label>
                                        <textarea
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="E.g., A registration form for a beach cleanup volunteer event, requiring name, age, dietary restrictions, and emergency contact."
                                            className="w-full p-4 rounded-xl border-2 border-indigo-100 focus:border-indigo-600 focus:ring-0 text-sm h-32 resize-none transition-colors"
                                        ></textarea>
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={handleGenerateForm}
                                                disabled={!topic || isGenerating}
                                                className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isGenerating ? (
                                                    <>Generating...</>
                                                ) : (
                                                    <>
                                                        <Sparkles size={16} />
                                                        Generate Form
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <button onClick={() => setGenerationMode(null)} className="text-sm font-bold text-gray-400 hover:text-gray-600">
                                        ← Back
                                    </button>
                                </div>
                            ) : generationMode === 'preview' ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-lg text-gray-900">AI Suggestion</h4>
                                        <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-md">Generated</span>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 max-h-[300px] overflow-y-auto space-y-4">
                                        <p className="text-sm text-gray-600 italic">{generatedForm.description}</p>
                                        {generatedForm.fields?.map((field: any, i: number) => (
                                            <div key={i}>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                                </label>
                                                {field.type === 'textarea' ? (
                                                    <textarea className="w-full p-2 rounded-lg border border-gray-200 text-xs bg-white" placeholder={field.placeholder} disabled></textarea>
                                                ) : (
                                                    <input type={field.type} className="w-full p-2 rounded-lg border border-gray-200 text-xs bg-white" placeholder={field.placeholder} disabled />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                                        <button className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                            Discard
                                        </button>
                                        <button className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                                            Save & Publish
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-400 font-medium">Feature coming soon.</p>
                                    <button onClick={() => setGenerationMode(null)} className="mt-4 text-sm font-bold text-indigo-600">← Back</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Attendance Scanner kept for functionality */}
            <AttendanceScanner
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={handleScan}
            />
        </div>
    );
}

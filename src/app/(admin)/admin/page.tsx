'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Sparkles, Users, PlayCircle, ArrowRight, Zap,
    TrendingUp, Calendar, Activity, PieChart as PieChartIcon, BarChart3
} from 'lucide-react';
import AttendanceScanner from '@/components/AttendanceScanner';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import RegionalHeatMap from '@/components/admin/RegionalHeatMap';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function AdminDashboard() {
    const { data: session } = useSession();
    const router = useRouter();

    // Data State
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_volunteers: 0,
        total_activities: 0,
        active_now: 0
    });
    const [trendData, setTrendData] = useState<any[]>([]);
    const [distributionData, setDistributionData] = useState<any[]>([]);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [timeRange, setTimeRange] = useState('6m');

    // Form Generation State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);

    // Scanner State
    const [showScanner, setShowScanner] = useState(false);
    const handleScan = async (result: string) => {
        console.log('Scanned:', result);
        return { success: true, message: 'Scan received' };
    };

    useEffect(() => {
        fetchData();
    }, [session, timeRange]);

    const fetchData = async () => {
        if (!session?.accessToken) return;
        setLoading(true);
        try {
            // 1. Fetch Chart Stats
            const statsRes = await fetch(`/api/admin/reports/stats?time_range=${timeRange}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
                setTrendData(data.participation_trends);
                setDistributionData(data.activity_distribution);
            }

            // 2. Fetch Recent Activities (re-using existing endpoint or filtered list)
            const actRes = await fetch('/api/admin/activities', {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            if (actRes.ok) {
                const acts = await actRes.json();
                // Taking top 5 most recent upcoming
                setRecentActivities(acts.slice(0, 5));
            }

        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50 p-4 md:p-8 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1">Overview of volunteer engagement and activities.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowScanner(true)}
                        className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Zap size={18} className="text-orange-500" />
                        Scan Attendance
                    </button>
                    <button
                        onClick={() => setIsFormModalOpen(true)}
                        className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-[#101828] text-white font-bold rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all"
                    >
                        <Sparkles size={18} className="text-yellow-400" />
                        AI Form Generator
                    </button>
                </div>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium text-sm">Total Volunteers</span>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Users size={18} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.total_volunteers}</h3>
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1">
                            <TrendingUp size={12} />
                            <span>+12% from last month</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium text-sm">Total Activities</span>
                        <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                            <Calendar size={18} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.total_activities}</h3>
                        <p className="text-xs text-gray-400 mt-1">All time events</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium text-sm">Avg Attendance</span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Activity size={18} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-gray-900">85%</h3>
                        <p className="text-xs text-gray-400 mt-1">Consistent engagement</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#101828] to-[#1e293b] p-6 rounded-2xl border border-gray-800 shadow-sm flex flex-col justify-between h-32 text-white">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-medium text-sm">AI Insights</span>
                        <Sparkles size={18} className="text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-tight">"Engagement peaks on weekends. Try scheduling more social events on Fridays."</p>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Main Trend Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                            <BarChart3 className="text-gray-400" size={20} />
                            Volunteer Participation Trends
                        </h3>
                        <div className="flex bg-gray-50 p-1 rounded-lg">
                            {['7d', '30d', '6m'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === range
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '6 Months'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorNeed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F4F7" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="volunteers_needed" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorNeed)" name="Openings" />
                                <Area type="monotone" dataKey="volunteers_registered" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReg)" name="Registered" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Chart */}
                {/* Distribution Chart */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[420px]">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2">
                        <PieChartIcon className="text-gray-400" size={20} />
                        Activity Types
                    </h3>
                    <div className="flex-1 w-full min-h-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-3xl font-bold text-gray-900">{stats.total_activities}</span>
                            <span className="text-sm text-gray-500">Total</span>
                        </div>
                    </div>
                    {/* Updated Legend */}
                    <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-2 px-2 overflow-y-auto max-h-[100px] scrollbar-thin scrollbar-thumb-gray-200">
                        {distributionData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-md min-w-0">
                                <div className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-xs font-medium text-gray-600 truncate" title={`${entry.name} (${entry.value})`}>
                                    {entry.name} <span className="text-gray-400">({entry.value})</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Regional Volunteer Map */}
            <div className="mb-8">
                <RegionalHeatMap />
            </div>

            {/* Recent Table (Simplified) */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900 text-lg">Upcoming Activities</h3>
                    <button onClick={() => router.push('/admin/events')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <tbody className="divide-y divide-gray-50">
                            {recentActivities.map((activity, i) => (
                                <tr key={i} className="group hover:bg-gray-50 transition-colors">
                                    <td className="py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {(activity.title || 'U').substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-gray-900 text-sm">{activity.title}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-sm text-gray-500">
                                        {activity.start_time ? new Date(activity.start_time).toLocaleDateString() : 'TBD'}
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full"
                                                    style={{ width: `${Math.min(100, ((activity.volunteers_registered || 0) / Math.max(1, activity.volunteers_needed || 1)) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-500">{activity.volunteers_registered}/{activity.volunteers_needed}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <AttendanceScanner isOpen={showScanner} onClose={() => setShowScanner(false)} onScan={handleScan} />
        </div>
    );
}

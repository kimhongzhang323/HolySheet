'use client';

import { useState, useEffect } from 'react';
import { Scan, FileDown, TrendingUp, Users, AlertTriangle, CheckCircle, Bell, ExternalLink, Send } from 'lucide-react';
import AttendanceScanner from '@/components/AttendanceScanner';
import OpsCopilot from '@/components/OpsCopilot';

interface DashboardStats {
    volunteers_deployed: number;
    volunteers_deployed_change: number;
    fill_rate: number;
    fill_rate_change: number;
    upcoming_crises: number;
    upcoming_crises_change: number;
    pending_approvals: number;
    pending_approvals_change: number;
}

interface CrisisActivity {
    activity_id: string;
    title: string;
    start_time: string;
    location?: string;
    volunteers_needed: number;
    volunteers_registered: number;
    shortage: number;
    status: 'critical' | 'warning' | 'ok';
}

interface AIInsight {
    type: 'volunteer_shortage' | 'feedback_summary' | 'suggestion';
    message: string;
    activities_count?: number;
    actionable: boolean;
}

interface BlastTarget {
    volunteer_id: string;
    name: string;
    phone: string;
    skills: string[];
    whatsapp_link: string;
}

const MOCK_CRISIS_ACTIVITIES: CrisisActivity[] = [
    {
        activity_id: 'mock-1',
        title: 'Urgent: Food Distribution',
        start_time: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        location: 'Community Center A',
        volunteers_needed: 10,
        volunteers_registered: 2,
        shortage: 8,
        status: 'critical'
    },
    {
        activity_id: 'mock-2',
        title: 'Emergency Medical Support',
        start_time: new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
        location: 'City Sports Complex',
        volunteers_needed: 5,
        volunteers_registered: 3,
        shortage: 2,
        status: 'warning'
    },
    {
        activity_id: 'mock-3',
        title: 'Logistics Coordination',
        start_time: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        location: 'Warehouse B',
        volunteers_needed: 8,
        volunteers_registered: 8,
        shortage: 0,
        status: 'ok'
    }
];

const MOCK_BLAST_TARGETS: BlastTarget[] = [
    {
        volunteer_id: 'v1',
        name: 'Sarah Chen',
        phone: '+65 9123 4567',
        skills: ['First Aid', 'Coordination'],
        whatsapp_link: 'https://wa.me/6591234567?text=Hi%20Sarah,%20we%20urgently%20need%20help%20at%20Community%20Center%20A!'
    },
    {
        volunteer_id: 'v2',
        name: 'Ahmad bin Yusef',
        phone: '+65 9876 5432',
        skills: ['Heavy Lifting', 'Driving'],
        whatsapp_link: 'https://wa.me/6598765432?text=Hi%20Ahmad,%20we%20urgently%20need%20help%20at%20Community%20Center%20A!'
    },
    {
        volunteer_id: 'v3',
        name: 'John Tan',
        phone: '+65 8234 5678',
        skills: ['Logistics'],
        whatsapp_link: 'https://wa.me/6582345678?text=Hi%20John,%20we%20urgently%20need%20help%20at%20Community%20Center%20A!'
    }
];
export default function AdminDashboard() {
    const [showScanner, setShowScanner] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        volunteers_deployed: 142,
        volunteers_deployed_change: 12,
        fill_rate: 88,
        fill_rate_change: 5,
        upcoming_crises: 5,
        upcoming_crises_change: 2,
        pending_approvals: 12,
        pending_approvals_change: -3,
    });
    const [crisisActivities, setCrisisActivities] = useState<CrisisActivity[]>([]);
    const [aiInsight, setAIInsight] = useState<AIInsight>({
        type: 'volunteer_shortage',
        message: "I've identified 3 activities with zero volunteers for this weekend. I've drafted urgent WhatsApp blasts targeting volunteers with relevant skills.",
        activities_count: 3,
        actionable: true
    });
    const [blastModal, setBlastModal] = useState<{ isOpen: boolean; activityId: string; targets: BlastTarget[] }>({
        isOpen: false,
        activityId: '',
        targets: []
    });

    useEffect(() => {
        fetchCrisisData();
    }, []);

    const fetchCrisisData = async () => {
        // Simulating API call with mock data
        setCrisisActivities(MOCK_CRISIS_ACTIVITIES);
    };

    const handleScan = async (userId: string, activityId: string) => {
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/admin/attendance/mark', {
                method: 'POST',
                headers,
                body: JSON.stringify({ user_id: userId, activity_id: activityId })
            });

            const data = await response.json();

            return {
                success: response.ok,
                message: data.message || 'Failed to mark attendance',
                userName: data.user_name
            };
        } catch (error) {
            return {
                success: false,
                message: 'Network error occurred'
            };
        }
    };

    const handleBlast = async (activity: CrisisActivity) => {
        setBlastModal({
            isOpen: true,
            activityId: activity.activity_id,
            targets: MOCK_BLAST_TARGETS
        });
    };

    const exportWeeklyReport = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/admin/reports/volunteers/export', { headers });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'weekly_report.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white px-8 py-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={exportWeeklyReport}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors border border-gray-300"
                        >
                            <FileDown size={18} />
                            Export Weekly Report
                        </button>
                        <button
                            onClick={() => setShowScanner(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
                        >
                            <Scan size={18} />
                            Launch Scanner Mode
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="p-8 space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Volunteers Deployed */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Users className="text-blue-600" size={24} />
                            </div>
                            <span className="text-sm font-semibold text-emerald-600">
                                +{stats.volunteers_deployed_change}%
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Volunteers Deployed</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.volunteers_deployed}</p>
                    </div>

                    {/* Fill Rate */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <TrendingUp className="text-purple-600" size={24} />
                            </div>
                            <span className="text-sm font-semibold text-emerald-600">
                                +{stats.fill_rate_change}%
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Fill Rate</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.fill_rate}%</p>
                    </div>

                    {/* Upcoming Crises */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <AlertTriangle className="text-red-600" size={24} />
                            </div>
                            <span className="text-sm font-semibold text-red-600">
                                +{stats.upcoming_crises_change} new
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Upcoming Crises</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.upcoming_crises}</p>
                    </div>

                    {/* Pending Approvals */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <Bell className="text-orange-600" size={24} />
                            </div>
                            <span className="text-sm font-semibold text-gray-500">
                                {stats.pending_approvals_change}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Pending Approvals</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.pending_approvals}</p>
                    </div>
                </div>

                {/* AI Ops Copilot Insight */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-gray-900">AI Ops Copilot</h3>
                                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded">
                                    NEW INSIGHT
                                </span>
                            </div>
                            <p className="text-gray-700 mb-4">{aiInsight.message}</p>
                            <div className="flex gap-3">
                                <button className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors border border-gray-300">
                                    Dismiss
                                </button>
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md">
                                    Review Drafts
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Crisis Monitor */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="text-red-600" size={24} />
                            <h2 className="text-xl font-bold text-gray-900">Crisis Monitor</h2>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search events..."
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                            />
                            <button className="p-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors">
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Event Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Date / Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Required PAX
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Current Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {crisisActivities.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <CheckCircle className="mx-auto text-emerald-500 mb-3" size={48} />
                                            <p className="text-gray-600 font-medium">No volunteer shortages! 🎉</p>
                                            <p className="text-sm text-gray-400 mt-1">All activities are properly staffed</p>
                                        </td>
                                    </tr>
                                ) : (
                                    crisisActivities.slice(0, 5).map((activity) => (
                                        <tr key={activity.activity_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900">{activity.title}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-700">
                                                    {new Date(activity.start_time).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-700">{activity.location}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {activity.volunteers_needed}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${activity.status === 'critical'
                                                    ? 'bg-red-100 text-red-700'
                                                    : activity.status === 'warning'
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {activity.status === 'critical' && '▶ '}
                                                    {activity.volunteers_registered} / {activity.volunteers_needed}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {activity.status === 'critical' || activity.status === 'warning' ? (
                                                    <button
                                                        onClick={() => handleBlast(activity)}
                                                        className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wide rounded shadow-md transition-all hover:scale-105"
                                                    >
                                                        📢 Blast WhatsApp
                                                    </button>
                                                ) : (
                                                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                                                        Assign
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {crisisActivities.length > 5 && (
                        <div className="px-6 py-4 border-t border-gray-200 text-center bg-gray-50">
                            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                                View All Activities →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Scanner Modal */}
            <AttendanceScanner
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={handleScan}
            />

            {/* AI Ops Copilot Chatbot */}
            <div className="fixed bottom-6 right-6 z-50">
                <OpsCopilot />
            </div>

            {/* Blast Modal */}
            {blastModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                            <h3 className="text-xl font-bold text-gray-900">WhatsApp Volunteer Blast</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Found {blastModal.targets.length} matching volunteers
                            </p>
                        </div>

                        <div className="p-6 space-y-3">
                            {blastModal.targets.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                    No volunteers found with matching skills or phone numbers.
                                </p>
                            ) : (
                                blastModal.targets.map((target) => (
                                    <div key={target.volunteer_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div>
                                            <p className="font-semibold text-gray-900">{target.name}</p>
                                            <p className="text-sm text-gray-600">{target.phone}</p>
                                            <div className="flex gap-1 mt-1">
                                                {target.skills.map(skill => (
                                                    <span key={skill} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <a
                                            href={target.whatsapp_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <ExternalLink size={16} />
                                            Send
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
                            <button
                                onClick={() => setBlastModal({ isOpen: false, activityId: '', targets: [] })}
                                className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

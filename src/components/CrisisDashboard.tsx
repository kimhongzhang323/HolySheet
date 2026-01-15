'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Users, Send, ExternalLink } from 'lucide-react';

interface CrisisActivity {
    activity_id: string;
    title: string;
    start_time: string;
    hours_until: number;
    location?: string;
    volunteers_needed: number;
    volunteers_registered: number;
    shortage: number;
    fill_percentage: number;
    status: 'critical' | 'warning' | 'ok';
    skills_required: string[];
}

interface BlastTarget {
    volunteer_id: string;
    name: string;
    phone: string;
    skills: string[];
    whatsapp_link: string;
}

export default function CrisisDashboard() {
    const [activities, setActivities] = useState<CrisisActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [blastModal, setBlastModal] = useState<{ isOpen: boolean; activityId: string; targets: BlastTarget[] }>({
        isOpen: false,
        activityId: '',
        targets: []
    });

    useEffect(() => {
        fetchCrisisData();
        // Refresh every 5 minutes
        const interval = setInterval(fetchCrisisData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchCrisisData = async () => {
        try {
            const response = await fetch('/api/admin/volunteers/crisis-dashboard?days_ahead=7');
            const data = await response.json();
            setActivities(data.activities || []);
        } catch (error) {
            console.error('Failed to fetch crisis data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBlastRequest = async (activityId: string) => {
        try {
            const response = await fetch('/api/admin/volunteers/generate-blast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activity_id: activityId })
            });

            const data = await response.json();
            setBlastModal({
                isOpen: true,
                activityId,
                targets: data.targets || []
            });
        } catch (error) {
            console.error('Failed to generate blast:', error);
            alert('Failed to generate volunteer blast');
        }
    };

    const criticalCount = activities.filter(a => a.status === 'critical').length;
    const warningCount = activities.filter(a => a.status === 'warning').length;

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="text-red-600" size={24} />
                            <h3 className="text-lg font-bold text-gray-900">Crisis Dashboard</h3>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                                {criticalCount} Critical
                            </span>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                                {warningCount} Warning
                            </span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                            <p className="mt-4 text-gray-500">Loading crisis data...</p>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-500 font-medium">No volunteer shortages! 🎉</p>
                            <p className="text-sm text-gray-400 mt-1">All activities are properly staffed</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Activity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Needed
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Registered
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {activities.map((activity) => (
                                    <tr key={activity.activity_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-gray-900">{activity.title}</p>
                                                {activity.skills_required.length > 0 && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Skills: {activity.skills_required.join(', ')}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-0.5">📍 {activity.location}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900">
                                                {new Date(activity.start_time).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {activity.hours_until < 24
                                                    ? `${activity.hours_until}h away`
                                                    : `${Math.floor(activity.hours_until / 24)}d away`}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {activity.volunteers_needed}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {activity.volunteers_registered}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${activity.status === 'critical'
                                                    ? 'bg-red-100 text-red-700'
                                                    : activity.status === 'warning'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                {activity.status === 'critical' && '🔴 '}
                                                {activity.status === 'warning' && '🟡 '}
                                                {activity.status === 'ok' && '🟢 '}
                                                {activity.fill_percentage}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {activity.shortage > 0 && (
                                                <button
                                                    onClick={() => handleBlastRequest(activity.activity_id)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                                                >
                                                    <Send size={16} />
                                                    Blast Request
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
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
        </>
    );
}

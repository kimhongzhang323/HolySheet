'use client';

import { useState } from 'react';
import { FileDown, TrendingUp, Users, Calendar, Loader2 } from 'lucide-react';

interface WeeklyReport {
    week_start: string;
    week_end: string;
    total_activities: number;
    total_capacity: number;
    total_attended: number;
    avg_attendance_rate: number;
    total_volunteers_needed: number;
    total_volunteers_registered: number;
    volunteer_fulfillment_rate: number;
}

export default function ReportingPanel() {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<WeeklyReport | null>(null);
    const [startDate, setStartDate] = useState('');

    const generateWeeklyReport = async () => {
        setLoading(true);
        try {
            const url = startDate
                ? `/api/admin/reports/weekly?start_date=${startDate}`
                : '/api/admin/reports/weekly';

            const response = await fetch(url);
            const data = await response.json();
            setReport(data);
        } catch (error) {
            console.error('Failed to generate report:', error);
            alert('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const downloadCsv = async (type: 'volunteers') => {
        try {
            const response = await fetch(`/api/admin/reports/${type}/export`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_report.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download report');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                    <FileDown className="text-emerald-600" size={24} />
                    <h3 className="text-lg font-bold text-gray-900">Reports & Export</h3>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Weekly Report Generator */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Generate Weekly Report
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="Start date (optional)"
                        />
                        <button
                            onClick={generateWeeklyReport}
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <TrendingUp size={18} />
                                    Generate
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Leave date empty to generate report for current week
                    </p>
                </div>

                {/* Report Preview */}
                {report && (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-900">Weekly Summary</h4>
                            <span className="text-sm text-gray-600">
                                {new Date(report.week_start).toLocaleDateString()} - {new Date(report.week_end).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="text-blue-600" size={20} />
                                    <span className="text-sm font-medium text-gray-600">Activities</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{report.total_activities}</p>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="text-purple-600" size={20} />
                                    <span className="text-sm font-medium text-gray-600">Attendance Rate</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{report.avg_attendance_rate}%</p>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="text-emerald-600" size={20} />
                                    <span className="text-sm font-medium text-gray-600">Total Attended</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{report.total_attended}</p>
                                <p className="text-xs text-gray-500 mt-1">of {report.total_capacity} capacity</p>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="text-orange-600" size={20} />
                                    <span className="text-sm font-medium text-gray-600">Volunteer Fill Rate</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{report.volunteer_fulfillment_rate}%</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {report.total_volunteers_registered} of {report.total_volunteers_needed}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Export Buttons */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Quick Exports
                    </label>
                    <div className="space-y-2">
                        <button
                            onClick={() => downloadCsv('volunteers')}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 text-gray-700 font-medium rounded-lg transition-all flex items-center justify-between group"
                        >
                            <span>Volunteer Roster (Excel)</span>
                            <FileDown className="text-gray-400 group-hover:text-emerald-600" size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

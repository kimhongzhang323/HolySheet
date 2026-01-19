
'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Calendar, MapPin, Users, Clock, ArrowLeft, CheckCircle2, XCircle, User, Loader2, Mail, Network, Type, Sparkles, Edit2, ArrowUpDown, Megaphone, Download } from 'lucide-react';
import Link from 'next/link';
import AIResponseAnalysis from '@/components/admin/AIResponseAnalysis';
import EditEventDialog from '@/components/admin/EditEventDialog';
import BroadcastDialog from '@/components/admin/BroadcastDialog';


interface Activity {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    latitude?: number;
    longitude?: number;
    capacity: number;
    volunteers_needed: number;
    volunteers_registered: number;
    activity_type: string;
    status: string;
    volunteer_form?: any;
}

interface Volunteer {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    applied_at: string;
    skills: string[];
}

interface Attendee {
    id: string;
    name: string;
    email: string;
}

interface FormResponse {
    id: string;
    user_name: string;
    user_email: string;
    responses: Record<string, any>;
    submitted_at: string;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();

    const [activity, setActivity] = useState<Activity | null>(null);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [responses, setResponses] = useState<FormResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'volunteers' | 'attendance' | 'responses'>('volunteers');
    const [isGeneratingForm, setIsGeneratingForm] = useState(false);
    const [generatedForm, setGeneratedForm] = useState<any>(null);
    const [isDynamicView, setIsDynamicView] = useState(false);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [broadcastQR, setBroadcastQR] = useState<string | null>(null);
    const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof Volunteer | 'user', direction: 'asc' | 'desc' }>({ key: 'applied_at', direction: 'desc' });

    useEffect(() => {
        if (session?.accessToken && id) {
            fetchData();
        }
    }, [session, id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${session?.accessToken || 'admin@holysheet.com'}` };

            const [actRes, volRes, attRes, respRes] = await Promise.all([
                fetch(`/api/admin/activities/${id}`, { headers }),
                fetch(`/api/admin/activities/${id}/volunteers`, { headers }),
                fetch(`/api/admin/activities/${id}/attendance`, { headers }),
                fetch(`/api/admin/activities/${id}/form-responses`, { headers })
            ]);

            if (actRes.ok) setActivity(await actRes.json());
            if (volRes.ok) setVolunteers(await volRes.json());
            if (attRes.ok) {
                const attData = await attRes.json();
                setAttendees(attData.attendees || []);
            }
            if (respRes.ok) setResponses(await respRes.json());
        } catch (err) {
            console.error("Failed to fetch event details:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: keyof Volunteer | 'user') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedVolunteers = [...volunteers].sort((a, b) => {
        const { key, direction } = sortConfig;
        let valA: any = a[key as keyof Volunteer];
        let valB: any = b[key as keyof Volunteer];

        if (key === 'user') {
            valA = a.name;
            valB = b.name;
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleGenerateAIForm = async () => {
        if (!activity) return;
        setIsGeneratingForm(true);
        try {
            const res = await fetch('/api/admin/ai/generate-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken || 'admin@holysheet.com'}`
                },
                body: JSON.stringify({ topic: activity.title + ": " + activity.description })
            });
            if (res.ok) {
                const form = await res.json();
                setGeneratedForm(form);
            }
        } catch (err) {
            console.error("AI Generation failed:", err);
        } finally {
            setIsGeneratingForm(false);
        }
    };

    const handleSaveForm = async () => {
        if (!generatedForm) return;
        try {
            const res = await fetch('/api/admin/ai/save-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken || 'admin@holysheet.com'}`
                },
                body: JSON.stringify({ activity_id: id, form_structure: generatedForm })
            });
            if (res.ok) {
                if (activity) setActivity({ ...activity, volunteer_form: generatedForm });
                setGeneratedForm(null);
                alert("Application form saved!");
            }
        } catch (err) {
            console.error("Failed to save form:", err);
        }
    };

    const handleCustomizeForm = async () => {
        router.push(`/admin/events/${id}/form-editor`);
    };

    const handleAnalyzeResponses = async () => {
        if (!id) return;
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/admin/ai/analyze-responses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken || 'admin@holysheet.com'}`
                },
                body: JSON.stringify({ activity_id: id })
            });
            if (res.ok) {
                const data = await res.json();
                setAnalysisData(data);
                setIsDynamicView(true);
            }
        } catch (err) {
            console.error("Analysis failed:", err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveEvent = async (updatedData: any) => {
        if (!id) return;
        try {
            const res = await fetch(`/api/admin/activities/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken || 'admin@holysheet.com'}`
                },
                body: JSON.stringify(updatedData)
            });

            if (res.ok) {
                const updatedActivity = await res.json();
                setActivity(updatedActivity);
                setIsEditDialogOpen(false);
            } else {
                alert("Failed to update event");
            }
        } catch (error) {
            console.error("Error updating event:", error);
            alert("An error occurred while saving");
        }
    };

    const handleBroadcast = async (message: string, filter: string, testNumber?: string) => {
        try {
            const res = await fetch('/api/admin/communications/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({
                    message,
                    activityId: id,
                    targetFilter: filter,
                    testNumber
                })
            });

            const data = await res.json();

            if (data.needsAuth && data.qr) {
                setBroadcastQR(data.qr);
                // Do not alert error, just show the QR
            } else if (res.ok) {
                alert(data.message);
                setIsBroadcastOpen(false); // Close on success
                setBroadcastQR(null);
            } else {
                alert(`Error: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to send broadcast");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>Event not found or access denied.</p>
                <Link href="/admin/events" className="text-indigo-600 mt-4 inline-block font-bold">Back to Events</Link>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50/30 min-h-full">
            <Link href="/admin/events" className="flex items-center gap-2 text-gray-400 hover:text-gray-900 mb-6 transition-colors w-fit">
                <ArrowLeft size={16} />
                <span className="text-sm font-medium">Back to Events</span>
            </Link>

            <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${activity.activity_type === 'meetup'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-green-50 text-green-700'
                                }`}>
                                {activity.activity_type}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-500 font-medium">{activity.status}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">{activity.title}</h1>
                        <p className="text-gray-600 max-w-2xl leading-relaxed">{activity.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setIsEditDialogOpen(true)}
                            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 flex-1 md:flex-none justify-center"
                        >
                            <Edit2 size={16} />
                            Edit Event
                        </button>
                        <Link
                            href={`/admin/events/${id}/form-editor`}
                            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 flex-1 md:flex-none justify-center"
                        >
                            <Type size={16} />
                            Manage Form
                        </Link>
                        <button
                            onClick={() => setIsBroadcastOpen(true)}
                            className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all shadow-sm flex items-center gap-2 flex-1 md:flex-none justify-center"
                        >
                            <Megaphone size={16} />
                            Recruit Volunteers
                        </button>
                        <button
                            onClick={handleGenerateAIForm}
                            disabled={isGeneratingForm}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 flex-1 md:flex-none justify-center"
                        >
                            {isGeneratingForm ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Network size={16} />
                            )}
                            AI Generate Form
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-50 text-gray-600">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Date</p>
                            <p className="font-bold text-gray-900">{new Date(activity.start_time).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Time</p>
                            <p className="font-bold text-gray-900">
                                {new Date(activity.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Location</p>
                            {activity.location ? (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-indigo-600 hover:underline line-clamp-1"
                                >
                                    {activity.location}
                                </a>
                            ) : (
                                <p className="text-gray-400 italic">No location set</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {generatedForm && (
                <div className="mb-8 bg-indigo-50 border border-indigo-100 rounded-3xl p-8 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-indigo-900">AI Suggested Form: {generatedForm.title}</h2>
                            <p className="text-sm text-indigo-600 font-medium">{generatedForm.description}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setGeneratedForm(null)}
                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSaveForm}
                                className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all font-bold"
                            >
                                Use This Form
                            </button>
                            <button
                                onClick={handleCustomizeForm}
                                className="px-6 py-2 bg-white border border-indigo-100 text-indigo-600 text-sm font-bold rounded-xl shadow-sm hover:bg-indigo-50 transition-all font-bold"
                            >
                                Customize & Edit
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {generatedForm.fields?.map((field: any, idx: number) => (
                            <div key={idx} className="bg-white p-4 rounded-2xl border border-indigo-100/50 shadow-sm">
                                <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                                    {field.type} {field.required && <span className="text-red-400">*</span>}
                                </label>
                                <p className="text-sm font-bold text-gray-900">{field.label}</p>
                                {field.options && field.options.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {field.options.map((opt: string, i: number) => (
                                            <span key={i} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                                                {opt}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-50 px-8">
                    <button
                        onClick={() => setActiveTab('volunteers')}
                        className={`py-5 px-4 text-sm font-bold transition-all relative ${activeTab === 'volunteers' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Volunteers
                        <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'volunteers' ? 'bg-indigo-50' : 'bg-gray-50'}`}>{volunteers.length}</span>
                        {activeTab === 'volunteers' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`py-5 px-4 text-sm font-bold transition-all relative ${activeTab === 'attendance' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Attendance
                        <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'attendance' ? 'bg-indigo-50' : 'bg-gray-50'}`}>{attendees.length}</span>
                        {activeTab === 'attendance' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('responses')}
                        className={`py-5 px-4 text-sm font-bold transition-all relative ${activeTab === 'responses' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Form Responses
                        <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'responses' ? 'bg-indigo-50' : 'bg-gray-50'}`}>{responses.length}</span>
                        {activeTab === 'responses' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
                    </button>

                    {activeTab === 'responses' && (
                        <div className="ml-auto flex items-center gap-3 pr-4">
                            {/* Export Dropdown */}
                            <div className="relative group">
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100">
                                    <Download size={14} />
                                    Export ▾
                                </button>
                                <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-100 p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30">
                                    <button
                                        onClick={() => {
                                            if (responses.length === 0) { alert('No responses to export'); return; }
                                            const allFields = new Set<string>();
                                            responses.forEach(r => Object.keys(r.responses).forEach(k => allFields.add(k)));
                                            const fields = ['User Name', 'Email', 'Submitted At', ...Array.from(allFields)];
                                            const csvRows = [fields.join(',')];
                                            responses.forEach(r => {
                                                const row = [
                                                    `"${r.user_name}"`,
                                                    `"${r.user_email}"`,
                                                    `"${new Date(r.submitted_at).toLocaleString()}"`,
                                                    ...Array.from(allFields).map(f => `"${String(r.responses[f] || '').replace(/"/g, '""')}"`)
                                                ];
                                                csvRows.push(row.join(','));
                                            });
                                            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                                            const url = URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `form-responses-${activity?.title || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
                                            link.click();
                                            URL.revokeObjectURL(url);
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        📄 Export CSV
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (responses.length === 0) { alert('No responses to export'); return; }
                                            const XLSX = (await import('xlsx')).default;
                                            const allFields = new Set<string>();
                                            responses.forEach(r => Object.keys(r.responses).forEach(k => allFields.add(k)));
                                            const data = responses.map(r => ({
                                                'User Name': r.user_name,
                                                'Email': r.user_email,
                                                'Submitted At': new Date(r.submitted_at).toLocaleString(),
                                                ...Object.fromEntries(Array.from(allFields).map(f => [f, r.responses[f] || '']))
                                            }));
                                            const ws = XLSX.utils.json_to_sheet(data);
                                            const wb = XLSX.utils.book_new();
                                            XLSX.utils.book_append_sheet(wb, ws, 'Responses');
                                            XLSX.writeFile(wb, `form-responses-${activity?.title || 'export'}-${new Date().toISOString().split('T')[0]}.xlsx`);
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        📊 Export Excel
                                    </button>
                                </div>
                            </div>

                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setIsDynamicView(false)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isDynamicView ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Table View
                                </button>
                                <button
                                    onClick={() => {
                                        if (analysisData) setIsDynamicView(true);
                                        else handleAnalyzeResponses();
                                    }}
                                    disabled={isAnalyzing}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isDynamicView ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                    Dynamic View
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-0">
                    {activeTab === 'volunteers' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th
                                            onClick={() => handleSort('user')}
                                            className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors group"
                                        >
                                            <div className="flex items-center gap-1">
                                                User
                                                <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 ${sortConfig.key === 'user' ? 'opacity-100 text-indigo-600' : ''}`} />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('role')}
                                            className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors group"
                                        >
                                            <div className="flex items-center gap-1">
                                                Role
                                                <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 ${sortConfig.key === 'role' ? 'opacity-100 text-indigo-600' : ''}`} />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('applied_at')}
                                            className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors group"
                                        >
                                            <div className="flex items-center gap-1">
                                                Time Applied
                                                <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 ${sortConfig.key === 'applied_at' ? 'opacity-100 text-indigo-600' : ''}`} />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('status')}
                                            className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors group"
                                        >
                                            <div className="flex items-center gap-1">
                                                Status
                                                <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 ${sortConfig.key === 'status' ? 'opacity-100 text-indigo-600' : ''}`} />
                                            </div>
                                        </th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Skills</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sortedVolunteers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-12 text-center text-gray-400 text-sm">No volunteers registered yet</td>
                                        </tr>
                                    ) : sortedVolunteers.map((vol) => (
                                        <tr key={vol.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                        <User size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{vol.name}</p>
                                                        <p className="text-xs text-gray-500">{vol.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="text-sm font-medium text-gray-600">{vol.role}</span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="text-sm text-gray-500">
                                                    {vol.applied_at ? new Date(vol.applied_at).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wide text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                                                    <CheckCircle2 size={12} />
                                                    {vol.status}
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(vol.skills || []).map((s, i) => (
                                                        <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{s}</span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : activeTab === 'attendance' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {attendees.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-12 text-center text-gray-400 text-sm">No attendance recorded yet</td>
                                        </tr>
                                    ) : attendees.map((att) => (
                                        <tr key={att.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                        <User size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{att.name}</p>
                                                        <p className="text-xs text-gray-500">{att.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                                                    <CheckCircle2 size={12} />
                                                    Checked In
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <button className="text-xs font-bold text-indigo-600 hover:underline">View Profile</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        isDynamicView && analysisData ? (
                            <AIResponseAnalysis data={analysisData} />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Submitted At</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Responses</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {responses.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-8 py-12 text-center text-gray-400 text-sm">No form responses yet</td>
                                            </tr>
                                        ) : responses.map((resp) => {
                                            const isExpanded = expandedResponses.has(resp.id);
                                            const responseEntries = Object.entries(resp.responses);
                                            const hasMore = responseEntries.length > 2;

                                            return (
                                                <tr key={resp.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-8 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                                <Mail size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900">{resp.user_name}</p>
                                                                <p className="text-xs text-gray-500">{resp.user_email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(resp.submitted_at).toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <div className="text-xs space-y-1.5">
                                                            {(isExpanded ? responseEntries : responseEntries.slice(0, 2)).map(([q, a], i) => (
                                                                <p key={i} className={isExpanded ? '' : 'line-clamp-1'}>
                                                                    <span className="font-bold text-gray-500">{q}:</span>{' '}
                                                                    <span className="text-gray-700">{String(a)}</span>
                                                                </p>
                                                            ))}
                                                            {hasMore && (
                                                                <button
                                                                    onClick={() => {
                                                                        setExpandedResponses(prev => {
                                                                            const next = new Set(prev);
                                                                            if (isExpanded) {
                                                                                next.delete(resp.id);
                                                                            } else {
                                                                                next.add(resp.id);
                                                                            }
                                                                            return next;
                                                                        });
                                                                    }}
                                                                    className="text-indigo-600 font-bold hover:underline flex items-center gap-1 mt-1"
                                                                >
                                                                    {isExpanded ? (
                                                                        <>Show less ↑</>
                                                                    ) : (
                                                                        <>+{responseEntries.length - 2} more answers ↓</>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
            </div>
            {activity && (
                <EditEventDialog
                    isOpen={isEditDialogOpen}
                    onClose={() => setIsEditDialogOpen(false)}
                    event={activity}
                    onSave={handleSaveEvent}
                />
            )}

            {activity && (
                <BroadcastDialog
                    isOpen={isBroadcastOpen}
                    onClose={() => {
                        setIsBroadcastOpen(false);
                        setBroadcastQR(null);
                    }}
                    activityTitle={activity?.title || ''}
                    onSend={handleBroadcast}
                    qrCode={broadcastQR}
                />
            )}
        </div>
    );
}

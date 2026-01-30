
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
    skills_required?: string[];
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
    checked_in_at?: string;
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
    const [hasFetched, setHasFetched] = useState(false);
    const [activeTab, setActiveTab] = useState<'volunteers' | 'attendance'>('volunteers');
    const [isGeneratingForm, setIsGeneratingForm] = useState(false);
    const [generatedForm, setGeneratedForm] = useState<any>(null);
    const [isDynamicView, setIsDynamicView] = useState(false);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [broadcastQR, setBroadcastQR] = useState<string | null>(null);
    const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());

    const [sortConfig, setSortConfig] = useState<{ key: keyof Volunteer | 'user', direction: 'asc' | 'desc' }>({ key: 'applied_at', direction: 'desc' });
    const [aiApproveEnabled, setAiApproveEnabled] = useState(false);
    const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
    const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);

    useEffect(() => {
        // Only fetch once when we have a session and haven't fetched yet
        if (session?.accessToken && id && !hasFetched) {
            fetchData();
        }
    }, [session?.accessToken, id, hasFetched]);

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
            setHasFetched(true);
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

                    {/* AI Approve Toggle - shows when volunteers tab is active */}
                    {activeTab === 'volunteers' && (
                        <div className="ml-auto flex items-center gap-3 pr-4">
                            <span className="text-xs font-medium text-gray-500">AI Auto-Approve</span>
                            <button
                                onClick={() => setAiApproveEnabled(!aiApproveEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${aiApproveEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${aiApproveEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                            {aiApproveEnabled && (
                                <span className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold">
                                    <Sparkles size={12} />
                                    AI Active
                                </span>
                            )}
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
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meets Requirements</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sortedVolunteers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-8 py-12 text-center text-gray-400 text-sm">No volunteers registered yet</td>
                                        </tr>
                                    ) : sortedVolunteers.map((vol) => (
                                        <tr
                                            key={vol.id}
                                            onClick={() => setSelectedVolunteer(vol)}
                                            className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                        >
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
                                            <td className="px-8 py-4">
                                                {(() => {
                                                    const requiredSkills = activity?.skills_required || [];
                                                    const volunteerSkills = vol.skills || [];
                                                    const matchingSkills = requiredSkills.filter(skill =>
                                                        volunteerSkills.some(vs => vs.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(vs.toLowerCase()))
                                                    );
                                                    const meetsRequirements = requiredSkills.length === 0 || matchingSkills.length >= Math.ceil(requiredSkills.length / 2);
                                                    return meetsRequirements ? (
                                                        <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wide text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                                                            <CheckCircle2 size={12} />
                                                            Yes
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-1 rounded-full w-fit">
                                                            <Clock size={12} />
                                                            Partial
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-2">
                                                    {(vol.status === 'pending' || vol.status === 'PENDING') ? (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // TODO: Implement approve API call
                                                                    alert('Volunteer approved!');
                                                                }}
                                                                className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // TODO: Implement reject API call
                                                                    alert('Volunteer rejected!');
                                                                }}
                                                                className="p-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all"
                                                                title="Reject"
                                                            >
                                                                <XCircle size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Check-in Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {attendees.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-12 text-center text-gray-400 text-sm">No attendance recorded yet</td>
                                        </tr>
                                    ) : attendees.map((att) => (
                                        <tr
                                            key={att.id}
                                            onClick={() => setSelectedAttendee(att)}
                                            className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                        >
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
                                                <span className="text-sm text-gray-500">
                                                    {att.checked_in_at ? new Date(att.checked_in_at).toLocaleString() : 'N/A'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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

            {/* Volunteer Detail Modal */}
            {selectedVolunteer && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                                    {selectedVolunteer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{selectedVolunteer.name}</h2>
                                    <p className="text-white/80 text-sm">{selectedVolunteer.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Role</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedVolunteer.role}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Applied</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {selectedVolunteer.applied_at
                                            ? new Date(selectedVolunteer.applied_at).toLocaleDateString('en-US', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Status</p>
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${selectedVolunteer.status === 'confirmed' || selectedVolunteer.status === 'CONFIRMED'
                                    ? 'bg-green-100 text-green-700'
                                    : selectedVolunteer.status === 'pending' || selectedVolunteer.status === 'PENDING'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {selectedVolunteer.status === 'confirmed' || selectedVolunteer.status === 'CONFIRMED' ? (
                                        <CheckCircle2 size={14} />
                                    ) : (
                                        <Clock size={14} />
                                    )}
                                    {selectedVolunteer.status.toUpperCase()}
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    {(selectedVolunteer.skills || []).length > 0 ? (
                                        selectedVolunteer.skills.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-400">No skills listed</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="border-t border-gray-100 p-4 flex items-center gap-3">
                            <button
                                onClick={() => setSelectedVolunteer(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendee Detail Modal */}
            {selectedAttendee && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                                    {selectedAttendee.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{selectedAttendee.name}</h2>
                                    <p className="text-white/80 text-sm">{selectedAttendee.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Attendance Status</p>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                    <CheckCircle2 size={14} />
                                    CHECKED IN
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-in Time</p>
                                <p className="text-sm font-bold text-gray-900">
                                    {selectedAttendee.checked_in_at
                                        ? new Date(selectedAttendee.checked_in_at).toLocaleString('en-US', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : 'N/A'}
                                </p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Event</p>
                                <p className="text-sm font-bold text-gray-900">{activity?.title || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="border-t border-gray-100 p-4 flex items-center gap-3">
                            <button
                                onClick={() => setSelectedAttendee(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
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

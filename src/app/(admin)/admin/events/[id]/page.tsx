
'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Calendar, MapPin, Users, Clock, ArrowLeft, CheckCircle2, XCircle, User, Loader2, Mail, Network, Type, Sparkles, Edit2, ArrowUpDown, Megaphone, Download, FileText, Star, Heart, Phone, UserCheck, Wand2 } from 'lucide-react';
import Link from 'next/link';
import AIResponseAnalysis from '@/components/admin/AIResponseAnalysis';
import EditEventDialog from '@/components/admin/EditEventDialog';
import BroadcastDialog from '@/components/admin/BroadcastDialog';
import EventInsightsView from '@/components/admin/EventInsightsView';
import { ADMIN_MOCK_ACTIVITIES, ADMIN_MOCK_VOLUNTEERS } from '@/lib/adminMockData';


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
    requirements?: string[];
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
    needs_support?: 'low' | 'moderate' | 'high';
    interests?: string[];
    caregiver?: {
        name: string;
        phone: string;
        relationship: string;
    } | null;
}

interface VolunteerMatch {
    volunteerId: string;
    volunteerName: string;
    attendeeId: string;
    attendeeName: string;
    matchScore: number;
    matchReason: string;
    skills: string[];
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
    const [activeTab, setActiveTab] = useState<'volunteers' | 'attendance' | 'insights'>('volunteers');
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

    // AI Volunteer Matcher states
    const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());
    const [isMatching, setIsMatching] = useState(false);
    const [volunteerMatches, setVolunteerMatches] = useState<Record<string, VolunteerMatch[]>>({});
    const [showMatchResults, setShowMatchResults] = useState(false);

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

    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');

    const handleGenerateAIForm = () => {
        setIsTemplateModalOpen(true);
    };

    const handleSelectTemplate = (type: 'simple' | 'standard' | 'detailed') => {
        setIsTemplateModalOpen(false);
        setIsGeneratingForm(true);

        // Simulate AI delay
        setTimeout(() => {
            let mockForm;

            if (type === 'simple') {
                mockForm = {
                    title: "Quick Registration",
                    description: "Sign up quickly to join our event!",
                    fields: [
                        { label: "Name", type: "text", required: true, options: [] },
                        { label: "Contact Number", type: "text", required: true, options: [] },
                        { label: "Dietary Requirements", type: "text", required: false, options: [] }
                    ]
                };
            } else if (type === 'standard') {
                mockForm = {
                    title: "Volunteer Application",
                    description: "Join us in making a difference! Please fill out this form to apply.",
                    fields: [
                        { label: "Why do you want to volunteer?", type: "textarea", required: true, options: [] },
                        { label: "Previous Experience", type: "select", required: true, options: ["None", "1-2 years", "3-5 years", "5+ years"] },
                        { label: "Dietary Restrictions", type: "text", required: false, options: [] },
                        { label: "Emergency Contact", type: "text", required: true, options: [] }
                    ]
                };
            } else {
                mockForm = {
                    title: "Detailed Volunteer Application",
                    description: "We'd love to get to know you better. Please complete this detailed application.",
                    fields: [
                        { label: "Motivation Statement", type: "textarea", required: true, options: [] },
                        { label: "Relevant Skills", type: "checkbox", required: true, options: ["First Aid", "Event Planning", "Photography", "Logistics", "Translation"] },
                        { label: "Availability", type: "select", required: true, options: ["Weekdays", "Weekends", "Evenings", "Flexible"] },
                        { label: "Previous Leadership Roles", type: "textarea", required: false, options: [] },
                        { label: "Emergency Contact Name", type: "text", required: true, options: [] },
                        { label: "Emergency Contact Number", type: "text", required: true, options: [] }
                    ]
                };
            }

            setGeneratedForm(mockForm);
            setIsGeneratingForm(false);
        }, 1000);
    };

    const handleGenerateFromPrompt = async () => {
        if (!customPrompt.trim()) return;
        setIsTemplateModalOpen(false);
        setIsGeneratingForm(true);

        try {
            const res = await fetch('/api/admin/ai/generate-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken || 'admin@holysheet.com'}`
                },
                body: JSON.stringify({ topic: customPrompt })
            });

            if (res.ok) {
                const data = await res.json();
                setGeneratedForm(data);
            } else {
                alert("Failed to generate form. Please try again.");
            }
        } catch (err) {
            console.error("AI Generation failed:", err);
            alert("An error occurred during generation.");
        } finally {
            setIsGeneratingForm(false);
            setCustomPrompt('');
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
        // Mock successful broadcast
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                alert(`Broadcast sent successfully to 12 targeted volunteers via ${filter === 'all' ? 'All Channels' : filter}!`);
                setIsBroadcastOpen(false);
                setBroadcastQR(null);
                resolve();
            }, 1000);
        });
    };

    // AI Volunteer Matching functions
    const handleSelectAttendee = (attendeeId: string) => {
        const newSelected = new Set(selectedAttendees);
        if (newSelected.has(attendeeId)) {
            newSelected.delete(attendeeId);
        } else {
            newSelected.add(attendeeId);
        }
        setSelectedAttendees(newSelected);
    };

    const handleSelectAllAttendees = () => {
        if (selectedAttendees.size === attendees.length) {
            setSelectedAttendees(new Set());
        } else {
            setSelectedAttendees(new Set(attendees.map(a => a.id)));
        }
    };

    const handleAIMatchVolunteers = async () => {
        if (selectedAttendees.size === 0) {
            alert('Please select at least one attendee to match volunteers.');
            return;
        }

        setIsMatching(true);
        try {
            const res = await fetch('/api/admin/ai/match-volunteers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken || 'admin@holysheet.com'}`
                },
                body: JSON.stringify({
                    attendeeIds: Array.from(selectedAttendees),
                    activityId: id
                })
            });

            if (res.ok) {
                const data = await res.json();
                setVolunteerMatches(data.matches);
                setShowMatchResults(true);
            } else {
                alert('Failed to match volunteers. Please try again.');
            }
        } catch (err) {
            console.error('AI Matching failed:', err);
            alert('An error occurred during matching.');
        } finally {
            setIsMatching(false);
        }
    };

    const getMatchScoreColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
        if (score >= 60) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (score >= 40) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const getSupportLevelBadge = (level?: string) => {
        switch (level) {
            case 'high':
                return <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">High Support</span>;
            case 'moderate':
                return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">Moderate Support</span>;
            case 'low':
                return <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full">Low Support</span>;
            default:
                return null;
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

            {isTemplateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                <Sparkles size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a Form Template</h2>
                            <p className="text-gray-500">Select a starting point for your volunteer application form.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <button
                                onClick={() => handleSelectTemplate('simple')}
                                className="p-6 rounded-2xl border-2 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FileText size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">Simple</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">Basic contact info and dietary needs. Quick and easy.</p>
                            </button>

                            <button
                                onClick={() => handleSelectTemplate('standard')}
                                className="p-6 rounded-2xl border-2 border-indigo-500 bg-indigo-50 text-left relative ring-4 ring-indigo-500/10"
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    Recommended
                                </div>
                                <div className="w-10 h-10 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center mb-4">
                                    <Star size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">Standard</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">Includes motivation, experience, and specific requirements.</p>
                            </button>

                            <button
                                onClick={() => handleSelectTemplate('detailed')}
                                className="p-6 rounded-2xl border-2 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Clock size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">Detailed</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">Comprehensive background check, skills, and availability.</p>
                            </button>
                        </div>

                        <div className="mb-6 relative">
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center gap-4">
                                <div className="h-px bg-gray-100 flex-1"></div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-white px-2">Or custom</span>
                                <div className="h-px bg-gray-100 flex-1"></div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 mb-8">
                            <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wide mb-2">
                                Tell us your requirements
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="e.g. A volunteer form for a music festival seeking security and medical staff..."
                                    className="flex-1 px-4 py-3 rounded-xl border-none shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateFromPrompt()}
                                />
                                <button
                                    onClick={handleGenerateFromPrompt}
                                    disabled={!customPrompt.trim()}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    <Sparkles size={18} />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsTemplateModalOpen(false)}
                            className="w-full py-3 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

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
                        onClick={() => setActiveTab('insights')}
                        className={`py-5 px-4 text-sm font-bold transition-all relative ${activeTab === 'insights' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className="flex items-center gap-2">
                            <Sparkles size={14} className={activeTab === 'insights' ? 'text-indigo-600' : 'text-gray-400'} />
                            AI Insights
                        </span>
                        {activeTab === 'insights' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
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
                    {activeTab === 'volunteers' && (
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
                    )}
                    {activeTab === 'attendance' && (
                        <div>
                            {/* AI Matcher Controls */}
                            <div className="px-8 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-indigo-100">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                            <Wand2 size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">AI Volunteer Matcher</h3>
                                            <p className="text-xs text-gray-500">Select attendees to find the best volunteer matches</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500">
                                            {selectedAttendees.size} of {attendees.length} selected
                                        </span>
                                        <button
                                            onClick={handleSelectAllAttendees}
                                            className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-all"
                                        >
                                            {selectedAttendees.size === attendees.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                        <button
                                            onClick={handleAIMatchVolunteers}
                                            disabled={isMatching || selectedAttendees.size === 0}
                                            className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isMatching ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin" />
                                                    Matching...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={14} />
                                                    Match Volunteers
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Match Results Panel */}
                            {showMatchResults && Object.keys(volunteerMatches).length > 0 && (
                                <div className="px-8 py-4 bg-green-50 border-b border-green-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <UserCheck size={18} className="text-green-600" />
                                            <h4 className="text-sm font-bold text-green-800">AI Match Results</h4>
                                        </div>
                                        <button
                                            onClick={() => setShowMatchResults(false)}
                                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                                        >
                                            Hide Results
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {Object.entries(volunteerMatches).map(([attendeeId, matches]) => {
                                            const attendee = attendees.find(a => a.id === attendeeId);
                                            return (
                                                <div key={attendeeId} className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">
                                                            {attendee?.name?.charAt(0) || '?'}
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-900">{attendee?.name || 'Unknown'}</span>
                                                        {attendee?.caregiver && (
                                                            <Heart size={12} className="text-pink-500" />
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        {matches.slice(0, 3).map((match, idx) => (
                                                            <div key={idx} className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-bold text-gray-400">#{idx + 1}</span>
                                                                    <span className="text-xs font-medium text-gray-700">{match.volunteerName}</span>
                                                                </div>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getMatchScoreColor(match.matchScore)}`}>
                                                                    {match.matchScore}%
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Attendance Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAttendees.size === attendees.length && attendees.length > 0}
                                                    onChange={handleSelectAllAttendees}
                                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </th>
                                            <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                                            <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Support Level</th>
                                            <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Caregiver</th>
                                            <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Check-in Time</th>
                                            <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Match</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {attendees.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-8 py-12 text-center text-gray-400 text-sm">No attendance recorded yet</td>
                                            </tr>
                                        ) : attendees.map((att) => (
                                            <tr
                                                key={att.id}
                                                className={`hover:bg-gray-50/50 transition-colors ${selectedAttendees.has(att.id) ? 'bg-indigo-50/50' : ''}`}
                                            >
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAttendees.has(att.id)}
                                                        onChange={() => handleSelectAttendee(att.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 cursor-pointer" onClick={() => setSelectedAttendee(att)}>
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
                                                <td className="px-4 py-4">
                                                    {getSupportLevelBadge(att.needs_support)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {att.caregiver ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                                                                <Heart size={12} className="text-pink-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-900">{att.caregiver.name}</p>
                                                                <p className="text-[10px] text-gray-500">{att.caregiver.relationship}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">No caregiver</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                                                        <CheckCircle2 size={12} />
                                                        Checked In
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm text-gray-500">
                                                        {att.checked_in_at ? new Date(att.checked_in_at).toLocaleString() : 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {volunteerMatches[att.id] && volunteerMatches[att.id].length > 0 ? (
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${getMatchScoreColor(volunteerMatches[att.id][0].matchScore)}`}>
                                                                {volunteerMatches[att.id][0].volunteerName} ({volunteerMatches[att.id][0].matchScore}%)
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'insights' && (
                        <div className="p-6">
                            <EventInsightsView />
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
            )
            }

            {
                activity && (
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
                )
            }

            {/* Volunteer Detail Modal */}
            {
                selectedVolunteer && (
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
                )
            }

            {/* Attendee Detail Modal */}
            {
                selectedAttendee && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white sticky top-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                                        {selectedAttendee.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedAttendee.name}</h2>
                                        <p className="text-white/80 text-sm">{selectedAttendee.email}</p>
                                        {selectedAttendee.needs_support && (
                                            <div className="mt-1">
                                                {getSupportLevelBadge(selectedAttendee.needs_support)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
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
                                </div>

                                {/* Interests */}
                                {selectedAttendee.interests && selectedAttendee.interests.length > 0 && (
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Interests</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedAttendee.interests.map((interest, i) => (
                                                <span key={i} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg">
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Caregiver Section */}
                                <div className={`p-4 rounded-xl ${selectedAttendee.caregiver ? 'bg-pink-50 border border-pink-100' : 'bg-gray-50'}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Heart size={16} className={selectedAttendee.caregiver ? 'text-pink-600' : 'text-gray-400'} />
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Caregiver Information</p>
                                    </div>
                                    {selectedAttendee.caregiver ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-pink-700 font-bold">
                                                    {selectedAttendee.caregiver.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{selectedAttendee.caregiver.name}</p>
                                                    <p className="text-xs text-gray-500">{selectedAttendee.caregiver.relationship}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-lg">
                                                <Phone size={14} className="text-pink-600" />
                                                <a href={`tel:${selectedAttendee.caregiver.phone}`} className="hover:text-pink-600 transition-colors">
                                                    {selectedAttendee.caregiver.phone}
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">No caregiver assigned</p>
                                    )}
                                </div>

                                {/* AI Match Results for this attendee */}
                                {volunteerMatches[selectedAttendee.id] && volunteerMatches[selectedAttendee.id].length > 0 && (
                                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sparkles size={16} className="text-indigo-600" />
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">AI Volunteer Matches</p>
                                        </div>
                                        <div className="space-y-2">
                                            {volunteerMatches[selectedAttendee.id].map((match, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                                                                {idx + 1}
                                                            </span>
                                                            <span className="text-sm font-bold text-gray-900">{match.volunteerName}</span>
                                                        </div>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getMatchScoreColor(match.matchScore)}`}>
                                                            {match.matchScore}% Match
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">{match.matchReason}</p>
                                                    {match.skills.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {match.skills.slice(0, 3).map((skill, i) => (
                                                                <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Event</p>
                                    <p className="text-sm font-bold text-gray-900">{activity?.title || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="border-t border-gray-100 p-4 flex items-center gap-3 sticky bottom-0 bg-white">
                                {selectedAttendee.caregiver && (
                                    <a
                                        href={`tel:${selectedAttendee.caregiver.phone}`}
                                        className="flex-1 px-4 py-2 bg-pink-100 text-pink-700 rounded-xl font-bold text-sm hover:bg-pink-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Phone size={14} />
                                        Call Caregiver
                                    </a>
                                )}
                                <button
                                    onClick={() => setSelectedAttendee(null)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

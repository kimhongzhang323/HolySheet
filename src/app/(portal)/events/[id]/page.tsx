'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ArrowLeft, Calendar, Clock, Users, Share2, Heart, CheckCircle,
    X, AlertCircle, FileText, Send, Phone, Mail, User, ToggleRight,
    Upload, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { VOLUNTEER_ACTIVITIES, USER_APPLICATIONS } from '@/lib/mockData';

interface FormField {
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'tel';
    required: boolean;
    options?: string[];
}

interface FormStructure {
    title: string;
    description: string;
    fields: FormField[];
}

interface VolunteerActivity {
    id: string;
    title: string;
    type?: string;
    activityType?: string;
    category: string;
    description: string;
    fullDescription?: string;
    location: string;
    start_time: string;
    end_time: string;
    image_url: string;
    requirements?: string[];
    requiresPortfolio?: boolean;
    volunteer_form?: FormStructure;
    volunteers_needed?: number;
    capacity?: number;
    organizer?: string;
    organizer_label?: string;
    schedule?: string;
    activity_type?: string;
    tags?: string[];
}

export default function EventDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { data: session } = useSession();

    const [activity, setActivity] = useState<VolunteerActivity | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

    // Dynamic Form Data
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [portfolioFile, setPortfolioFile] = useState<{ fileName: string; fileType: 'pdf' | 'image'; fileUrl: string } | null>(null);

    useEffect(() => {
        async function fetchActivity() {
            try {
                setIsLoading(true);
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 500));

                const activityData = VOLUNTEER_ACTIVITIES.find((a: any) => (a._id || a.id) === id) as any;

                if (activityData) {
                    setActivity({
                        ...activityData,
                        id: activityData._id || activityData.id
                    } as VolunteerActivity);

                    // Check if user already applied
                    if (session?.user?.email) {
                        const existingApp = USER_APPLICATIONS.find((app: any) => app.title.includes(activityData.title.split(' ')[0])); // Simple match for mock

                        if (existingApp) {
                            setApplicationStatus(existingApp.status.toLowerCase() as any);
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching activity:", err);
            } finally {
                setIsLoading(false);
            }
        }

        if (id) {
            fetchActivity();
        }
    }, [id, session]);

    const handleFormChange = (label: string, value: string) => {
        setFormData(prev => ({ ...prev, [label]: value }));
    };

    const handleAIAutofill = async () => {
        if (!session?.user?.id) return;
        setIsAnalyzing(true);

        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            // Mock AI autofill - generates responses based on form field labels
            const mockSuggestions: Record<string, string> = {};
            const userName = session.user.name || 'Volunteer';
            const userEmail = session.user.email || '';

            activity?.volunteer_form?.fields.forEach(field => {
                const label = field.label.toLowerCase();

                // Generate contextual mock responses based on field label
                if (label.includes('name') || label.includes('full name')) {
                    mockSuggestions[field.label] = userName;
                } else if (label.includes('email')) {
                    mockSuggestions[field.label] = userEmail;
                } else if (label.includes('phone') || label.includes('contact')) {
                    mockSuggestions[field.label] = '+65 9123 4567';
                } else if (label.includes('motivation') || label.includes('why')) {
                    mockSuggestions[field.label] = `I am passionate about contributing to ${activity?.title || 'this initiative'} and believe my skills can make a meaningful impact. I'm eager to learn, collaborate with fellow volunteers, and support the community.`;
                } else if (label.includes('experience') || label.includes('background')) {
                    mockSuggestions[field.label] = `I have previous volunteering experience in community service and event coordination. I am comfortable working with diverse groups and have strong communication skills.`;
                } else if (label.includes('skill') || label.includes('abilities')) {
                    mockSuggestions[field.label] = 'Communication, Teamwork, Problem-solving, Time Management';
                } else if (label.includes('availability') || label.includes('schedule')) {
                    mockSuggestions[field.label] = 'Weekends and public holidays. Flexible timing.';
                } else if (label.includes('dietary') || label.includes('food')) {
                    mockSuggestions[field.label] = 'No dietary restrictions';
                } else if (label.includes('emergency') || label.includes('contact person')) {
                    mockSuggestions[field.label] = 'Family Member - +65 8765 4321';
                } else if (label.includes('t-shirt') || label.includes('size')) {
                    mockSuggestions[field.label] = 'M';
                } else if (label.includes('expectation') || label.includes('hope')) {
                    mockSuggestions[field.label] = `I hope to gain hands-on experience, meet like-minded individuals, and contribute positively to ${activity?.organizer || 'the organization'}'s mission.`;
                } else if (label.includes('how did you') || label.includes('hear about')) {
                    mockSuggestions[field.label] = 'Social media and word of mouth from friends';
                } else if (field.type === 'textarea') {
                    mockSuggestions[field.label] = `I am excited to participate in ${activity?.title || 'this activity'} and contribute my time and effort to support the community.`;
                } else if (field.type === 'select' && field.options?.length) {
                    mockSuggestions[field.label] = field.options[0]; // Select first option
                } else if (field.type === 'text') {
                    mockSuggestions[field.label] = userName;
                }
            });

            setFormData(prev => ({ ...prev, ...mockSuggestions }));
        } catch (error) {
            console.error('Autofill Error:', error);
            alert('Failed to generate responses.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPortfolioFile({
                fileName: file.name,
                fileType: file.type.includes('pdf') ? 'pdf' : 'image',
                fileUrl: URL.createObjectURL(file)
            });
        }
    };

    const handleSubmitApplication = async () => {
        if (!session?.user?.id) {
            router.push('/login');
            return;
        }

        // Check required fields
        const missingFields = activity?.volunteer_form?.fields
            .filter(f => f.required && !formData[f.label])
            .map(f => f.label);

        if (missingFields && missingFields.length > 0) {
            alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
            return;
        }

        if (activity?.requiresPortfolio && !portfolioFile) {
            alert('Please upload a portfolio.');
            return;
        }

        setIsSubmitting(true);
        setIsSubmitting(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Success
            setApplicationStatus('pending');
            setShowApplicationModal(false);
        } catch (err: any) {
            console.error("Submission error:", err);
            alert(`Failed to submit application: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWithdrawApplication = async () => {
        if (!window.confirm('Are you sure you want to withdraw your application?')) return;

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));
            setApplicationStatus(null);
        } catch (err) {
            console.error("Withdraw error:", err);
            alert("Failed to withdraw application.");
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category?.toLowerCase()) {
            case 'befriending': return 'bg-pink-100 text-pink-700 border-pink-200';
            case 'hub': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'skills': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'outings': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusDisplay = () => {
        switch (applicationStatus) {
            case 'pending':
                return {
                    icon: Clock,
                    title: 'Application Pending',
                    description: 'Your application is being reviewed by the organizer.',
                    color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                    iconColor: 'text-yellow-500',
                };
            case 'approved':
                return {
                    icon: CheckCircle,
                    title: 'Application Approved!',
                    description: 'Congratulations! You have been accepted as a volunteer.',
                    color: 'bg-green-50 border-green-200 text-green-700',
                    iconColor: 'text-green-500',
                };
            case 'rejected':
                return {
                    icon: X,
                    title: 'Application Not Accepted',
                    description: 'Unfortunately, your application was not accepted this time.',
                    color: 'bg-red-50 border-red-200 text-red-700',
                    iconColor: 'text-red-500',
                };
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Activity Not Found</h1>
                <p className="text-gray-500 mb-6">The volunteer activity you're looking for doesn't exist.</p>
                <Link href="/events" className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors">
                    Back to Volunteer Activities
                </Link>
            </div>
        );
    }

    const startDate = new Date(activity.start_time);
    const day = startDate.getDate();
    const month = startDate.toLocaleString('default', { month: 'long' }).toUpperCase();
    const year = startDate.getFullYear();
    const schedule = activity.schedule || `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(activity.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const statusDisplay = getStatusDisplay();

    return (
        <div className="max-w-5xl mx-auto px-0 md:px-4">
            <AnimatePresence>
                {showApplicationModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowApplicationModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <h2 className="text-xl font-bold text-gray-900">Volunteer Application</h2>
                                <button onClick={() => setShowApplicationModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="overflow-y-auto pr-2 space-y-6 flex-1">
                                <div className="bg-gray-50 rounded-2xl p-4">
                                    <h3 className="font-semibold text-gray-900 mb-1">{activity.title}</h3>
                                    <p className="text-sm text-gray-500">{schedule}</p>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 text-indigo-500 rounded-lg shadow-sm">
                                            <Sparkles size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">Smart AI Autofill</p>
                                            <p className="text-xs text-gray-500">Auto-complete based on your profile</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAIAutofill}
                                        disabled={isAnalyzing}
                                        className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {isAnalyzing ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                Analyzing...
                                            </span>
                                        ) : 'Auto-Fill'}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {activity.volunteer_form?.fields.map((field, idx) => (
                                        <div key={idx}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5 pl-1">
                                                {field.label} {field.required && <span className="text-red-500">*</span>}
                                            </label>

                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    value={formData[field.label] || ''}
                                                    onChange={(e) => handleFormChange(field.label, e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-400 focus:bg-white transition-all text-sm resize-none text-gray-900 placeholder:text-gray-400"
                                                    rows={3}
                                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                                />
                                            ) : field.type === 'select' ? (
                                                <select
                                                    value={formData[field.label] || ''}
                                                    onChange={(e) => handleFormChange(field.label, e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-400 focus:bg-white transition-all text-sm text-gray-900"
                                                >
                                                    <option value="">Select an option</option>
                                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    value={formData[field.label] || ''}
                                                    onChange={(e) => handleFormChange(field.label, e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-400 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400"
                                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                                />
                                            )}
                                        </div>
                                    ))}

                                    {activity.requiresPortfolio && (
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 pl-1">
                                                <Upload size={14} />
                                                Portfolio Submission <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                {!portfolioFile ? (
                                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-white hover:border-green-400 transition-all cursor-pointer relative">
                                                        <div className="p-3 bg-white rounded-full shadow-sm">
                                                            <Upload size={20} className="text-gray-400" />
                                                        </div>
                                                        <div className="text-center text-xs text-gray-500">
                                                            <p className="font-medium text-gray-700">Click to upload portfolio</p>
                                                            <p>PDF or Image files accepted</p>
                                                        </div>
                                                        <input type="file" onChange={handlePortfolioUpload} accept="image/*,.pdf" className="absolute inset-0 opacity-0 cursor-pointer" />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-green-200 rounded-xl">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="flex-shrink-0 p-2 bg-white rounded-lg">
                                                                {portfolioFile.fileType === 'pdf' ? <FileText size={20} className="text-blue-500" /> : <ImageIcon size={20} className="text-green-500" />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{portfolioFile.fileName}</p>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => setPortfolioFile(null)} className="p-1.5 hover:text-red-500 rounded-lg text-gray-400">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 shrink-0 border-t border-gray-100 flex flex-col gap-3">
                                <button
                                    onClick={handleSubmitApplication}
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</> : <><Send size={18} /> Submit Application</>}
                                </button>
                                <p className="text-[10px] text-gray-400 text-center">By applying, you agree to the volunteer terms and conditions.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => router.push('/events')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group px-4 md:px-0"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Volunteer Activities</span>
            </motion.button>

            <div className="relative h-64 md:h-96 md:rounded-3xl overflow-hidden mb-8 group">
                <img src={activity.image_url} alt={activity.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                <div className={`absolute top-6 left-6 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider border shadow-sm ${getCategoryColor(activity.category)}`}>
                    {activity.category}
                </div>

                <div className="absolute bottom-6 left-8 text-white">
                    <span className="block text-6xl md:text-8xl font-black leading-none drop-shadow-2xl">{day}</span>
                    <span className="text-xl font-bold tracking-[0.2em] opacity-90 drop-shadow-md">{month} {year}</span>
                </div>

                <button className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all">
                    <Share2 size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
                <div className="lg:col-span-2 space-y-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-5xl font-black text-gray-900 mb-3 tracking-tight">
                            <span className="text-green-600 uppercase">{activity.title}</span>
                        </h1>
                        <p className="text-xl text-gray-500 font-medium">{activity.activity_type || 'Volunteering Opportunity'}</p>
                        {activity.organizer && (
                            <p className="text-lg text-gray-600 mt-2">
                                {activity.organizer_label || 'Organizer'}: <span className="font-semibold text-gray-900">{activity.organizer}</span>
                            </p>
                        )}
                    </motion.div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-green-500 rounded-full"></div>
                            About This Activity
                        </h2>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600 leading-relaxed">
                            {(activity.fullDescription || activity.description || 'No description available for this activity.').split('\n').map((line, i) => (
                                <p key={i} className="mb-4">{line}</p>
                            ))}
                        </div>
                    </div>

                    {activity.requirements && (
                        <div className="bg-emerald-50/50 rounded-3xl p-8 border border-emerald-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Requirements</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activity.requirements.map((req, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-emerald-100/50">
                                        <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                                        <span className="text-sm font-medium text-gray-700">{req}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm sticky top-24">
                        <h2 className="text-xl font-bold text-gray-900 mb-8">Activity Info</h2>
                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="p-3 bg-orange-50 rounded-2xl text-orange-600 shrink-0"><Calendar size={20} /></div>
                                <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Time & Schedule</p><p className="font-bold text-gray-900 leading-tight">{schedule}</p></div>
                            </div>
                            <div className="flex gap-4">
                                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shrink-0"><MapPin size={20} /></div>
                                <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Location</p><p className="font-bold text-gray-900 leading-tight">{activity.location}</p></div>
                            </div>
                            <div className="flex gap-4">
                                <div className="p-3 bg-green-50 rounded-2xl text-green-600 shrink-0"><Users size={20} /></div>
                                <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Volunteers</p><p className="font-bold text-gray-900 leading-tight">{activity.volunteers_needed || 0} spots / {activity.capacity || 0} cap</p></div>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-gray-50 flex flex-col gap-4">
                            {applicationStatus ? (
                                <div className={`rounded-3xl p-6 border text-center ${statusDisplay?.color}`}>
                                    {statusDisplay && <statusDisplay.icon size={40} className={`mx-auto mb-3 ${statusDisplay.iconColor}`} />}
                                    <h3 className="font-bold text-gray-900">{statusDisplay?.title}</h3>
                                    <p className="text-sm opacity-80 mb-4">{statusDisplay?.description}</p>
                                    {applicationStatus === 'pending' && (
                                        <button onClick={handleWithdrawApplication} className="text-xs font-bold text-red-600 hover:underline">Withdraw Application</button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowApplicationModal(true)}
                                    className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black tracking-widest uppercase hover:bg-green-600 transition-all shadow-lg hover:shadow-green-200"
                                >
                                    Apply Now
                                </button>
                            )}
                            <button className="flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-pink-500 transition-colors">
                                <Heart size={16} /> Save for later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

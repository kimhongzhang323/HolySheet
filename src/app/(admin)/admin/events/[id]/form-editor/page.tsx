'use client';

import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Plus, Trash2, Save, Loader2, GripVertical, CheckCircle, X, Type, List as ListIcon, CheckSquare, Calendar as CalendarIcon, Phone, Monitor, Smartphone, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function FormEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'phone' | 'web'>('phone');
    const [isPreviewFull, setIsPreviewFull] = useState(false);
    const [aiFieldIndex, setAiFieldIndex] = useState<number | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [activity, setActivity] = useState<any>(null);
    const [form, setForm] = useState<FormStructure>({
        title: 'Volunteer Application',
        description: 'Please fill out this form to volunteer for our event.',
        fields: [
            { label: 'Full Name', type: 'text', required: true },
            { label: 'Contact Number', type: 'tel', required: true }
        ]
    });

    useEffect(() => {
        if (session?.accessToken && id) {
            fetchActivity();
        }
    }, [session, id]);

    const fetchActivity = async () => {
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${session?.accessToken || 'admin@holysheet.com'}` };
            const res = await fetch(`/api/admin/activities/${id}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setActivity(data);
                if (data.volunteer_form) {
                    setForm(data.volunteer_form);
                } else {
                    // Default title based on activity
                    setForm(prev => ({
                        ...prev,
                        title: `Application: ${data.title}`
                    }));
                }
            }
        } catch (err) {
            console.error("Failed to fetch activity:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddField = () => {
        setForm({
            ...form,
            fields: [
                ...form.fields,
                { label: 'New Question', type: 'text', required: false }
            ]
        });
    };

    const handleRemoveField = (index: number) => {
        const newFields = [...form.fields];
        newFields.splice(index, 1);
        setForm({ ...form, fields: newFields });
    };

    const handleUpdateField = (index: number, updates: Partial<FormField>) => {
        const newFields = [...form.fields];
        newFields[index] = { ...newFields[index], ...updates };
        setForm({ ...form, fields: newFields });
    };

    const handleAIGenerateField = async (index: number) => {
        if (!aiPrompt.trim()) return;
        setAiLoading(true);
        try {
            const res = await fetch('/api/admin/ai/generate-field', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken || 'admin@holysheet.com'}`
                },
                body: JSON.stringify({ prompt: aiPrompt })
            });
            if (res.ok) {
                const generatedField = await res.json();
                if (generatedField.label) {
                    handleUpdateField(index, generatedField);
                    setAiFieldIndex(null);
                    setAiPrompt('');
                } else if (generatedField.error) {
                    alert(generatedField.error);
                }
            } else {
                alert("Failed to generate field.");
            }
        } catch (err) {
            console.error("AI Generation failed:", err);
        } finally {
            setAiLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/ai/save-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken || 'admin@holysheet.com'}`
                },
                body: JSON.stringify({ activity_id: id, form_structure: form })
            });
            if (res.ok) {
                router.push(`/admin/events/${id}`);
            } else {
                alert("Failed to save form.");
            }
        } catch (err) {
            console.error("Save failed:", err);
            alert("An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className={`p-8 ${isPreviewFull ? 'max-w-full' : 'max-w-7xl'} mx-auto min-h-full transition-all duration-500`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Link href={`/admin/events/${id}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Form Editor</h1>
                        <p className="text-sm text-gray-500">{activity?.title}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50 ${isPreviewFull ? 'hidden' : ''}`}
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                </button>
            </div>

            <div className={`grid grid-cols-1 ${isPreviewFull ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-12 transition-all duration-500`}>
                {/* Editor Content */}
                <div className={`${isPreviewFull ? 'hidden' : 'lg:col-span-7'} space-y-8`}>
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Form Title</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[80px]"
                            />
                        </div>
                    </div>

                    {/* Fields List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Form Questions</h3>
                            <button
                                onClick={handleAddField}
                                className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:underline"
                            >
                                <Plus size={16} /> Add Field
                            </button>
                        </div>

                        {form.fields.map((field, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm group hover:border-indigo-200 transition-all relative overflow-hidden">
                                {aiFieldIndex === idx && (
                                    <div className="absolute inset-0 bg-indigo-600/5 backdrop-blur-[2px] z-20 flex items-center justify-center p-6 animate-in fade-in duration-300">
                                        <div className="bg-white w-full rounded-2xl shadow-2xl border border-indigo-100 p-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-indigo-600">
                                                    <Sparkles size={16} className="animate-pulse" />
                                                    <span className="text-xs font-black uppercase tracking-widest">AI Field Architect</span>
                                                </div>
                                                <button onClick={() => setAiFieldIndex(null)} className="text-gray-400 hover:text-gray-600">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={aiPrompt}
                                                    onChange={(e) => setAiPrompt(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleAIGenerateField(idx);
                                                        if (e.key === 'Escape') setAiFieldIndex(null);
                                                    }}
                                                    placeholder="Describe the question (e.g. 'Ask for dietary restrictions with options')"
                                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                                />
                                                <button
                                                    onClick={() => handleAIGenerateField(idx)}
                                                    disabled={aiLoading || !aiPrompt.trim()}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                                                >
                                                    {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-medium italic">Press Enter to generate, Esc to cancel</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 mr-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={field.label}
                                                onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.ctrlKey && e.key === 'i') {
                                                        e.preventDefault();
                                                        setAiFieldIndex(idx);
                                                    }
                                                }}
                                                className="w-full text-lg font-bold text-gray-900 outline-none focus:text-indigo-600 bg-transparent"
                                                placeholder="Question Label"
                                            />
                                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] font-black bg-indigo-50 text-indigo-400 px-2 py-1 rounded-md uppercase tracking-tighter">Ctrl + I for AI</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveField(idx)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Input Type</label>
                                        <select
                                            value={field.type}
                                            onChange={(e) => handleUpdateField(idx, { type: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="text">Short Answer</option>
                                            <option value="textarea">Long Answer</option>
                                            <option value="select">Selection / Dropdown</option>
                                            <option value="checkbox">Checkbox (Multiple)</option>
                                            <option value="date">Date Picker</option>
                                            <option value="tel">Phone Number</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end pb-2">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={field.required}
                                                onChange={(e) => handleUpdateField(idx, { required: e.target.checked })}
                                                className="w-4 h-4 text-indigo-600 rounded"
                                            />
                                            <span className="text-sm font-bold text-gray-600">Required Field</span>
                                        </label>
                                    </div>
                                </div>

                                {field.type === 'select' && (
                                    <div className="mt-4 pt-4 border-t border-gray-50">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Options (comma separated)</label>
                                        <input
                                            type="text"
                                            value={field.options?.join(', ') || ''}
                                            onChange={(e) => handleUpdateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                            className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 border border-transparent focus:border-indigo-200"
                                            placeholder="e.g. Vegetarian, Non-Vegetarian, Vegan"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preview Section */}
                <div className={`${isPreviewFull ? 'lg:col-span-1' : 'lg:col-span-5'} space-y-6 transition-all duration-500`}>
                    <div className={`${isPreviewFull ? 'max-w-5xl mx-auto' : 'sticky top-8'}`}>
                        <div className="flex justify-between items-center mb-4 px-2">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Live Preview</h3>
                                {isPreviewFull && (
                                    <button
                                        onClick={() => setIsPreviewFull(false)}
                                        className="text-[10px] font-black uppercase tracking-widest text-indigo-600 px-3 py-1 bg-indigo-50 rounded-lg flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
                                    >
                                        <Minimize2 size={12} /> Back to Editor
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                                    <button
                                        onClick={() => setViewMode('phone')}
                                        className={`p-2 rounded-lg transition-all ${viewMode === 'phone' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <Smartphone size={16} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('web')}
                                        className={`p-2 rounded-lg transition-all ${viewMode === 'web' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <Monitor size={16} />
                                    </button>
                                </div>
                                {!isPreviewFull && (
                                    <button
                                        onClick={() => setIsPreviewFull(true)}
                                        className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/50 rounded-xl transition-all shadow-sm group"
                                        title="Full Screen Preview"
                                    >
                                        <Maximize2 size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {viewMode === 'phone' ? (
                            /* Phone View (Light Theme) */
                            <div className={`bg-white rounded-[56px] text-black shadow-2xl overflow-hidden relative ${isPreviewFull ? 'min-h-[85vh] max-w-[480px]' : 'min-h-[820px] max-w-[420px]'} mx-auto flex flex-col border-[12px] border-gray-100 ring-2 ring-gray-200 transition-all duration-500`} style={{ fontFamily: 'Arial, sans-serif' }}>
                                {/* Mobile Top Bar */}
                                <div className="flex justify-between items-center px-8 pt-6 pb-2 relative z-20">
                                    <span className="text-[11px] font-bold text-black ml-2">9:41</span>
                                    <div className="absolute left-1/2 -translate-x-1/2 top-0">
                                        <div className="w-20 h-6 bg-gray-100 rounded-b-[14px] flex items-center justify-center">
                                            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 mr-2">
                                        <div className="w-4 h-4 rounded-full border border-black/10 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-black" />
                                        </div>
                                        <div className="w-4 h-4 rounded-full border border-black/10" />
                                    </div>
                                </div>

                                <div className="relative flex-1 flex flex-col h-full overflow-hidden">
                                    {/* Hero Image */}
                                    <div className="relative h-56 w-full shrink-0 overflow-hidden">
                                        <img
                                            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=60"
                                            className="w-full h-full object-cover"
                                            alt="Header"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
                                    </div>

                                    <div className="px-8 pb-10 flex-1 flex flex-col -mt-12 relative z-10">
                                        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 mb-8 border border-gray-50">
                                            <h2 className="text-2xl font-black mb-3 leading-tight tracking-tight text-black">
                                                {form.title}
                                            </h2>
                                            <p className="text-black text-[11px] leading-relaxed font-semibold opacity-60">
                                                {form.description}
                                            </p>
                                        </div>

                                        <div className="flex-1 space-y-10 overflow-y-auto pr-2 -mr-2 custom-scrollbar-light scroll-smooth">
                                            {form.fields.map((field, idx) => (
                                                <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both" style={{ animationDelay: `${idx * 80}ms` }}>
                                                    <div className="px-1">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-black flex items-center gap-1.5">
                                                            {field.label}
                                                            {field.required && <span className="text-red-600 animate-pulse">●</span>}
                                                        </label>
                                                    </div>

                                                    <div className="relative group/field">
                                                        {field.type === 'text' && (
                                                            <div className="h-14 w-full rounded-2xl bg-gray-50 border border-gray-100 px-5 flex items-center group-hover/field:border-black/20 group-hover/field:bg-white transition-all duration-300">
                                                                <Type size={16} className="text-black/20 mr-4" />
                                                                <span className="text-black/20 text-xs font-semibold">Short answer...</span>
                                                            </div>
                                                        )}
                                                        {field.type === 'tel' && (
                                                            <div className="h-14 w-full rounded-2xl bg-gray-50 border border-gray-100 px-5 flex items-center group-hover/field:border-black/20 group-hover/field:bg-white transition-all duration-300">
                                                                <Phone size={16} className="text-black/20 mr-4" />
                                                                <span className="text-black/20 text-xs font-semibold">+1 234 567 890</span>
                                                            </div>
                                                        )}
                                                        {field.type === 'date' && (
                                                            <div className="h-14 w-full rounded-2xl bg-gray-50 border border-gray-100 px-5 flex items-center group-hover/field:border-black/20 group-hover/field:bg-white transition-all duration-300">
                                                                <CalendarIcon size={16} className="text-black/20 mr-4" />
                                                                <span className="text-black/20 text-xs font-semibold">Select date</span>
                                                            </div>
                                                        )}
                                                        {field.type === 'textarea' && (
                                                            <div className="min-h-[100px] w-full rounded-2xl bg-gray-50 border border-gray-100 p-5 group-hover/field:border-black/20 group-hover/field:bg-white transition-all duration-300">
                                                                <span className="text-black/20 text-xs font-semibold">Detailed response...</span>
                                                            </div>
                                                        )}
                                                        {(field.type === 'select' || field.type === 'checkbox') && (
                                                            <div className="grid grid-cols-1 gap-2.5">
                                                                {(field.options && field.options.length > 0 ? field.options : ['Option A', 'Option B']).map((opt, i) => (
                                                                    <div key={i} className="flex items-center gap-4 bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 hover:border-black/20 hover:bg-white transition-all duration-300 cursor-pointer group/opt backdrop-blur-sm">
                                                                        <div className="w-5 h-5 rounded-[6px] border border-gray-200 flex items-center justify-center group-hover/opt:border-black transition-colors bg-white">
                                                                            <div className="w-2.5 h-2.5 rounded-sm bg-black opacity-0 group-hover/opt:opacity-100 transition-all scale-50 group-hover/opt:scale-100" />
                                                                        </div>
                                                                        <span className="text-xs text-black font-bold opacity-60 group-hover/opt:opacity-100 transition-all">{opt}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-8 pt-4 pb-2">
                                            <button className="relative w-full py-5 rounded-[22px] font-black text-xs uppercase tracking-[0.25em] overflow-hidden group/btn shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]">
                                                <div className="absolute inset-0 bg-black group-hover/btn:bg-zinc-800 transition-colors duration-300" />
                                                <span className="relative z-10 text-white drop-shadow-sm">Submit Application</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Web View (Light Theme) */
                            <div className={`bg-gray-50 rounded-3xl text-black shadow-2xl overflow-hidden relative ${isPreviewFull ? 'min-h-[85vh]' : 'min-h-[820px]'} w-full flex flex-col border border-gray-200 transition-all duration-500`} style={{ fontFamily: 'Arial, sans-serif' }}>
                                {/* Browser bar */}
                                <div className="h-10 bg-white border-b border-gray-200 flex items-center px-4 gap-2 shrink-0">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                        <div className="w-3 h-3 rounded-full bg-green-400" />
                                    </div>
                                    <div className="bg-gray-100 h-6 px-4 rounded-lg flex-1 mx-8 flex items-center">
                                        <span className="text-[10px] text-gray-400 font-medium">holysheet.com/events/{id}/apply</span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar-light">
                                    {/* Web Hero */}
                                    <div className="relative h-64 w-full">
                                        <img
                                            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=80"
                                            className="w-full h-full object-cover"
                                            alt="Hero"
                                        />
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <div className="text-center px-8">
                                                <h2 className="text-4xl font-black text-white mb-4 drop-shadow-lg">{form.title}</h2>
                                                <p className="text-white/80 max-w-2xl mx-auto font-bold">{form.description}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="max-w-2xl mx-auto py-16 px-8">
                                        <div className="bg-white rounded-[32px] p-10 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-12">
                                            {form.fields.map((field, idx) => (
                                                <div key={idx} className="space-y-4">
                                                    <label className="text-sm font-black uppercase tracking-widest text-black flex items-center gap-2 px-1">
                                                        {field.label}
                                                        {field.required && <span className="text-red-500">●</span>}
                                                    </label>

                                                    <div className="group/webfield">
                                                        {field.type === 'text' ? (
                                                            <div className="h-14 w-full rounded-2xl bg-gray-50 border border-gray-100 px-6 flex items-center group-hover/webfield:border-black/20 transition-all">
                                                                <span className="text-black/30 text-sm">Type your answer here...</span>
                                                            </div>
                                                        ) : field.type === 'tel' ? (
                                                            <div className="h-14 w-full rounded-2xl bg-gray-50 border border-gray-100 px-6 flex items-center group-hover/webfield:border-black/20 transition-all">
                                                                <span className="text-black/30 text-sm">+1 234 567 890</span>
                                                            </div>
                                                        ) : field.type === 'date' ? (
                                                            <div className="h-14 w-full rounded-2xl bg-gray-50 border border-gray-100 px-6 flex items-center group-hover/webfield:border-black/20 transition-all">
                                                                <span className="text-black/30 text-sm">Select date</span>
                                                            </div>
                                                        ) : field.type === 'textarea' ? (
                                                            <div className="min-h-[120px] w-full rounded-2xl bg-gray-50 border border-gray-100 p-6 group-hover/webfield:border-black/20 transition-all">
                                                                <span className="text-black/30 text-sm">Share more about your interest...</span>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-2 gap-4">
                                                                {(field.options && field.options.length > 0 ? field.options : ['Option A', 'Option B']).map((opt, i) => (
                                                                    <div key={i} className="flex items-center gap-4 bg-gray-50 rounded-2xl px-6 py-4 border border-gray-100 hover:border-black/40 hover:bg-white transition-all cursor-pointer">
                                                                        <div className="w-5 h-5 rounded-lg border border-gray-200 bg-white" />
                                                                        <span className="text-sm text-black font-bold opacity-60">{opt}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            <button className="w-full py-6 rounded-[22px] bg-black text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-zinc-800 transition-all">
                                                Confirm Application
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar-light::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar-light::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar-light::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar-light:hover::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </div>
    );
}

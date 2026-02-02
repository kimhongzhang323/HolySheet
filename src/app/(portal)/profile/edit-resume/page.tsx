'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Save, Sparkles, CheckCircle, AlertCircle,
    Plus, X, Loader2, Award, GraduationCap, Briefcase,
    FileText, Target, TrendingUp, AlertTriangle
} from 'lucide-react';

// Mock initial resume data
const INITIAL_RESUME = {
    summary: 'Passionate community volunteer with over 3 years of experience in social services, education outreach, and environmental conservation. Dedicated to creating meaningful impact through hands-on involvement and leadership in volunteer initiatives across Singapore.',
    skills: [
        'Community Outreach', 'Event Coordination', 'First Aid Certified',
        'Public Speaking', 'Mandarin (Fluent)', 'Team Leadership',
        'Youth Mentoring', 'Digital Literacy Training', 'Crisis Support'
    ],
    experience: [
        {
            role: 'Volunteer Coordinator',
            organization: 'Lions Befrienders',
            period: '2024 - Present',
            description: 'Lead a team of 15 volunteers for weekly senior home visits. Organized monthly community events reaching 200+ elderly residents.'
        },
        {
            role: 'Digital Ambassador',
            organization: 'IMDA Digital Readiness Programme',
            period: '2023 - 2024',
            description: 'Taught smartphone basics and digital skills to 150+ seniors across 30 workshop sessions.'
        },
        {
            role: 'Beach Cleanup Leader',
            organization: 'Beach Lovers Singapore',
            period: '2022 - Present',
            description: 'Organized and led monthly beach cleanup initiatives. Collected over 500kg of marine debris with 200+ volunteers.'
        }
    ]
};

interface ATSResult {
    score: number;
    feedback: {
        type: 'success' | 'warning' | 'error';
        message: string;
    }[];
    suggestions: string[];
}

export default function EditResumePage() {
    const { data: session } = useSession();
    const [summary, setSummary] = useState(INITIAL_RESUME.summary);
    const [skills, setSkills] = useState<string[]>(INITIAL_RESUME.skills);
    const [newSkill, setNewSkill] = useState('');
    const [experience, setExperience] = useState(INITIAL_RESUME.experience);
    const [saving, setSaving] = useState(false);
    const [showATSChecker, setShowATSChecker] = useState(false);
    const [atsLoading, setAtsLoading] = useState(false);
    const [atsResult, setAtsResult] = useState<ATSResult | null>(null);

    const addSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const updateExperience = (index: number, field: string, value: string) => {
        const updated = [...experience];
        updated[index] = { ...updated[index], [field]: value };
        setExperience(updated);
    };

    const addExperience = () => {
        setExperience([
            ...experience,
            { role: '', organization: '', period: '', description: '' }
        ]);
    };

    const removeExperience = (index: number) => {
        setExperience(experience.filter((_, i) => i !== index));
    };

    const runATSCheck = async () => {
        setAtsLoading(true);
        setShowATSChecker(true);

        // Simulate AI ATS analysis
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock ATS analysis result
        const feedback: ATSResult['feedback'] = [];
        const suggestions: string[] = [];
        let score = 75;

        // Analyze summary
        if (summary.length < 100) {
            feedback.push({ type: 'warning', message: 'Professional summary is too short. Aim for 150-300 characters.' });
            score -= 10;
        } else if (summary.length >= 150) {
            feedback.push({ type: 'success', message: 'Professional summary has good length and detail.' });
            score += 5;
        }

        // Analyze skills
        if (skills.length < 5) {
            feedback.push({ type: 'error', message: 'Add more skills. Aim for at least 5-10 relevant skills.' });
            score -= 15;
        } else if (skills.length >= 8) {
            feedback.push({ type: 'success', message: 'Excellent skill variety! Your profile shows diverse capabilities.' });
            score += 10;
        }

        // Check for action verbs in experience
        const actionVerbs = ['led', 'organized', 'managed', 'coordinated', 'taught', 'developed', 'created', 'implemented'];
        const hasActionVerbs = experience.some(exp =>
            actionVerbs.some(verb => exp.description.toLowerCase().includes(verb))
        );

        if (hasActionVerbs) {
            feedback.push({ type: 'success', message: 'Good use of action verbs in experience descriptions.' });
            score += 5;
        } else {
            feedback.push({ type: 'warning', message: 'Use more action verbs (led, organized, managed) in descriptions.' });
            suggestions.push('Start experience descriptions with action verbs like "Led", "Organized", "Managed"');
        }

        // Check for quantifiable achievements
        const hasNumbers = experience.some(exp => /\d+/.test(exp.description));
        if (hasNumbers) {
            feedback.push({ type: 'success', message: 'Great job including quantifiable achievements!' });
            score += 5;
        } else {
            feedback.push({ type: 'warning', message: 'Add numbers to quantify your impact (e.g., "helped 50+ seniors").' });
            suggestions.push('Include specific numbers: hours volunteered, people helped, events organized');
        }

        // Experience count check
        if (experience.length < 2) {
            feedback.push({ type: 'error', message: 'Add more volunteer experiences to showcase your involvement.' });
            score -= 10;
        } else if (experience.length >= 3) {
            feedback.push({ type: 'success', message: 'Good depth of volunteer experience.' });
        }

        // Add general suggestions
        if (score < 80) {
            suggestions.push('Consider adding certifications or training programs you\'ve completed');
            suggestions.push('Highlight leadership roles and team collaboration experiences');
        }

        setAtsResult({
            score: Math.min(100, Math.max(0, score)),
            feedback,
            suggestions
        });
        setAtsLoading(false);
    };

    const handleSave = async () => {
        if (!atsResult || atsResult.score < 60) {
            // Prompt to run ATS check first
            runATSCheck();
            return;
        }

        setSaving(true);
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSaving(false);
        // Could redirect to resume page
        window.location.href = '/profile/volunteer-resume';
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-600';
        if (score >= 60) return 'text-amber-600';
        return 'text-red-600';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <Link
                        href="/profile/volunteer-resume"
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Resume
                    </Link>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={runATSCheck}
                            disabled={atsLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-bold hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                            {atsLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            AI ATS Check
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Changes
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Professional Summary */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-emerald-600" />
                                Professional Summary
                            </h2>
                            <textarea
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                placeholder="Write a compelling summary of your volunteer journey..."
                            />
                            <p className="text-xs text-gray-400 mt-2">{summary.length} characters (recommended: 150-300)</p>
                        </div>

                        {/* Skills */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <GraduationCap size={20} className="text-teal-600" />
                                Skills & Competencies
                            </h2>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {skills.map((skill, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200 group hover:border-red-200 hover:bg-red-50 transition-colors"
                                    >
                                        {skill}
                                        <button
                                            onClick={() => removeSkill(skill)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                                    placeholder="Add a new skill..."
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <button
                                    onClick={addSkill}
                                    className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-200 transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Experience */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Briefcase size={20} className="text-blue-600" />
                                    Volunteer Experience
                                </h2>
                                <button
                                    onClick={addExperience}
                                    className="flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700"
                                >
                                    <Plus size={16} />
                                    Add Experience
                                </button>
                            </div>
                            <div className="space-y-6">
                                {experience.map((exp, i) => (
                                    <div key={i} className="relative p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <button
                                            onClick={() => removeExperience(i)}
                                            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                                            <input
                                                type="text"
                                                value={exp.role}
                                                onChange={(e) => updateExperience(i, 'role', e.target.value)}
                                                placeholder="Role / Title"
                                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                            <input
                                                type="text"
                                                value={exp.organization}
                                                onChange={(e) => updateExperience(i, 'organization', e.target.value)}
                                                placeholder="Organization"
                                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={exp.period}
                                            onChange={(e) => updateExperience(i, 'period', e.target.value)}
                                            placeholder="Period (e.g., 2023 - Present)"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 mb-3"
                                        />
                                        <textarea
                                            value={exp.description}
                                            onChange={(e) => updateExperience(i, 'description', e.target.value)}
                                            rows={2}
                                            placeholder="Describe your responsibilities and achievements..."
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ATS Checker Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Target size={20} className="text-purple-600" />
                                AI ATS Checker
                            </h2>

                            {!showATSChecker ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Sparkles size={28} className="text-purple-500" />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Run an AI-powered ATS check to optimize your resume for volunteer opportunities.
                                    </p>
                                    <button
                                        onClick={runATSCheck}
                                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-bold hover:from-purple-600 hover:to-indigo-600 transition-all"
                                    >
                                        Run ATS Check
                                    </button>
                                </div>
                            ) : atsLoading ? (
                                <div className="text-center py-12">
                                    <Loader2 size={40} className="animate-spin text-purple-500 mx-auto mb-4" />
                                    <p className="text-sm text-gray-600">Analyzing your resume...</p>
                                </div>
                            ) : atsResult ? (
                                <div className="space-y-6">
                                    {/* Score */}
                                    <div className="text-center">
                                        <div className="relative w-24 h-24 mx-auto mb-3">
                                            <svg className="w-24 h-24 transform -rotate-90">
                                                <circle
                                                    cx="48"
                                                    cy="48"
                                                    r="40"
                                                    stroke="#e5e7eb"
                                                    strokeWidth="8"
                                                    fill="none"
                                                />
                                                <circle
                                                    cx="48"
                                                    cy="48"
                                                    r="40"
                                                    stroke="url(#scoreGradient)"
                                                    strokeWidth="8"
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${(atsResult.score / 100) * 251.2} 251.2`}
                                                />
                                                <defs>
                                                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor={atsResult.score >= 80 ? '#10b981' : atsResult.score >= 60 ? '#f59e0b' : '#ef4444'} />
                                                        <stop offset="100%" stopColor={atsResult.score >= 80 ? '#059669' : atsResult.score >= 60 ? '#d97706' : '#dc2626'} />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className={`text-2xl font-black ${getScoreColor(atsResult.score)}`}>
                                                    {atsResult.score}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {atsResult.score >= 80 ? 'Excellent Resume!' : atsResult.score >= 60 ? 'Good, but can improve' : 'Needs improvement'}
                                        </p>
                                    </div>

                                    {/* Feedback */}
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Analysis</h3>
                                        {atsResult.feedback.map((item, i) => (
                                            <div
                                                key={i}
                                                className={`flex items-start gap-2 p-3 rounded-xl text-xs ${item.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                                                    item.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                                                        'bg-red-50 text-red-700'
                                                    }`}
                                            >
                                                {item.type === 'success' ? <CheckCircle size={14} className="shrink-0 mt-0.5" /> :
                                                    item.type === 'warning' ? <AlertTriangle size={14} className="shrink-0 mt-0.5" /> :
                                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />}
                                                <span>{item.message}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Suggestions */}
                                    {atsResult.suggestions.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Suggestions</h3>
                                            <ul className="space-y-2">
                                                {atsResult.suggestions.map((suggestion, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                                        <TrendingUp size={14} className="text-purple-500 shrink-0 mt-0.5" />
                                                        {suggestion}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <button
                                        onClick={runATSCheck}
                                        className="w-full py-2 text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors"
                                    >
                                        Re-run Check
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

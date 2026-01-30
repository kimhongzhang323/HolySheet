'use client';

import { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Sparkles, Target, BrainCircuit, Activity, Sliders } from 'lucide-react';

// --- Data ---
const ROLE_FULFILLMENT_DATA = [
    { role: 'General Support', required: 50, filled: 45 },
    { role: 'Medical Team', required: 10, filled: 12 },
    { role: 'Team Leaders', required: 8, filled: 5 },
    { role: 'Logistics', required: 15, filled: 15 },
    { role: 'Media/Photo', required: 3, filled: 1 },
];

const INITIAL_ENGAGEMENT_DATA = [
    { subject: 'Retention', value: 80, fullMark: 100 },
    { subject: 'Skill Match', value: 65, fullMark: 100 },
    { subject: 'Responsiveness', value: 58, fullMark: 100 },
    { subject: 'Reliability', value: 85, fullMark: 100 },
    { subject: 'Impact', value: 60, fullMark: 100 },
    { subject: 'Feedback', value: 45, fullMark: 100 },
];

const PROJECTION_DATA = [
    { month: 'Jan', current: 4000, projected: 2400 },
    { month: 'Feb', current: 3000, projected: 1398 },
    { month: 'Mar', current: 2000, projected: 9800 },
    { month: 'Apr', current: 2780, projected: 3908 },
    { month: 'May', current: 1890, projected: 4800 },
    { month: 'Jun', current: 2390, projected: 3800 },
];

export default function EventInsightsView() {
    // State for interactive engagement model
    const [engagementData, setEngagementData] = useState(INITIAL_ENGAGEMENT_DATA);
    const [isEditing, setIsEditing] = useState(false);

    const handleSliderChange = (index: number, newValue: number) => {
        const newData = engagementData.map((item, i) =>
            i === index ? { ...item, value: newValue } : item
        );
        setEngagementData(newData);
    };

    const handleLabelChange = (index: number, newLabel: string) => {
        const newData = engagementData.map((item, i) =>
            i === index ? { ...item, subject: newLabel } : item
        );
        setEngagementData(newData);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="text-indigo-600" size={24} />
                        Event Intelligence Dashboard
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                        Comprehensive analysis of role fulfillment and predictive engagement modeling.
                    </p>
                </div>
                <div className="text-xs font-bold bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full border border-indigo-100 flex items-center gap-2">
                    <Activity size={14} />
                    Live Analysis
                </div>
            </div>

            {/* Section 1: Role Fulfillment Analysis */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <Target size={20} className="text-indigo-500" />
                        Role Fulfillment Analysis
                    </h4>
                    <div className="text-xs font-bold bg-amber-50 text-amber-600 px-3 py-1 rounded-full border border-amber-100">
                        Critical Shortage: Media/Photo
                    </div>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={ROLE_FULFILLMENT_DATA}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                                dataKey="role"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                            <Tooltip
                                cursor={{ fill: '#f9fafb' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="required" name="Required Count" fill="#e0e7ff" radius={[4, 4, 0, 0]} barSize={40} />
                            <Bar dataKey="filled" name="Filled Count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Insights Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {['Safe Staffing Levels', 'Core Roles Covered', 'Backup Available'].map((trait, i) => (
                        <div key={i} className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-700">{trait}</span>
                            <CheckCircleIcon />
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 2: Predictive Engagement & Impact (Combined) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Interactive Engagement Model (Left - 5 cols) */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                    <div className="mb-6">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            <BrainCircuit size={20} className="text-purple-500" />
                            Engagement Model
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                            Adjust the sliders to simulate different engagement scenarios before publishing.
                        </p>
                    </div>

                    <div className="flex-1 min-h-[300px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={engagementData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Projected Engagement"
                                    dataKey="value"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fill="#8b5cf6"
                                    fillOpacity={0.4}
                                />
                                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                                {/* Legend removed for cleaner look as there's only one dynamic dataset now */}
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Controls & Impact Projection (Right - 7 cols) */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Sliders Control Panel */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-gray-900 font-bold">
                                <Sliders size={18} />
                                <span>Model Configuration</span>
                            </div>
                            <button
                                onClick={() => {
                                    if (isEditing) {
                                        alert("Model configuration saved!");
                                    }
                                    setIsEditing(!isEditing);
                                }}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${isEditing
                                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                    }`}
                            >
                                {isEditing ? 'Save Changes' : 'Edit Configuration'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                            {engagementData.map((item, index) => (
                                <div key={index}>
                                    <div className="flex justify-between items-center mb-1 gap-2">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={item.subject}
                                                onChange={(e) => handleLabelChange(index, e.target.value)}
                                                className="text-xs font-bold text-gray-600 bg-gray-50 border-b border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors w-full px-1 rounded"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-gray-600 cursor-default px-1">
                                                {item.subject}
                                            </span>
                                        )}
                                        <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 rounded">
                                            {item.value}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={item.value}
                                        onChange={(e) => handleSliderChange(index, parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Impact Chart */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex-1">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-blue-500" />
                            Projected Impact
                        </h4>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={PROJECTION_DATA}
                                    margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                                    <Area type="monotone" dataKey="current" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCurrent)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="projected" stroke="#93c5fd" strokeDasharray="5 5" fill="none" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Action Bar */}
            <div className="bg-gray-900 p-4 rounded-2xl text-white flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <Sparkles size={20} className="text-yellow-400" />
                    </div>
                    <div>
                        <h5 className="font-bold text-sm">AI Optimization</h5>
                        <p className="text-xs text-gray-400">Current configuration is predicted to result in <span className="text-green-400 font-bold">95%</span> volunteer satisfaction.</p>
                    </div>
                </div>
                <button
                    className="bg-white text-gray-900 px-5 py-2 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors shadow-md transform hover:scale-105"
                    onClick={() => alert("Engagement profile saved!")}
                >
                    Save Model Profile
                </button>
            </div>
        </div>
    );
}

function CheckCircleIcon() {
    return (
        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 4L3.5 6.5L9 1" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
}

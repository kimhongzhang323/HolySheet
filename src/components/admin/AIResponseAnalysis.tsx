'use client';

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, Legend, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { BarChart3, PieChart as PieIcon, AreaChart as AreaIcon, Info, Sparkles, AlertCircle, Target, TrendingUp, Layers } from 'lucide-react';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
const GRADIENT_COLORS = [
    { start: '#6366f1', end: '#a855f7' },
    { start: '#ec4899', end: '#f43f5e' },
    { start: '#22c55e', end: '#06b6d4' }
];

interface ChartData {
    name: string;
    value: number;
    [key: string]: any;
}

interface ChartSpec {
    id: string;
    title: string;
    type: 'bar' | 'pie' | 'area' | 'radar' | 'horizontal' | 'donut';
    data: ChartData[];
    explanation: string;
}

interface AnalysisData {
    summary: string;
    charts: ChartSpec[];
    key_findings: string[];
}

export default function AIResponseAnalysis({ data }: { data: AnalysisData }) {
    if (!data || !data.charts) {
        return (
            <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No analysis data available to visualize.</p>
            </div>
        );
    }

    const renderChart = (chart: ChartSpec) => {
        switch (chart.type) {
            case 'donut':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <defs>
                                {GRADIENT_COLORS.map((color, i) => (
                                    <linearGradient key={i} id={`gradient-${chart.id}-${i}`} x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor={color.start} />
                                        <stop offset="100%" stopColor={color.end} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <Pie
                                data={chart.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                                cornerRadius={4}
                            >
                                {chart.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`url(#gradient-${chart.id}-${index % 3})`} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={chart.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chart.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'radar':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chart.data}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <Radar name="Responses" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                );
            case 'horizontal':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chart.data} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={80} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} cursor={{ fill: '#f8fafc' }} />
                            <Bar dataKey="value" fill="url(#horizontalGradient)" radius={[0, 4, 4, 0]} barSize={20} />
                            <defs>
                                <linearGradient id="horizontalGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chart.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`color-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill={`url(#color-${chart.id})`} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                );
            case 'bar':
            default:
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chart.data}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} cursor={{ fill: '#f8fafc' }} />
                            <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'pie':
            case 'donut': return <PieIcon size={16} />;
            case 'area': return <TrendingUp size={16} />;
            case 'radar': return <Target size={16} />;
            case 'horizontal': return <Layers size={16} />;
            default: return <BarChart3 size={16} />;
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Summary Header */}
            <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-6 rounded-3xl shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                    <Sparkles size={20} className="animate-pulse" />
                    <h3 className="font-bold uppercase tracking-widest text-xs">Situational Analysis</h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-lg font-medium">
                    {data.summary}
                </p>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {data.charts.map((chart) => (
                    <div key={chart.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                {getIcon(chart.type)}
                                {chart.title}
                            </h4>
                            <button className="text-gray-300 hover:text-indigo-400">
                                <Info size={16} />
                            </button>
                        </div>

                        <div className="h-[300px] mb-6">
                            {renderChart(chart)}
                        </div>

                        <div className="bg-gray-50/50 rounded-2xl p-4">
                            <p className="text-sm text-gray-600 leading-relaxed">
                                <span className="font-bold text-gray-400 block mb-1 uppercase text-[10px]">Observation</span>
                                {chart.explanation}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Key Findings */}
            <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles size={120} />
                </div>
                <h4 className="font-bold text-xl mb-6 relative z-10">Key Findings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    {(data.key_findings || []).map((finding, idx) => (
                        <div key={idx} className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/10">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                                {idx + 1}
                            </div>
                            <p className="text-sm text-gray-300 font-medium pt-1">{finding}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

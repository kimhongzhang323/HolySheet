'use client';

import { useState } from 'react';
import { Sparkles, Send, Loader2, Bot } from 'lucide-react';
import GlassIcons from './GlassIcons';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    toolUI?: React.ReactNode;
}

const QUICK_ACTIONS = [
    'Summarize today\'s feedback',
    'Find volunteers for swimming',
    'Show activities needing help',
    'How many activities this week?'
];

export default function OpsCopilot() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSend = async (text?: string) => {
        const query = text || input;
        if (!query.trim() || loading) return;

        const userMessage: Message = {
            role: 'user',
            content: query,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/admin/ai/chat', {
                method: 'POST',
                headers,
                body: JSON.stringify({ query })
            });

            const data = await response.json();

            // Check for tool results to render special UI
            let toolContent = null;
            if (data.tool_result) {
                if (data.tool_result.action === 'draft_messages') {
                    toolContent = (
                        <div className="mt-3 space-y-2">
                            <p className="font-semibold text-xs uppercase tracking-wide text-gray-500">Draft Messages Generated:</p>
                            {data.tool_result.activities.map((act: any, i: number) => (
                                <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 text-xs">
                                    <p className="font-bold text-gray-800">{act.title}</p>
                                    <p className="text-gray-500 mb-1">{act.date} • {act.needed} volunteers needed</p>
                                    <div className="bg-blue-50 p-2 rounded text-blue-800 italic">
                                        "🚨 Urgent: We need {act.needed} volunteers for {act.title}. Reply YES to sign up!"
                                    </div>
                                    <button className="mt-2 w-full py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                                        Approve & Send
                                    </button>
                                </div>
                            ))}
                        </div>
                    );
                } else if (data.tool_result.action === 'show_summary') {
                    toolContent = (
                        <div className="mt-3 bg-purple-50 p-3 rounded-lg border border-purple-100">
                            <p className="font-semibold text-purple-900 text-xs uppercase mb-1">Feedback Summary</p>
                            <p className="text-purple-800 italic">"{data.tool_result.summary}"</p>
                        </div>
                    );
                }
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.answer || 'Sorry, I couldn\'t process that request.',
                timestamp: new Date(),
                toolUI: toolContent
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('AI query failed:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) {
        return (
            <GlassIcons
                items={[
                    {
                        icon: <Bot size={24} />,
                        color: "indigo",
                        label: "Ops Copilot",
                        onClick: () => setIsOpen(true)
                    }
                ]}
            />
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[600px] w-[400px] animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Sparkles className="text-white" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Ops Copilot</h3>
                        <p className="text-xs text-indigo-100">AI-powered assistant</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/80 hover:text-white transition-colors"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Quick Actions */}
            {messages.length === 0 && (
                <div className="p-4 border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Quick Actions</p>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_ACTIONS.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(action)}
                                className="px-3 py-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-sm text-gray-700 rounded-lg transition-all"
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-xs">
                            <Sparkles className="mx-auto text-gray-300 mb-3" size={40} />
                            <p className="text-gray-500 font-medium">Ask me anything!</p>
                            <p className="text-sm text-gray-400 mt-1">
                                I can summarize feedback, match volunteers, and query your data.
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${msg.role === 'user'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                {msg.toolUI}
                                <p
                                    className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                                        }`}
                                >
                                    {msg.timestamp.toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    ))
                )}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                            <Loader2 className="animate-spin text-indigo-600" size={16} />
                            <span className="text-sm text-gray-600">Thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask AI to analyze data..."
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm shadow-sm"
                        disabled={loading}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-95"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

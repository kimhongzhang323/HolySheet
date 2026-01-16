'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, User, Bot, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    toolUI?: React.ReactNode;
}

export default function AiChatSidebar() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
            // Use the proxy route mapped to Python backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {})
                },
                body: JSON.stringify({
                    messages: [
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: query }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch response');
            }

            const data = await response.json();

            // Handle potential tool results if the backend returns them
            let toolContent = null;
            if (data.tool_result) {
                // Formatting for specific tool results (Keep specific logic from OpsCopilot if applicable)
                if (data.tool_used === 'search_activities' || data.tool_used === 'smart_matching') {
                    // Generic JSON dump for now, or specific rendering if we know the shape
                    try {
                        const activities = data.tool_result.activities || (Array.isArray(data.tool_result) ? data.tool_result : []);
                        if (activities.length > 0) {
                            toolContent = (
                                <div className="mt-2 text-xs bg-white rounded p-2 border border-blue-100">
                                    <p className="font-bold text-blue-600 mb-1">Found Activities:</p>
                                    <ul className="space-y-1">
                                        {activities.slice(0, 3).map((act: any, i: number) => (
                                            <li key={i}>• {act.title || act.activity_title}</li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        }
                    } catch (e) { /* ignore formatting errors */ }
                }
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response || 'I processed your request.',
                timestamp: new Date(),
                toolUI: toolContent
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('AI Chat Error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Sorry, I encountered an error connecting to the AI agent.',
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

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-100">
            {/* Header */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Sparkles className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 leading-tight">Minds AI</h3>
                        <p className="text-[11px] font-bold text-gray-400 bg-gray-50 px-1.5 rounded inline-block mt-0.5">Gemini 3.0</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 scroll-smooth custom-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mb-4">
                            <Bot className="text-indigo-400 w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">How can I help you?</h4>
                        <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
                            Ask me to find activities, check volunteer status, or summarize feedback.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-100' : 'bg-indigo-50'
                                    }`}>
                                    {msg.role === 'user' ? <User size={14} className="text-gray-600" /> : <Sparkles size={14} className="text-indigo-600" />}
                                </div>
                                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-gray-900 text-white rounded-tr-none'
                                        : 'bg-[#F8F9FB] text-gray-700 rounded-tl-none border border-gray-100'
                                        }`}>
                                        {msg.content}
                                        {msg.toolUI}
                                    </div>
                                    <span className="text-[10px] text-gray-300 mt-1.5 font-medium px-1">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                                    <Sparkles size={14} className="text-indigo-600" />
                                </div>
                                <div className="bg-[#F8F9FB] p-4 rounded-2xl rounded-tl-none border border-gray-100 flex items-center gap-2">
                                    <Loader2 className="animate-spin text-indigo-500" size={14} />
                                    <span className="text-xs text-gray-400 font-medium">Processing...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-5 border-t border-gray-50 bg-white">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask anything..."
                        disabled={loading}
                        className="w-full bg-[#F8F9FB] text-sm text-gray-900 placeholder:text-gray-400 px-4 py-3.5 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:border-indigo-200 transition-all"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className="absolute right-2 p-2 bg-white rounded-lg shadow-sm hover:shadow-md text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:text-indigo-700"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="text-center mt-3">
                    <p className="text-[10px] text-gray-300">AI can make mistakes. Check important info.</p>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, X, MessageSquare, ExternalLink, Send, Sparkles } from 'lucide-react';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function DatyAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleFormSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMessage] }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response || 'Sorry, I could not process that request.'
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Sorry, checking availability is a bit tricky right now. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`fixed z-50 font-sans ${isOpen ? 'inset-0 md:inset-auto md:bottom-8 md:right-8 flex flex-col items-end' : 'bottom-4 right-4 md:bottom-8 md:right-8 flex flex-col items-end gap-4'}`}>
            {/* Chat Bubble */}
            {isOpen && (
                <div className="bg-white md:rounded-2xl shadow-none md:shadow-2xl border-none md:border border-indigo-50 w-full h-full md:w-[380px] md:h-[500px] md:max-h-[80vh] animate-in slide-in-from-bottom-5 fade-in duration-300 relative flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 p-0.5 shadow-md">
                                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                                    <Sparkles size={18} className="text-indigo-600 fill-indigo-100" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 leading-tight">Daty</h3>
                                <p className="text-[11px] text-indigo-500 font-medium">AI Copilot</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                        {messages.length === 0 && (
                            <div className="pb-8 pt-12 text-center">
                                <p className="text-sm font-semibold text-gray-900 mb-2">Hi, I'm Daty! 👋</p>
                                <p className="text-xs text-gray-500 max-w-[240px] mx-auto leading-relaxed">
                                    I can help you find events, check for schedule conflicts, or answer questions about activities.
                                </p>
                            </div>
                        )}

                        {messages.map((m) => (
                            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user'
                                    ? 'bg-gray-200'
                                    : 'bg-indigo-100 text-indigo-600'
                                    }`}>
                                    {m.role === 'user' ? <UserIcon size={14} /> : <Bot size={16} />}
                                </div>
                                <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[80%] leading-relaxed shadow-sm ${m.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                                    }`}>
                                    {m.role === 'assistant' ? (
                                        <ReactMarkdown
                                            components={{
                                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                                ul: ({ children }) => <ul className="list-disc list-inside mt-1 space-y-0.5">{children}</ul>,
                                                ol: ({ children }) => <ol className="list-decimal list-inside mt-1 space-y-0.5">{children}</ol>,
                                                li: ({ children }) => <li>{children}</li>,
                                                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                            }}
                                        >
                                            {m.content}
                                        </ReactMarkdown>
                                    ) : (
                                        m.content
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                    <Bot size={16} />
                                </div>
                                <div className="px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-bl-none shadow-sm">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce animation-delay-75"></span>
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce animation-delay-150"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-gray-100 shrink-0 mb-safe-area">
                        <div className="relative flex items-center">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about events..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleFormSubmit();
                                    }
                                }}
                                className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none placeholder:text-gray-400"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Floating Trigger Button - Hidden when open on mobile */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 bg-white rounded-full shadow-xl shadow-indigo-900/10 flex items-center justify-center hover:scale-105 transition-transform group border border-indigo-50 relative z-50 ${isOpen ? 'hidden md:flex' : 'flex'}`}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 to-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {isOpen ? (
                    <X className="text-gray-600 relative" size={24} />
                ) : (
                    <div className="relative">
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full z-10"></div>
                        <Bot className="text-indigo-600" size={28} />
                    </div>
                )}
            </button>
        </div>
    );
}

function UserIcon({ size }: { size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}

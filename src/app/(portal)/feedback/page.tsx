'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Bug, Lightbulb, MessageSquare,
    Star, Send, CheckCircle2, ArrowLeft,
    Sparkles, Rocket, Ghost, Camera, X, Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';

const FEEDBACK_TYPES = [
    { id: 'compliment', label: 'Compliment', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100' },
    { id: 'bug', label: 'Report a Bug', icon: Bug, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'other', label: 'Other', icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

export default function FeedbackPage() {
    const [type, setType] = useState('suggestion');
    const [rating, setRating] = useState(5);
    const [message, setMessage] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));
            // Success
            setSubmitted(true);
            setType('suggestion');
            setRating(5);
            setMessage('');
            setImageUrl('');
        } catch (error) {
            console.error("Feedback error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-white rounded-[40px] p-12 text-center shadow-2xl shadow-emerald-100 border border-emerald-50"
                >
                    <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200">
                        <CheckCircle2 size={48} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Thank You!</h1>
                    <p className="text-gray-500 font-medium leading-relaxed mb-10">
                        Your feedback helps us make HolySheet better for everyone. We've received your message and will review it shortly.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center w-full px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                    >
                        Return to Dashboard
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-12 px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors mb-6 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Link>
                <div className="flex items-center gap-4 mb-3">
                    <h1 className="text-4xl font-black tracking-tight text-gray-900">Share Feedback</h1>
                </div>
                <p className="text-gray-500 font-medium max-w-xl leading-relaxed">
                    Have a question, a bug to report, or a brilliant idea? We'd love to hear from you. Your voice shapes the future of volunteering.
                </p>
            </motion.div>

            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onSubmit={handleSubmit}
                className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-10"
            >
                {/* Type Selection */}
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 block">
                        What kind of feedback?
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {FEEDBACK_TYPES.map((item) => {
                            const Icon = item.icon;
                            const isSelected = type === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setType(item.id)}
                                    className={`flex flex-col items-center gap-3 p-5 rounded-[24px] border-2 transition-all group ${isSelected
                                        ? (item.id === 'compliment' ? 'bg-pink-600 border-pink-700 shadow-pink-100' : 'bg-gray-900 border-gray-900 shadow-gray-200') + ' shadow-xl'
                                        : 'bg-white border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <div className={`p-3 rounded-xl transition-colors ${isSelected ? 'bg-white/10' : item.bg
                                        }`}>
                                        <Icon size={20} className={isSelected ? 'text-white' : item.color} />
                                    </div>
                                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-600'
                                        }`}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Rating */}
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 block">
                        How's your experience?
                    </label>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="p-1 group transition-all active:scale-90"
                            >
                                <Star
                                    size={36}
                                    className={`transition-all ${star <= rating
                                        ? 'fill-amber-400 text-amber-400 scale-110'
                                        : 'text-gray-200 group-hover:text-amber-200'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message */}
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 block">
                        Your message
                    </label>
                    <textarea
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message here..."
                        rows={6}
                        className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-[24px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-100 focus:shadow-sm transition-all outline-none resize-none font-medium text-lg leading-relaxed"
                    />
                </div>

                {/* Image Upload Section */}
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 block">
                        Add a Screenshot or Image (Optional)
                    </label>
                    <div className="flex flex-col gap-4">
                        {!imageUrl ? (
                            <button
                                type="button"
                                onClick={() => {
                                    // Simulated upload: in a real app, this would open a file picker
                                    const url = prompt("Enter an image URL for your feedback (simulated upload):");
                                    if (url) setImageUrl(url);
                                }}
                                className="flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed border-gray-200 rounded-[24px] hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-gray-400 group"
                            >
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100/50 transition-all">
                                    <Camera size={28} className="group-hover:text-indigo-600 transition-all" />
                                </div>
                                <span className="text-sm font-bold group-hover:text-gray-600">Click to upload an image</span>
                            </button>
                        ) : (
                            <div className="relative w-full aspect-video rounded-[24px] overflow-hidden border border-gray-200 shadow-md">
                                <img src={imageUrl} alt="Feedback" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setImageUrl('')}
                                    className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-all shadow-lg"
                                >
                                    <X size={18} />
                                </button>
                                <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-md text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <ImageIcon size={12} />
                                    Image attached
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                    {isSubmitting ? (
                        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Send size={20} />
                            Send Feedback
                        </>
                    )}
                </button>
            </motion.form>

            <div className="mt-12 flex items-center justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all no-print">
                <div className="flex items-center gap-2">
                    <Rocket size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Fast Support</span>
                </div>
                <div className="flex items-center gap-2">
                    <Ghost size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Confidential</span>
                </div>
            </div>
        </div>
    );
}

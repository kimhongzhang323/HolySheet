
'use client';

import { useState } from 'react';
import { Loader2, Megaphone, Send, X, Instagram, Facebook, Twitter, Sparkles } from 'lucide-react';

// Custom icons for platforms not in Lucide (using generic or SVG placeholders if needed, but for now specific ones)
// Note: Lucide doesn't have TikTok or Xiaohongshu icons by default, we'll use generic placeholders or SVGs
const TikTokIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.373 6.373 0 0 0-5.394 10.61 6.348 6.348 0 0 0 8.582-5.571V6.873c1.029.62 2.257.948 3.5.932v-3.45a5.05 5.05 0 0 1-2.455-1.67V6.686z" />
    </svg>
);
// Simplified Xiaohongshu (Red Note) representation
const XiaohongshuIcon = ({ className }: { className?: string }) => (
    <span className={`font-black text-[10px] border border-current px-1 rounded ${className}`}>RED</span>
);

interface BroadcastDialogProps {
    isOpen: boolean;
    onClose: () => void;
    activityTitle: string;
    onSend: (message: string, filter: string, testNumber?: string) => Promise<void>;
    qrCode?: string | null;
}

export default function BroadcastDialog({ isOpen, onClose, activityTitle, onSend, qrCode }: BroadcastDialogProps) {
    const [message, setMessage] = useState(`We need volunteers for ${activityTitle}! Are you available?`);
    const [filter, setFilter] = useState('all');
    const [isSending, setIsSending] = useState(false);
    const [selectedChannels, setSelectedChannels] = useState<string[]>(['sms']); // Default to SMS
    const [isGenerating, setIsGenerating] = useState(false);

    // Test Mode State
    const [isTestMode, setIsTestMode] = useState(false);
    const [testNumber, setTestNumber] = useState('+60125751521');

    const toggleChannel = (channel: string) => {
        if (selectedChannels.includes(channel)) {
            setSelectedChannels(selectedChannels.filter(c => c !== channel));
        } else {
            setSelectedChannels([...selectedChannels, channel]);
        }
    };

    const handleAIGenerate = async () => {
        setIsGenerating(true);
        // Simulate network delay
        setTimeout(() => {
            let generatedContent = "";
            const platforms = selectedChannels.filter(c => c !== 'sms');

            if (platforms.includes('instagram') || platforms.includes('tiktok')) {
                generatedContent = `🔥 VOLUNTEERS NEEDED: ${activityTitle}! 🔥\n\nJoin us for an amazing experience and make a difference! We need energetic souls ready to help out. 💪✨\n\n📍 Sign up now before spots fill up!\n\n#Volunteer #Community #${activityTitle.replace(/\s+/g, '')} #MakeADifference #JoinUs`;
            } else if (platforms.includes('xiaohongshu')) {
                generatedContent = `✨ ${activityTitle} 需要志愿者啦! ✨\n\n小伙伴们，快来加入我们！一起参与这个有意义的活动吧！💪\n\n📍详情请看主页链接\n\n#志愿者 #义工 #社团活动 #${activityTitle.replace(/\s+/g, '')}`;
            } else {
                generatedContent = `We are looking for volunteers for ${activityTitle}! 🌟\n\nDon't miss this opportunity to contribute to the community. Slots are limited, sign up today!\n\n#Volunteer #${activityTitle.replace(/\s+/g, '')} #CommunityService`;
            }

            setMessage(generatedContent);
            setIsGenerating(false);
        }, 1500);
    };

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setIsSending(true);
        try {
            await onSend(message, isTestMode ? 'test' : filter, isTestMode ? testNumber : undefined);
            // Don't close immediately if needing auth (parent will handle)
        } catch (error) {
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };


    if (qrCode) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 text-center">
                    <div className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Connect WhatsApp</h2>
                        <p className="text-sm text-gray-500 mb-4">Scan this QR code with your WhatsApp mobile app to authorize sending.</p>
                        <div className="bg-white p-2 inline-block rounded-xl border border-gray-200">
                            <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
                        </div>
                        <p className="text-xs text-gray-400 mt-4">Once scanned, click Retry.</p>
                    </div>
                    <div className="p-4 border-t border-gray-50 bg-gray-50/30 flex justify-center gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                        <button onClick={handleSubmit} className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700">Retry / I've Scanned</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                            <Megaphone size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Blast Recruitment</h2>
                            <p className="text-xs text-gray-500 font-medium">Send SMS to potential volunteers</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Audience</label>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                        >
                            <option value="all">All Volunteers (Broad Reach)</option>
                            <option value="skills">Matching Skills</option>
                            <option value="previous">Previous Volunteers</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Blast Channels</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => toggleChannel('sms')}
                                className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all ${selectedChannels.includes('sms') ? 'bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-100' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                            >
                                <Megaphone size={14} />
                                <span className="text-xs font-bold">SMS Blast</span>
                            </button>
                            <button
                                onClick={() => toggleChannel('instagram')}
                                className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all ${selectedChannels.includes('instagram') ? 'bg-pink-50 border-pink-200 text-pink-600 ring-2 ring-pink-100' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                            >
                                <Instagram size={14} />
                                <span className="text-xs font-bold">Instagram</span>
                            </button>
                            <button
                                onClick={() => toggleChannel('tiktok')}
                                className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all ${selectedChannels.includes('tiktok') ? 'bg-gray-100 border-gray-300 text-black ring-2 ring-gray-200' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                            >
                                <TikTokIcon className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold">TikTok</span>
                            </button>
                            <button
                                onClick={() => toggleChannel('facebook')}
                                className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all ${selectedChannels.includes('facebook') ? 'bg-blue-50 border-blue-200 text-blue-600 ring-2 ring-blue-100' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                            >
                                <Facebook size={14} />
                                <span className="text-xs font-bold">Facebook</span>
                            </button>
                            <button
                                onClick={() => toggleChannel('x')}
                                className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all ${selectedChannels.includes('x') ? 'bg-gray-50 border-gray-200 text-gray-900 ring-2 ring-gray-100' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                            >
                                <Twitter size={14} />
                                <span className="text-xs font-bold">X</span>
                            </button>
                            <button
                                onClick={() => toggleChannel('xiaohongshu')}
                                className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all ${selectedChannels.includes('xiaohongshu') ? 'bg-red-50 border-red-200 text-red-600 ring-2 ring-red-100' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                            >
                                <XiaohongshuIcon />
                                <span className="text-xs font-bold">Xiaohongshu</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Message Content</label>
                        <div className="relative">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                                placeholder="Type your recruitment message..."
                            />
                            <div className="absolute bottom-3 right-3 text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                                {message.length} chars
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 px-1">
                            Note: Message will be prefixed with "Hi [Name]," automatically for SMS.
                        </p>
                        <div className="mt-2 flex justify-end">
                            <button
                                onClick={handleAIGenerate}
                                disabled={isGenerating || selectedChannels.length === 0}
                                className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                Auto-Suggest Content
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-50 bg-gray-50/30 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSending}
                        className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSending || !message.trim()}
                        className="px-5 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-200 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isSending ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Send Blast
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

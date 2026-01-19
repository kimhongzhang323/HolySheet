
'use client';

import { useState } from 'react';
import { Loader2, Megaphone, Send, X } from 'lucide-react';

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

    // Test Mode State
    const [isTestMode, setIsTestMode] = useState(false);
    const [testNumber, setTestNumber] = useState('+60125751521');

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
                            Note: Message will be prefixed with "Hi [Name]," automatically.
                        </p>
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

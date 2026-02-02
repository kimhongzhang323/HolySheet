'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2, Loader2 } from 'lucide-react';

interface SpeechButtonProps {
    onCommand?: (command: string) => void;
}

// Define available commands with their patterns and actions
const COMMANDS = [
    // Registration commands
    { patterns: ['register', 'sign up', 'book event', 'join event', 'register for event', 'register me'], action: 'register', target: null },
    { patterns: ['confirm', 'yes', 'confirm registration', 'yes register'], action: 'confirm', target: null },
    { patterns: ['cancel', 'no', 'cancel registration', 'nevermind'], action: 'cancel_register', target: null },
    // Quick actions
    { patterns: ['open qr', 'scan qr', 'qr code', 'show qr', 'qr'], action: 'qr', target: null },
    { patterns: ['open map', 'open google map', 'show map', 'directions', 'navigate to location', 'where is it'], action: 'map', target: null },
    { patterns: ['call caregiver', 'contact caregiver', 'call my caregiver', 'help me'], action: 'caregiver', target: null },
    // Navigation
    { patterns: ['go to calendar', 'open calendar', 'show calendar', 'calendar'], action: 'navigate', target: '/calendar' },
    { patterns: ['go to events', 'show events', 'view events', 'events', 'show all events'], action: 'navigate', target: '/events' },
    { patterns: ['go to profile', 'my profile', 'show profile', 'profile'], action: 'navigate', target: '/profile' },
    { patterns: ['help', 'what can you do', 'commands'], action: 'help', target: null },
];

export default function SpeechButton({ onCommand }: SpeechButtonProps) {
    const router = useRouter();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        // Check for browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event: any) => {
            const current = event.resultIndex;
            const result = event.results[current];
            const text = result[0].transcript.toLowerCase().trim();
            setTranscript(text);

            if (result.isFinal) {
                handleCommand(text);
            }
        };

        recognitionInstance.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                setFeedback('Microphone access denied. Please enable it in your browser settings.');
            } else {
                setFeedback('Could not hear you. Please try again.');
            }
            setTimeout(() => setFeedback(''), 4000);
        };

        recognitionInstance.onend = () => {
            setIsListening(false);
        };

        setRecognition(recognitionInstance);
    }, []);

    const speak = useCallback((text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    const handleCommand = useCallback((text: string) => {
        let matched = false;

        for (const cmd of COMMANDS) {
            for (const pattern of cmd.patterns) {
                if (text.includes(pattern)) {
                    matched = true;

                    switch (cmd.action) {
                        case 'qr':
                            setFeedback('Opening QR Scanner...');
                            speak('Opening QR Scanner');
                            // Dispatch event for QR scanner - the parent component or page can listen for this
                            onCommand?.('open:qr');
                            // Also navigate to a QR page if one exists, or open camera
                            setTimeout(() => router.push('/events'), 500); // Navigate to events where QR might be shown
                            break;

                        case 'map':
                            setFeedback('Opening Google Maps...');
                            speak('Opening Google Maps');
                            // Open Google Maps in a new tab with a default location or current event location
                            onCommand?.('open:map');
                            // Default to Google Maps - could be enhanced to use actual event location
                            window.open('https://maps.google.com', '_blank');
                            break;

                        case 'navigate':
                            setFeedback(`Going to ${cmd.target?.replace('/', '')}...`);
                            speak(`Going to ${cmd.target?.replace('/', '')}`);
                            setTimeout(() => router.push(cmd.target!), 500);
                            break;

                        case 'help':
                            const helpText = 'You can say: Open QR, Open Google Map, Calendar, Events, or Profile.';
                            setFeedback(helpText);
                            speak(helpText);
                            break;
                    }
                    break;
                }
            }
            if (matched) break;
        }

        if (!matched) {
            setFeedback("I didn't understand. Try saying 'Help' for commands.");
            speak("I didn't understand that. Try saying Help for a list of commands.");
        }

        setTranscript('');
        setTimeout(() => setFeedback(''), 5000);
    }, [router, speak, onCommand]);

    const toggleListening = () => {
        if (!recognition) return;

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            setFeedback('Listening...');
            recognition.start();
            setIsListening(true);
        }
    };

    if (!isSupported) {
        return null; // Don't render if not supported
    }

    return (
        <>
            {/* Floating Speech Button */}
            <motion.button
                onClick={toggleListening}
                className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all ${isListening
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-200'
                    }`}
                whileTap={{ scale: 0.9 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
                aria-label={isListening ? 'Stop listening' : 'Start voice command'}
            >
                {isListening ? (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                    >
                        <MicOff className="w-7 h-7 text-white" />
                    </motion.div>
                ) : (
                    <Mic className="w-7 h-7 text-white" />
                )}

                {/* Pulse animation when listening */}
                {isListening && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-red-500"
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                )}
            </motion.button>

            {/* Feedback Modal */}
            <AnimatePresence>
                {(transcript || feedback) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        className="fixed bottom-28 left-1/2 z-50 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl max-w-sm w-[90%] border border-gray-700"
                    >
                        <div className="flex items-start gap-3">
                            {isListening ? (
                                <div className="p-2 bg-red-500/20 rounded-lg shrink-0">
                                    <Volume2 className="w-5 h-5 text-red-400 animate-pulse" />
                                </div>
                            ) : feedback ? (
                                <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0">
                                    <Volume2 className="w-5 h-5 text-emerald-400" />
                                </div>
                            ) : (
                                <div className="p-2 bg-gray-700 rounded-lg shrink-0">
                                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                {transcript && (
                                    <p className="text-sm text-gray-300 mb-1">
                                        Heard: "<span className="text-white font-medium">{transcript}</span>"
                                    </p>
                                )}
                                {feedback && (
                                    <p className="text-sm font-medium text-emerald-400">{feedback}</p>
                                )}
                            </div>
                            <button
                                onClick={() => { setTranscript(''); setFeedback(''); }}
                                className="text-gray-500 hover:text-white transition-colors shrink-0"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

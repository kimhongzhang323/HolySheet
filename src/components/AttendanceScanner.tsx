'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, CheckCircle2, AlertCircle } from 'lucide-react';

interface AttendanceScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (userId: string, activityId: string) => Promise<{ success: boolean; message: string; userName?: string }>;
}

export default function AttendanceScanner({ isOpen, onClose, onScan }: AttendanceScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const scanner = useRef<Html5Qrcode | null>(null);
    const scannerInitialized = useRef(false);

    useEffect(() => {
        if (isOpen && !scannerInitialized.current) {
            initScanner();
        }

        return () => {
            if (scanner.current) {
                scanner.current.stop().catch(console.error);
            }
        };
    }, [isOpen]);

    const initScanner = async () => {
        try {
            const html5QrCode = new Html5Qrcode("qr-reader");
            scanner.current = html5QrCode;
            scannerInitialized.current = true;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                onScanSuccess,
                onScanError
            );

            setScanning(true);
        } catch (err) {
            console.error("Unable to start scanner:", err);
            setMessage({ type: 'error', text: 'Unable to access camera. Please check permissions.' });
        }
    };

    const onScanSuccess = async (decodedText: string) => {
        // Parse QR code data
        // Expected format: "HOLYSHEET:ACTIVITY:{activity_id}:{timestamp}"
        // OR for user QR: "HOLYSHEET:USER:{user_id}"

        try {
            const parts = decodedText.split(':');

            if (parts[0] !== 'HOLYSHEET') {
                setMessage({ type: 'error', text: 'Invalid QR code format' });
                return;
            }

            if (parts[1] === 'ACTIVITY') {
                const activityId = parts[2];
                // For demo, we'll need both user and activity
                // In production, you'd scan user QR and select activity
                const userId = 'demo-user-id'; // This should come from a selected user scan or input

                const result = await onScan(userId, activityId);

                if (result.success) {
                    setMessage({
                        type: 'success',
                        text: `✓ ${result.userName || 'User'} marked as attended!`
                    });

                    // Auto-clear success message after 2 seconds
                    setTimeout(() => setMessage(null), 2000);
                } else {
                    setMessage({ type: 'error', text: result.message });
                }
            } else if (parts[1] === 'USER') {
                const userId = parts[2];
                // Store user ID for next scan (activity QR)
                setMessage({
                    type: 'success',
                    text: `User scanned. Now scan activity QR code.`
                });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to process QR code' });
        }
    };

    const onScanError = (error: string) => {
        // Ignore continuous scan errors
        console.debug(error);
    };

    const handleClose = async () => {
        if (scanner.current) {
            await scanner.current.stop();
            scannerInitialized.current = false;
        }
        setScanning(false);
        setMessage(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="relative w-full max-w-lg mx-4">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent z-10 p-4 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Camera className="text-white" size={24} />
                            <h2 className="text-xl font-bold text-white">Scan Attendance</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                        >
                            <X size={24} className="text-white" />
                        </button>
                    </div>
                </div>

                {/* Scanner */}
                <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl mt-16">
                    <div id="qr-reader" className="w-full"></div>

                    {!scanning && (
                        <div className="flex items-center justify-center h-64 bg-gray-800">
                            <div className="text-center">
                                <Camera className="mx-auto mb-4 text-gray-400" size={48} />
                                <p className="text-gray-400">Initializing camera...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Message */}
                {message && (
                    <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                            ? 'bg-green-500/20 border border-green-500'
                            : 'bg-red-500/20 border border-red-500'
                        }`}>
                        {message.type === 'success' ? (
                            <CheckCircle2 className="text-green-400" size={24} />
                        ) : (
                            <AlertCircle className="text-red-400" size={24} />
                        )}
                        <p className={`font-medium ${message.type === 'success' ? 'text-green-100' : 'text-red-100'
                            }`}>
                            {message.text}
                        </p>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
                    <p className="text-sm font-medium mb-2">Instructions:</p>
                    <ol className="text-sm space-y-1 list-decimal list-inside opacity-90">
                        <li>Position QR code within the frame</li>
                        <li>Hold steady until scanner beeps</li>
                        <li>Attendance will be marked automatically</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

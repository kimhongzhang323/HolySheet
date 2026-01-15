'use client';

import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white px-8 py-6">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </header>

            {/* Content */}
            <div className="p-8">
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                    <SettingsIcon className="mx-auto text-gray-300 mb-4" size={64} />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">System Settings</h2>
                    <p className="text-gray-500">Configuration options will be available here. Coming soon!</p>
                </div>
            </div>
        </div>
    );
}

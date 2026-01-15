'use client';

import { Users, Search, Filter } from 'lucide-react';

export default function VolunteersPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white px-8 py-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Volunteers</h1>
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md">
                        <Users size={18} />
                        Add Volunteer
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="p-8">
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                    <Users className="mx-auto text-gray-300 mb-4" size={64} />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Volunteer Management</h2>
                    <p className="text-gray-500">This page is under construction. Coming soon!</p>
                </div>
            </div>
        </div>
    );
}

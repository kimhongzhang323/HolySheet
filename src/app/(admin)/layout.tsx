'use client';

import { Users, Calendar, Settings, FileText, Network } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
    name: string;
    path: string;
    icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
    { name: 'Dashboard', path: '/admin', icon: <Network size={20} /> },
    { name: 'Volunteers', path: '/admin/volunteers', icon: <Users size={20} /> },
    { name: 'Schedule', path: '/admin/schedule', icon: <Calendar size={20} /> },
    { name: 'Automation Logs', path: '/admin/logs', icon: <FileText size={20} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">M</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">MINDS Admin</h1>
                            <p className="text-xs text-gray-500">Staff Command Center</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                {item.icon}
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-600">A</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Admin User</p>
                            <p className="text-xs text-gray-500">Logout</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-50">
                {children}
            </main>
        </div>
    );
}

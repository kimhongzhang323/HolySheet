'use client';

import { Users, Settings, Home, LogOut, LayoutGrid, CheckSquare, Phone, Video, MoreHorizontal, Paperclip, Mic, Smile, Network, HelpCircle, PanelRightClose, PanelRightOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import AiChatSidebar from '@/components/AiChatSidebar';

interface NavItem {
    name: string;
    path: string;
    icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
    { name: 'Home', path: '/admin', icon: <Home size={20} /> },
    { name: 'Events', path: '/admin/events', icon: <LayoutGrid size={20} /> },
    { name: 'Calendar', path: '/admin/schedule', icon: <CheckSquare size={20} /> },
    { name: 'Team', path: '/admin/volunteers', icon: <Users size={20} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
            router.push('/dashboard');
        }
    }, [status, session, router]);

    // Close sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    if (status === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (session?.user?.role !== 'admin' && session?.user?.role !== 'staff') return null;

    return (
        <div className="flex h-screen bg-white overflow-hidden text-gray-900 font-sans selection:bg-blue-100">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Left Sidebar */}
            <aside className={`fixed inset-y-0 left-0 bg-white flex flex-col border-r border-gray-100 shrink-0 z-40 transition-transform duration-300 ease-in-out md:static md:translate-x-0 w-[280px] md:w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                {/* Header/Logo */}
                <div className="p-6 md:p-8 pb-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                            <Network className="text-white w-6 h-6" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">holysheet</span>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                        <PanelRightClose size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-[#F8F9FB] text-gray-900 font-bold'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <span className={`${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-900'}`}>
                                    {item.icon}
                                </span>
                                <span className={isActive ? 'font-bold' : 'font-medium'}>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Nav */}
                <div className="px-4 py-6 space-y-1 border-t border-gray-50">
                    <button className="w-full flex items-center gap-3 px-5 py-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all font-medium text-sm">
                        <HelpCircle size={20} />
                        Help & information
                    </button>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium text-sm"
                    >
                        <LogOut size={20} />
                        Log out
                    </button>
                </div>
            </aside>

            {/* Main Content (Middle View) */}
            <main className="flex-1 overflow-auto bg-white relative z-10 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex flex-col">
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <LayoutGrid size={24} />
                        </button>
                        <span className="font-bold text-lg">Admin</span>
                    </div>
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                        <Network className="text-white w-4 h-4" />
                    </div>
                </div>

                <div className="flex-1">
                    {children}
                </div>

                {/* AI Chat Toggle Button (Visible when closed) */}
                {!isChatOpen && (
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="fixed right-6 bottom-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition-all hover:scale-110 flex items-center justify-center group"
                    >
                        <Network className="w-6 h-6 group-hover:animate-pulse" />
                    </button>
                )}
            </main>

            {/* Right Panel (AI Chat) - Responsive */}
            <aside className={`bg-white border-l border-gray-100 shrink-0 z-50 fixed inset-y-0 right-0 md:static transition-all duration-300 ease-in-out shadow-2xl md:shadow-none ${isChatOpen
                ? 'translate-x-0 w-full md:w-[380px]'
                : 'translate-x-full w-0 md:translate-x-0 md:border-none md:overflow-hidden'
                }`}>
                <div className="h-full relative w-full border-l border-gray-100">
                    {/* Close Button (Absolute inside sidebar) */}
                    <button
                        onClick={() => setIsChatOpen(false)}
                        className="absolute right-4 top-4 z-50 text-gray-400 hover:text-gray-900 bg-white/50 backdrop-blur-sm p-1 rounded-lg hover:bg-gray-100 transition-all"
                    >
                        <PanelRightClose size={18} />
                    </button>
                    <AiChatSidebar />
                </div>
            </aside>
        </div>
    );
}

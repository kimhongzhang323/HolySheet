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
    { name: 'Tasks', path: '/admin/schedule', icon: <CheckSquare size={20} /> },
    { name: 'Team', path: '/admin/volunteers', icon: <Users size={20} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isChatOpen, setIsChatOpen] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
            router.push('/dashboard');
        }
    }, [status, session, router]);

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
            {/* Left Sidebar */}
            <aside className="w-64 bg-white flex flex-col border-r border-gray-100 shrink-0 z-20">
                {/* Header/Logo */}
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                            <Network className="text-white w-6 h-6" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">holysheet</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1">
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
            <main className="flex-1 overflow-auto bg-white relative z-10 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {children}

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

            {/* Right Panel (AI Chat) */}
            <aside className={`bg-white border-l border-gray-100 shrink-0 z-20 transition-all duration-300 ease-in-out relative ${isChatOpen ? 'w-[380px]' : 'w-0 border-none overflow-hidden'}`}>
                <div className="h-full relative">
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

'use client';

import { Search, Bell, Settings, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopBar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname?.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="flex items-center justify-between px-6 py-3 max-w-[1400px] mx-auto">

                {/* Left: Logo & Nav */}
                <div className="flex items-center gap-12">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-105 transition-transform">
                            <span className="text-white font-bold text-xl">H</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-gray-900">HolySheet</span>
                    </Link>

                    {/* Navigation Pills */}
                    <nav className="hidden md:flex items-center p-1.5 bg-gray-100/80 rounded-full border border-gray-200/50">
                        <Link
                            href="/"
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${pathname === '/'
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/events"
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${isActive('/events')
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                }`}
                        >
                            Events
                        </Link>
                        <Link
                            href="/calendar"
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${isActive('/calendar')
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                }`}
                        >
                            Calendar
                        </Link>
                        <Link
                            href="/support"
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${isActive('/support')
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                }`}
                        >
                            Support
                        </Link>
                    </nav>
                </div>

                {/* Right: Search & Profile */}
                <div className="flex items-center gap-5">
                    {/* Search */}
                    <div className="relative hidden lg:block group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2.5 bg-gray-100/50 border-none rounded-2xl text-sm w-[240px] focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:shadow-sm transition-all outline-none placeholder:text-gray-400"
                        />
                    </div>

                    <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                        <button className="relative p-2.5 hover:bg-gray-100 rounded-full transition-colors">
                            <Bell size={20} className="text-gray-600" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>

                        <div className="flex items-center gap-3 cursor-pointer p-1.5 pr-3 hover:bg-gray-100 rounded-full transition-all border border-transparent hover:border-gray-200">
                            <div className="w-9 h-9 relative rounded-full overflow-hidden bg-indigo-100 ring-2 ring-white shadow-sm">
                                <Image
                                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                    alt="User"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-bold text-gray-900 leading-none">Kim Ho</p>
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">Participant</p>
                            </div>
                            <ChevronDown size={14} className="text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

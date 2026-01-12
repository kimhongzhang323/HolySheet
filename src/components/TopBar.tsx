
import Link from 'next/link';
import { Search, Bell, Settings, ChevronDown } from 'lucide-react';

export default function TopBar() {
    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="bg-black text-white p-1.5 rounded-lg font-bold text-xl">
                        Y
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900">YowTix</span>
                </div>

                {/* Center Nav - YowTix Style Pills */}
                <nav className="hidden md:flex items-center gap-1 p-1 bg-gray-100/50 rounded-full border border-gray-100">
                    <Link href="/" className="px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-medium shadow-sm transition-all">
                        Dashboard
                    </Link>
                    <Link href="/events" className="px-5 py-2 rounded-full text-gray-500 hover:bg-gray-200/50 text-sm font-medium transition-all">
                        Events
                    </Link>
                    <Link href="/tickets" className="px-5 py-2 rounded-full text-gray-500 hover:bg-gray-200/50 text-sm font-medium transition-all">
                        Tickets
                    </Link>
                    <Link href="/analytics" className="px-5 py-2 rounded-full text-gray-500 hover:bg-gray-200/50 text-sm font-medium transition-all">
                        Analytics
                    </Link>
                    <Link href="/support" className="px-5 py-2 rounded-full text-gray-500 hover:bg-gray-200/50 text-sm font-medium transition-all">
                        Support
                    </Link>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 rounded-full text-sm outline-none transition-all w-64"
                        />
                    </div>

                    <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors relative">
                        <Bell size={18} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>

                    <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200">
                        <div className="text-right hidden lg:block">
                            <p className="text-sm font-bold text-gray-900 leading-none">Vetrick W.</p>
                            <p className="text-xs text-gray-500 mt-0.5">Manager</p>
                        </div>
                        <div className="h-9 w-9 bg-gray-200 rounded-full overflow-hidden border border-gray-100">
                            {/* Placeholder Avatar */}
                            <img src="https://i.pravatar.cc/150?u=vetrick" alt="Profile" className="h-full w-full object-cover" />
                        </div>
                        <ChevronDown size={14} className="text-gray-400" />
                    </div>
                </div>
            </div>
        </header>
    );
}

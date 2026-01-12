import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
    title: 'Admin Command Center - MINDS',
    description: 'Manage schedules and track analytics.',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-100 flex">
            <aside className="w-64 bg-slate-900 text-white hidden md:block">
                <div className="p-6">
                    <h1 className="text-xl font-bold tracking-tight">MINDS Admin</h1>
                </div>
                <nav className="mt-4 px-4 space-y-2">
                    <a href="#" className="block py-2 px-3 bg-slate-800 rounded">Dashboard</a>
                    <a href="#" className="block py-2 px-3 hover:bg-slate-800 rounded">Calendar</a>
                    <a href="#" className="block py-2 px-3 hover:bg-slate-800 rounded">Users</a>
                    <a href="#" className="block py-2 px-3 hover:bg-slate-800 rounded">Settings</a>
                </nav>
            </aside>
            <div className="flex-1 flex flex-col">
                <header className="h-16 bg-white border-b flex items-center px-6 justify-between">
                    <h2 className="text-lg font-medium lg:hidden">Menu</h2>
                    <div className="ml-auto flex items-center gap-4">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <span>Admin User</span>
                    </div>
                </header>
                <main className="flex-1 p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

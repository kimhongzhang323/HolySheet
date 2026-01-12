import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
    title: 'Community Portal - MINDS Activity Hub',
    description: 'Book activities and volunteer.',
};

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow">
                <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-primary">Activity Hub</h1>
                    {/* Mock Navigation for Portal */}
                    <nav>
                        <span className="text-sm font-medium">My Profile</span>
                    </nav>
                </div>
            </header>
            <main className="flex-1 max-w-md w-full mx-auto px-4 py-6">
                {children}
            </main>
            <footer className="bg-white border-t py-4 text-center text-xs text-gray-500">
                <p>MINDS Activity Hub Mobile Portal</p>
            </footer>
        </div>
    );
}

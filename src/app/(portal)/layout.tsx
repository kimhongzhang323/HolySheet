import type { Metadata } from 'next';
import '../globals.css';
import TopBar from '@/components/TopBar';

export const metadata: Metadata = {
    title: 'Dashboard - JomCare',
    description: 'Manage your volunteer activities and bookings.',
};

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <TopBar />

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8">
                {children}
            </main>
        </div>
    );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalRootPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/calendar');
    }, [router]);

    // Show a loading state while redirecting
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
}

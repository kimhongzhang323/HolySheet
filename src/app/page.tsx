'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GridMotion from '@/components/GridMotion';
import Link from 'next/link';
import PixelCard from '@/components/PixelCard';

export default function LandingPage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            router.replace('/dashboard');
        }
    }, [status, router]);

    // Show loading or nothing while checking auth status
    if (status === 'loading' || status === 'authenticated') {
        return (
            <main className="w-full h-screen relative bg-black overflow-hidden font-sans flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </main>
        );
    }

    return (
        <main className="w-full h-screen relative bg-black overflow-hidden font-sans">
            <div className="absolute inset-0 z-0">
                <GridMotion
                    gradientColor="#161616ff"
                    items={[
                        "https://i.postimg.cc/zGsP8Ty9/960x640-nurturing-confident.jpg",
                        "https://i.postimg.cc/0yTHP7zH/960x640-embracing-innovation.jpg",
                        "https://i.postimg.cc/Bnrw4280/960x640-vocational-success.jpg",
                        "https://i.postimg.cc/qvPZ42NY/960x640-journey-learning-journey.jpg",
                        "https://i.postimg.cc/HkcPq6LG/960x640-discovering-innate.jpg",
                        "https://i.postimg.cc/x1wFnLXB/960x640-journey-school-based.jpg",
                        "https://i.postimg.cc/vZJSb54N/960x640-independence.jpg",
                        "https://i.postimg.cc/W1BfT0DV/schools-job-coach.jpg",
                        "https://i.postimg.cc/6pk1tC7s/960x640-robust-co-curricular-programmes.jpg",
                        "https://i.postimg.cc/FHMnN0Y8/960x640-journey-qualifications.jpg",
                        "https://i.postimg.cc/htk3cVXk/960x640-optimising-learning-environment.jpg",
                        "https://i.postimg.cc/BnLwrmvf/960x640-journey-industry-based.jpg",
                        "https://i.postimg.cc/L8c02jJQ/960x640-honing-academic.jpg",
                    ]}
                />
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                <div className="text-center space-y-6">
                    <h1 className="text-7xl md:text-9xl font-bold text-white tracking-tighter opacity-90 drop-shadow-2xl">
                        MINDS
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl font-light tracking-widest uppercase">
                        Empowering every individual with special needs and their families
                    </p>

                    <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-6">
                        <Link href="/login" className="pointer-events-auto inline-block">
                            <PixelCard
                                variant="default"
                                gap={10}
                                speed={20}
                                colors="#2e2e2e,#454545,#5e5e5e"
                                className="inline-flex items-center justify-center w-[200px] px-8 py-4 rounded-full bg-[#1a1a1a] transition-transform duration-200 hover:scale-105"
                                noFocus={false}
                            >
                                <div className="flex items-center gap-2 relative z-20">
                                    <span className="text-base font-bold text-white">Join Us</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                        <line x1="7" y1="17" x2="17" y2="7"></line>
                                        <polyline points="7 7 17 7 17 17"></polyline>
                                    </svg>
                                </div>
                            </PixelCard>
                        </Link>

                        <Link href="/dashboard" className="pointer-events-auto inline-block">
                            <PixelCard
                                variant="pink"
                                gap={10}
                                speed={20}
                                colors="#f8fafc,#f1f5f9,#cbd5e1"
                                className="inline-flex items-center justify-center w-[200px] px-8 py-4 rounded-full bg-white transition-transform duration-200 hover:scale-105"
                            >
                                <span className="text-base font-bold text-black relative z-20">Discover More</span>
                            </PixelCard>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

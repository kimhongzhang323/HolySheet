'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MenuItem {
    link: string;
    title: string;
    image: string;
}

interface InfiniteMenuProps {
    items: MenuItem[];
}

export default function InfiniteMenu({ items }: InfiniteMenuProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeItem, setActiveItem] = useState<MenuItem | null>(items[0] || null);
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [velocity, setVelocity] = useState(0);
    const animationRef = useRef<number>();

    const itemCount = items.length;
    const angleStep = 360 / itemCount;

    // Handle mouse/touch drag
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setStartY(clientY);
        setVelocity(0);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const deltaY = clientY - startY;
        setRotation(prev => prev + deltaY * 0.5);
        setVelocity(deltaY * 0.5);
        setStartY(clientY);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        // Apply momentum
        const decelerate = () => {
            setVelocity(prev => {
                const newVelocity = prev * 0.95;
                if (Math.abs(newVelocity) < 0.1) return 0;
                setRotation(r => r + newVelocity);
                animationRef.current = requestAnimationFrame(decelerate);
                return newVelocity;
            });
        };
        animationRef.current = requestAnimationFrame(decelerate);
    };

    // Handle scroll wheel
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        setRotation(prev => prev + e.deltaY * 0.3);
    };

    // Update active item based on rotation
    useEffect(() => {
        const normalizedRotation = ((rotation % 360) + 360) % 360;
        const activeIndex = Math.round(normalizedRotation / angleStep) % itemCount;
        const safeIndex = (itemCount - activeIndex) % itemCount;
        setActiveItem(items[safeIndex]);
    }, [rotation, items, angleStep, itemCount]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <div className="relative w-full h-[500px] overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* 3D Cylinder Container */}
            <div
                ref={containerRef}
                className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
                onWheel={handleWheel}
                style={{ perspective: '1000px' }}
            >
                <div
                    className="relative w-[300px] h-[400px]"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: `rotateX(${rotation}deg)`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    }}
                >
                    {items.map((item, index) => {
                        const angle = index * angleStep;
                        const translateZ = 300; // radius
                        return (
                            <motion.div
                                key={item.title}
                                className="absolute w-full h-[120px] rounded-xl overflow-hidden shadow-2xl border border-white/10"
                                style={{
                                    transform: `rotateX(${-angle}deg) translateZ(${translateZ}px)`,
                                    backfaceVisibility: 'hidden',
                                }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    draggable={false}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-3 left-4 right-4">
                                    <h3 className="text-white font-bold text-lg leading-tight">{item.title}</h3>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Active Item Info */}
            {activeItem && (
                <motion.div
                    key={activeItem.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20"
                >
                    <h2 className="text-2xl font-bold text-white mb-2">{activeItem.title}</h2>
                    <a
                        href={activeItem.link}
                        className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                    >
                        View Details
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M7 17L17 7M17 7H7M17 7V17" />
                        </svg>
                    </a>
                </motion.div>
            )}

            {/* Scroll Hint */}
            <div className="absolute top-4 right-4 text-white/40 text-xs font-medium flex items-center gap-2">
                <span>Scroll to explore</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-bounce">
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
            </div>
        </div>
    );
}

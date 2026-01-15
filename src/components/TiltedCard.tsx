'use client';

import { useRef, useState, ReactNode } from 'react';
import { motion, useMotionValue, useSpring, SpringOptions } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface TiltedCardProps {
    children?: ReactNode;
    containerHeight?: string | number;
    containerWidth?: string | number;
    rotateAmplitude?: number;
    scaleOnHover?: number;
    className?: string; // Wrapper class
    contentClassName?: string; // Content container class
}

const springValues: SpringOptions = {
    damping: 30,
    stiffness: 100,
    mass: 2
};

export default function TiltedCard({
    children,
    containerHeight = '100%',
    containerWidth = '100%',
    rotateAmplitude = 14,
    scaleOnHover = 1.05,
    className = '',
    contentClassName = '',
}: TiltedCardProps) {
    const ref = useRef<HTMLElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(useMotionValue(0), springValues);
    const rotateY = useSpring(useMotionValue(0), springValues);
    const scale = useSpring(1, springValues);
    const opacity = useSpring(0);

    const [lastY, setLastY] = useState(0);

    function handleMouse(e: React.MouseEvent<HTMLElement>) {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - rect.width / 2;
        const offsetY = e.clientY - rect.top - rect.height / 2;

        const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
        const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

        rotateX.set(rotationX);
        rotateY.set(rotationY);

        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);

        setLastY(offsetY);
    }

    function handleMouseEnter() {
        scale.set(scaleOnHover);
        opacity.set(1);
    }

    function handleMouseLeave() {
        opacity.set(0);
        scale.set(1);
        rotateX.set(0);
        rotateY.set(0);
    }

    return (
        <figure
            ref={ref}
            className={cn("relative z-10 [perspective:800px] flex flex-col items-center justify-center transition-all duration-200", className)}
            style={{
                height: containerHeight,
                width: containerWidth
            }}
            onMouseMove={handleMouse}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                className={cn("relative [transform-style:preserve-3d] w-full h-full", contentClassName)}
                style={{
                    rotateX,
                    rotateY,
                    scale
                }}
            >
                <div className="w-full h-full [transform:translateZ(0)]">
                    {children}
                </div>
            </motion.div>
        </figure>
    );
}

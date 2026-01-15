"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function GridMotion({
    items = [],
    gradientColor = "black",
}: {
    items?: string[];
    gradientColor?: string;
}) {
    const gridRef = useRef<HTMLDivElement>(null);
    const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
    const mouseX = useRef(0);

    // Ensure default items if none provided
    const displayItems = items.length > 0 ? items : Array.from({ length: 28 }, (_, i) => `Item ${i}`);

    useEffect(() => {
        gsap.ticker.add((time, deltaTime) => {
            const dt = 1.0 - Math.pow(1.0 - 0.1, deltaTime / 16.666); // Damping factor

            rowRefs.current.forEach((row, index) => {
                if (!row) return;

                // Calculate distinct speed for each row based on index
                // Center rows move slower or differently than outer rows for parallax
                const direction = index % 2 === 0 ? 1 : -1; // Alternate direction
                const speed = (index + 1) * 0.5; // Varying speeds

                // Use a persistent position via data attribute or ref if needed
                // Simpler approach: animate X based on generic timeline or just constant motion?
                // "Grid Motion" usually implies interaction or constant flowing grid.
                // Let's implement a flowing grid following mouse X slightly.

                const currentX = parseFloat(row.getAttribute("data-x") || "0");
                const movementRange = 200; // Range of motion in pixels
                const targetX = mouseX.current * direction * speed * movementRange;

                // Interpolate
                const newX = currentX + (targetX - currentX) * dt;

                row.setAttribute("data-x", newX.toString());

                gsap.set(row, {
                    x: newX,
                });
            });
        });

        const handleMouseMove = (e: MouseEvent) => {
            // Normalize mouse X from -1 to 1
            mouseX.current = (e.clientX / window.innerWidth) * 2 - 1;
        };

        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            gsap.ticker.remove(() => { });
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [displayItems]);

    return (
        <div className="relative w-full h-full overflow-hidden bg-black text-white" ref={gridRef}>
            <div className="absolute inset-0 z-10 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at center, transparent 0%, ${gradientColor} 100%)`
                }}
            />

            <div className="flex flex-col justify-center items-center h-full gap-4 rotate-[-15deg] scale-125">
                {[0, 1, 2, 3].map((rowIndex) => {
                    // Create a unique list for each row by slicing and combining differently
                    const rowItems = [...displayItems];
                    const offset = rowIndex * 3; // Shift by 3 items per row
                    const shiftedItems = [...rowItems.slice(offset), ...rowItems.slice(0, offset)];
                    // Duplicate for seamless scrolling
                    const combinedItems = [...shiftedItems, ...shiftedItems];

                    return (
                        <div
                            key={rowIndex}
                            ref={(el) => { rowRefs.current[rowIndex] = el; }}
                            className="flex gap-4 w-[200vw]"
                        >
                            {combinedItems.map((item, i) => (
                                <div key={i} className="relative w-64 h-40 bg-neutral-900/50 border border-neutral-800 rounded-xl flex items-center justify-center backdrop-blur-sm shrink-0 hover:bg-neutral-800 transition-colors duration-300 overflow-hidden">
                                    {item.startsWith("http") || item.startsWith("/") ? (
                                        <img
                                            src={item}
                                            alt={`Grid item ${i}`}
                                            className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-neutral-800/20 to-neutral-900/20" />
                                    )}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

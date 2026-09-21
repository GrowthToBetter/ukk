"use client"
import { motion } from "motion/react";
import React from 'react';
import Image from "next/image";

// Siku cropping untuk foto
const CropMarks = ({ color = "ink-950" }: { color?: "ink-950" | "paper-100" }) => {
    const stroke = color === "paper-100" ? "#FBFDFF" : "#1A1A1A"; // OKLCH mappings
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M5 20 L5 5 L20 5" fill="none" stroke={stroke} strokeWidth="2" />
            <path d="M80 5 L95 5 L95 20" fill="none" stroke={stroke} strokeWidth="2" />
            <path d="M95 80 L95 95 L80 95" fill="none" stroke={stroke} strokeWidth="2" />
            <path d="M20 95 L5 95 L5 80" fill="none" stroke={stroke} strokeWidth="2" />
        </svg>
    );
};

export function EvidenceCard({
    index,
    title,
    meta,
    children,
    image,
    action,
    variant = "light"
}: {
    index: number;
    title: string;
    meta: string;
    children?: React.ReactNode;
    image?: string;
    action?: { label: string; href: string };
    variant?: "light" | "dark";
}) {
    const isDark = variant === "dark";
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className={`group flex flex-col border border-ink-200 relative ${isDark ? "bg-ink-950" : "bg-paper-050"}`}
        >
            {/* Corner Index */}
            <div className={`absolute top-4 right-6 font-display text-4xl font-bold z-10 ${isDark ? "text-paper-100" : "text-ink-950"}`}>
                ({String(index).padStart(2, '0')})
            </div>

            {/* Image */}
            {image && (
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <Image src={image} alt={title} className="w-full h-full object-cover" fill sizes="(max-width: 768px) 100vw, 50vw" />
                    <CropMarks color={isDark ? "paper-100" : "ink-950"} />
                </div>
            )}

            {/* Content */}
            <div className={`p-8 flex flex-col flex-grow ${isDark ? "text-paper-100" : "text-ink-950"}`}>
                <h2 className="font-display text-5xl font-medium mb-6 uppercase tracking-tight">{title}</h2>
                <div className="font-mono text-xs uppercase tracking-widest text-ink-600 mb-6 border-b border-ink-200 pb-4">
                    {meta}
                </div>
                {children && <div className="text-sm font-body mb-8 opacity-80">{children}</div>}
                {action && (
                    <a href={action.href} className="inline-block mt-auto font-mono text-sm underline underline-offset-4 hover:text-accent-500 transition-colors">
                        {action.label} →
                    </a>
                )}
            </div>
        </motion.div>
    );
}
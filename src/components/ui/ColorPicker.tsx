'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// COLOR PICKER - Seletor de cores para nós
// ============================================================================

const PRESET_COLORS = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Indigo', value: '#6366f1' },
];

interface ColorPickerProps {
    value?: string;
    onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentColor = value || PRESET_COLORS[0].value;

    // Fecha ao clicar fora
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-8 h-8 rounded-lg border-2 border-white/20",
                    "transition-all duration-200",
                    "hover:scale-110 hover:border-white/40",
                    "focus:outline-none focus:ring-2 focus:ring-white/20"
                )}
                style={{ backgroundColor: currentColor }}
                title="Mudar cor"
            />

            {/* Popover */}
            {isOpen && (
                <div
                    className={cn(
                        "absolute top-full left-0 mt-2 z-[60]",
                        "p-3 rounded-xl",
                        "bg-zinc-900 backdrop-blur-xl",
                        "border border-white/20",
                        "shadow-xl shadow-black/50"
                    )}
                    style={{ minWidth: '160px' }}
                >
                    {/* Color Grid - usando flex em vez de grid para evitar problema de espaçamento */}
                    <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => {
                                    onChange(color.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-8 h-8 rounded-lg flex-shrink-0",
                                    "transition-transform duration-150",
                                    "hover:scale-110",
                                    "focus:outline-none",
                                    value === color.value && "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                                )}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

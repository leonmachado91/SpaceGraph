'use client';

import { X } from 'lucide-react';

// ============================================================================
// TAG BADGE - Badge visual de uma SuperTag
// ============================================================================

interface TagBadgeProps {
    name: string;
    color: string;
    onRemove?: () => void;
    size?: 'sm' | 'md';
}

export function TagBadge({ name, color, onRemove, size = 'md' }: TagBadgeProps) {
    const sizeClasses = size === 'sm'
        ? 'text-[10px] px-1.5 py-0.5 gap-1'
        : 'text-xs px-2 py-1 gap-1.5';

    return (
        <span
            className={`inline-flex items-center rounded-full font-medium transition-all ${sizeClasses}`}
            style={{
                backgroundColor: `${color}20`,
                color: color,
                border: `1px solid ${color}40`,
            }}
        >
            <span className="truncate max-w-[100px]">{name}</span>
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    title="Remover tag"
                >
                    <X size={size === 'sm' ? 10 : 12} />
                </button>
            )}
        </span>
    );
}

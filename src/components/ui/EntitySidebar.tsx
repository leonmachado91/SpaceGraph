'use client';

import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { cn } from '@/lib/utils';

// ============================================================================
// ENTITY SIDEBAR - Componente base para sidebars de edição
// ============================================================================
// Encapsula a estrutura comum entre PropertySidebar e EdgeSidebar:
// - Container glassmorphism flutuante
// - Header com ColorPicker e título editável
// - Body com scroll
// - Footer com botão de delete
// ============================================================================

interface EntitySidebarProps {
    /** Título atual da entidade */
    title: string;
    /** Callback para mudança de título */
    onTitleChange: (title: string) => void;
    /** Cor atual (opcional) */
    color?: string;
    /** Callback para mudança de cor */
    onColorChange?: (color: string) => void;
    /** Callback para fechar o sidebar */
    onClose: () => void;
    /** Callback para deletar a entidade */
    onDelete: () => void;
    /** Texto do placeholder do título */
    titlePlaceholder?: string;
    /** Texto do botão de delete */
    deleteButtonText?: string;
    /** Conteúdo do body (children) */
    children: React.ReactNode;
}

export function EntitySidebar({
    title,
    onTitleChange,
    color,
    onColorChange,
    onClose,
    onDelete,
    titlePlaceholder = 'Nome...',
    deleteButtonText = 'Excluir',
    children,
}: EntitySidebarProps) {
    return (
        <div
            className={cn(
                "fixed right-4 top-20 bottom-4 w-[340px] z-40",
                "flex flex-col",
                // Glassmorphism
                "bg-zinc-900/90 backdrop-blur-xl",
                "border border-white/10 rounded-2xl",
                "shadow-2xl shadow-black/50",
                // Animation
                "animate-in slide-in-from-right duration-300"
            )}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header com ColorPicker e Título */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3 flex-1">
                    {onColorChange && (
                        <ColorPicker
                            value={color}
                            onChange={onColorChange}
                        />
                    )}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                        placeholder={titlePlaceholder}
                        className={cn(
                            "flex-1 px-2 py-1 rounded-lg bg-transparent",
                            "text-white text-lg font-semibold",
                            "placeholder:text-zinc-600",
                            "focus:outline-none focus:bg-white/5",
                            "transition-all duration-200"
                        )}
                    />
                </div>
                <button
                    onClick={onClose}
                    title="Fechar painel"
                    className={cn(
                        "p-2 rounded-lg",
                        "text-zinc-400 hover:text-white",
                        "hover:bg-white/10",
                        "transition-colors duration-150"
                    )}
                >
                    <X size={18} />
                </button>
            </div>

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {children}
            </div>

            {/* Footer com Delete */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={onDelete}
                    title={deleteButtonText}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                        "bg-red-500/10 border border-red-500/20",
                        "text-red-400 hover:text-red-300 text-sm",
                        "hover:bg-red-500/20 hover:border-red-500/30",
                        "transition-all duration-200"
                    )}
                >
                    <Trash2 size={16} />
                    <span>{deleteButtonText}</span>
                </button>
            </div>
        </div>
    );
}

// === Sub-componentes para seções ===

interface SidebarSectionProps {
    /** Label da seção */
    label: string;
    /** Conteúdo da seção */
    children: React.ReactNode;
}

/**
 * Seção com label dentro do EntitySidebar
 */
export function SidebarSection({ label, children }: SidebarSectionProps) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                {label}
            </label>
            {children}
        </div>
    );
}

interface InfoPanelProps {
    /** Lista de itens a exibir (key-value pairs) */
    items: Array<{ label: string; value: React.ReactNode }>;
}

/**
 * Painel de informações (ID, posição, etc) dentro do EntitySidebar
 */
export function InfoPanel({ items }: InfoPanelProps) {
    return (
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
            {items.map((item, index) => (
                <div key={index} className="flex justify-between">
                    <span className="text-zinc-500">{item.label}</span>
                    <span className="text-zinc-400">{item.value}</span>
                </div>
            ))}
        </div>
    );
}

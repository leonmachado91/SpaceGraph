'use client';

import { useState } from 'react';
import { X, Pencil, Trash2, Plus, Settings } from 'lucide-react';
import { useGraphStore } from '@/lib/store/graphStore';
import { cn } from '@/lib/utils';

// ============================================================================
// TAG MANAGER - Modal para gerenciar todas as SuperTags
// ============================================================================

interface TagManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onEditTag?: (tagId: string) => void;
}

export function TagManager({ isOpen, onClose, onEditTag }: TagManagerProps) {
    const { superTags, deleteSuperTag, createSuperTag } = useGraphStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newTagName, setNewTagName] = useState('');

    if (!isOpen) return null;

    const handleCreateTag = () => {
        if (!newTagName.trim()) return;

        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        createSuperTag({
            name: newTagName.trim(),
            color: randomColor,
            fields: [],
        });

        setNewTagName('');
        setIsCreating(false);
    };

    const handleDeleteTag = (tagId: string, tagName: string) => {
        if (confirm(`Deletar a tag "${tagName}"? Isso removerá a tag de todos os nós.`)) {
            deleteSuperTag(tagId);
        }
    };

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Modal */}
            <div
                className={cn(
                    "w-full max-w-md mx-4",
                    "bg-zinc-900 border border-white/10 rounded-2xl",
                    "shadow-2xl shadow-black/50",
                    "animate-in fade-in zoom-in-95 duration-200"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Settings size={18} className="text-violet-400" />
                        <h2 className="text-lg font-semibold text-white">Gerenciar Tags</h2>
                    </div>
                    <button
                        onClick={onClose}
                        title="Fechar"
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 max-h-80 overflow-y-auto">
                    {superTags.length === 0 ? (
                        <div className="text-center text-zinc-500 py-8">
                            Nenhuma tag criada ainda
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {superTags.map((tag) => (
                                <div
                                    key={tag.id}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl",
                                        "bg-white/5 border border-white/10",
                                        "hover:bg-white/10 transition-colors"
                                    )}
                                >
                                    <div
                                        className="w-4 h-4 rounded-full shrink-0"
                                        style={{ backgroundColor: tag.color }}
                                    />

                                    {/* Nome e info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white truncate">
                                            #{tag.name}
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            {tag.fields.length} campo{tag.fields.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>

                                    {/* Ações */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => onEditTag?.(tag.id)}
                                            title="Editar tag"
                                            className={cn(
                                                "p-2 rounded-lg",
                                                "text-zinc-400 hover:text-violet-400",
                                                "hover:bg-violet-500/10 transition-colors"
                                            )}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTag(tag.id, tag.name)}
                                            title="Deletar tag"
                                            className={cn(
                                                "p-2 rounded-lg",
                                                "text-zinc-400 hover:text-red-400",
                                                "hover:bg-red-500/10 transition-colors"
                                            )}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer - Criar nova tag */}
                <div className="p-4 border-t border-white/10">
                    {isCreating ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Nome da nova tag..."
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateTag();
                                    if (e.key === 'Escape') setIsCreating(false);
                                }}
                                className={cn(
                                    "flex-1 px-3 py-2 rounded-lg text-sm",
                                    "bg-white/5 border border-white/10 text-white",
                                    "placeholder:text-zinc-600",
                                    "focus:outline-none focus:border-violet-500/50"
                                )}
                            />
                            <button
                                onClick={handleCreateTag}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium",
                                    "bg-violet-500/20 text-violet-400",
                                    "hover:bg-violet-500/30 transition-colors"
                                )}
                            >
                                Criar
                            </button>
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white"
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                                "bg-violet-500/10 border border-violet-500/20",
                                "text-violet-400 hover:text-violet-300 text-sm",
                                "hover:bg-violet-500/20 transition-colors"
                            )}
                        >
                            <Plus size={16} />
                            <span>Criar Nova Tag</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

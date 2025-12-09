'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Check, Tag, Settings } from 'lucide-react';
import { useGraphStore } from '@/lib/store/graphStore';
import { TagBadge } from './TagBadge';
import { TagManager } from './TagManager';
import { TagEditorModal } from './TagEditorModal';

// ============================================================================
// TAG SELECTOR - Dropdown para adicionar/remover tags de um nó
// ============================================================================

interface TagSelectorProps {
    nodeId: string;
    nodeTags: string[];
}

export function TagSelector({ nodeId, nodeTags }: TagSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [editingTagId, setEditingTagId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { superTags, addTagToNode, removeTagFromNode, createSuperTag } = useGraphStore();

    // Fecha ao clicar fora
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setIsCreating(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleToggleTag = (tagId: string) => {
        if (nodeTags.includes(tagId)) {
            removeTagFromNode(nodeId, tagId);
        } else {
            addTagToNode(nodeId, tagId);
        }
    };

    const handleCreateTag = () => {
        if (!newTagName.trim()) return;

        // Cores preset para novas tags
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

    // Tags aplicadas ao nó
    const appliedTags = superTags.filter((t) => nodeTags.includes(t.id));

    return (
        <div className="space-y-3">
            {/* Tags aplicadas */}
            <div className="flex flex-wrap gap-1.5">
                {appliedTags.map((tag) => (
                    <TagBadge
                        key={tag.id}
                        name={tag.name}
                        color={tag.color}
                        onRemove={() => removeTagFromNode(nodeId, tag.id)}
                    />
                ))}

                {/* Botão para abrir dropdown */}
                <div className="relative" ref={containerRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
                                   bg-white/5 border border-white/10 text-zinc-400
                                   hover:bg-white/10 hover:text-zinc-300 transition-colors"
                    >
                        <Plus size={12} />
                        <span>Tag</span>
                    </button>

                    {/* Botão Gerenciar Tags */}
                    <button
                        onClick={() => setIsManagerOpen(true)}
                        title="Gerenciar tags"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full
                                   bg-white/5 border border-white/10 text-zinc-400
                                   hover:bg-white/10 hover:text-zinc-300 transition-colors"
                    >
                        <Settings size={12} />
                    </button>

                    {/* Dropdown */}
                    {isOpen && (
                        <div className="absolute top-full left-0 mt-2 z-50 w-48
                                        bg-zinc-900 border border-white/10 rounded-xl
                                        shadow-xl shadow-black/50 overflow-hidden">

                            {/* Lista de tags disponíveis */}
                            <div className="max-h-48 overflow-y-auto p-1">
                                {superTags.length === 0 && !isCreating && (
                                    <div className="text-xs text-zinc-500 p-3 text-center">
                                        Nenhuma tag criada
                                    </div>
                                )}

                                {superTags.map((tag) => {
                                    const isApplied = nodeTags.includes(tag.id);
                                    return (
                                        <button
                                            key={tag.id}
                                            onClick={() => handleToggleTag(tag.id)}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                                                       hover:bg-white/5 transition-colors text-left"
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: tag.color }}
                                            />
                                            <span className="text-sm text-zinc-300 flex-1 truncate">
                                                {tag.name}
                                            </span>
                                            {isApplied && <Check size={14} className="text-green-400" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Criar nova tag */}
                            <div className="border-t border-white/10 p-2">
                                {isCreating ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newTagName}
                                            onChange={(e) => setNewTagName(e.target.value)}
                                            placeholder="Nome da tag..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg
                                                       px-2 py-1.5 text-sm text-white
                                                       focus:outline-none focus:border-violet-500/50"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleCreateTag();
                                                if (e.key === 'Escape') setIsCreating(false);
                                            }}
                                        />
                                        <button
                                            onClick={handleCreateTag}
                                            title="Criar tag"
                                            className="px-2 py-1.5 bg-violet-500/20 text-violet-400
                                                       rounded-lg hover:bg-violet-500/30 transition-colors"
                                        >
                                            <Check size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                                                   text-violet-400 hover:bg-violet-500/10 transition-colors"
                                    >
                                        <Tag size={14} />
                                        <span className="text-sm">Criar nova tag</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* TagManager Modal */}
            <TagManager
                isOpen={isManagerOpen}
                onClose={() => setIsManagerOpen(false)}
                onEditTag={(tagId) => {
                    setIsManagerOpen(false);
                    setEditingTagId(tagId);
                }}
            />

            {/* TagEditorModal */}
            <TagEditorModal
                tagId={editingTagId}
                isOpen={editingTagId !== null}
                onClose={() => setEditingTagId(null)}
            />
        </div>
    );
}

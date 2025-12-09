'use client';

import { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useGraphStore } from '@/lib/store/graphStore';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { TiptapEditor } from '@/components/editor';
import { TagSelector, PropertiesPanel } from '@/components/tags';
import { ConnectionsList } from './ConnectionsList';
import { cn } from '@/lib/utils';

// ============================================================================
// PROPERTY SIDEBAR - Painel flutuante de edição de nó
// Não bloqueia interação com o canvas
// ============================================================================

interface PropertySidebarProps {
    nodeId: string;
    onClose: () => void;
    onSelectNode?: (nodeId: string) => void;
}

export function PropertySidebar({ nodeId, onClose, onSelectNode }: PropertySidebarProps) {
    const { nodes, updateNode, deleteNode } = useGraphStore();
    const node = nodes.find((n) => n.id === nodeId);

    // Estado local para edição do título
    const [title, setTitle] = useState(node?.title ?? '');

    // Se nó não existe mais, fecha
    useEffect(() => {
        if (!node) {
            onClose();
        }
    }, [node, onClose]);

    if (!node) return null;

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        updateNode(nodeId, { title: newTitle });
    };

    const handleContentChange = (newContent: string) => {
        // Debounce já está no TiptapEditor
        updateNode(nodeId, { content: newContent });
    };

    const handleColorChange = (newColor: string) => {
        updateNode(nodeId, { color: newColor });
    };

    const handleDelete = () => {
        deleteNode(nodeId);
        onClose();
    };

    return (
        // Sidebar flutuante - SEM backdrop, permite interação com canvas
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
            // Impede que cliques na sidebar propaguem para o canvas
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header com Título */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3 flex-1">
                    <ColorPicker
                        value={node.color}
                        onChange={handleColorChange}
                    />
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Nome do nó..."
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

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Notas - Editor Rich Text */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Notas
                    </label>
                    <TiptapEditor
                        content={node.content ?? ''}
                        onChange={handleContentChange}
                        placeholder="Adicione notas ou descrição..."
                        currentNodeId={nodeId}
                        onNavigateToNode={onSelectNode}
                    />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Tags
                    </label>
                    <TagSelector nodeId={nodeId} nodeTags={node.tags ?? []} />
                </div>

                {/* Propriedades (campos herdados das tags) */}
                <PropertiesPanel nodeId={nodeId} nodeTags={node.tags ?? []} />

                {/* Conexões */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Conexões
                    </label>
                    <ConnectionsList
                        nodeId={nodeId}
                        nodeContent={node.content ?? ''}
                        onInsertWikiLink={(targetId, targetTitle) => {
                            const wikiLinkHtml = `<span class="wiki-link" data-wiki-link="" data-node-id="${targetId}">${targetTitle}</span> `;
                            const newContent = (node.content ?? '') + wikiLinkHtml;
                            updateNode(nodeId, { content: newContent });
                        }}
                    />
                </div>

                {/* Metadata */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Info
                    </label>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">ID</span>
                            <span className="text-zinc-400 font-mono">
                                {node.id.slice(0, 8)}...
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Posição</span>
                            <span className="text-zinc-400">
                                {Math.round(node.x)}, {Math.round(node.y)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={handleDelete}
                    title="Excluir nó"
                    className={cn(
                        "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                        "bg-red-500/10 border border-red-500/20",
                        "text-red-400 hover:text-red-300 text-sm",
                        "hover:bg-red-500/20 hover:border-red-500/30",
                        "transition-all duration-200"
                    )}
                >
                    <Trash2 size={16} />
                    <span>Excluir Nó</span>
                </button>
            </div>
        </div>
    );
}

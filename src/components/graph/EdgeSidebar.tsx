'use client';

import { useEffect, useState } from 'react';
import { X, Trash2, ArrowLeftRight } from 'lucide-react';
import { useGraphStore } from '@/lib/store/graphStore';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { TiptapEditor } from '@/components/editor';
import { cn } from '@/lib/utils';

// ============================================================================
// EDGE SIDEBAR - Painel flutuante de edição de edge
// Similar ao PropertySidebar, mas para conexões
// ============================================================================

interface EdgeSidebarProps {
    edgeId: string;
    onClose: () => void;
    onSelectNode?: (nodeId: string) => void;
}

export function EdgeSidebar({ edgeId, onClose, onSelectNode }: EdgeSidebarProps) {
    const { edges, nodes, updateEdge, deleteEdge, invertEdgeDirection } = useGraphStore();
    const edge = edges.find((e) => e.id === edgeId);

    // Estados locais para edição
    const [label, setLabel] = useState(edge?.label ?? '');

    // Se edge não existe mais, fecha
    useEffect(() => {
        if (!edge) {
            onClose();
        }
    }, [edge, onClose]);

    if (!edge) return null;

    // Busca nomes dos nós source/target
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    const handleLabelChange = (newLabel: string) => {
        setLabel(newLabel);
        updateEdge(edgeId, { label: newLabel || undefined });
    };

    const handleColorChange = (newColor: string) => {
        updateEdge(edgeId, { color: newColor });
    };

    const handleContentChange = (newContent: string) => {
        updateEdge(edgeId, { content: newContent });
    };

    const handleStyleChange = (newStyle: 'solid' | 'dashed') => {
        updateEdge(edgeId, { style: newStyle });
    };

    const handleInvertDirection = () => {
        invertEdgeDirection(edgeId);
    };

    const handleDelete = () => {
        deleteEdge(edgeId);
        onClose();
    };

    return (
        <div
            className={cn(
                "fixed right-4 top-20 bottom-4 w-[340px] z-40",
                "flex flex-col",
                "bg-zinc-900/90 backdrop-blur-xl",
                "border border-white/10 rounded-2xl",
                "shadow-2xl shadow-black/50",
                "animate-in slide-in-from-right duration-300"
            )}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header com ColorPicker e Nome editável */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3 flex-1">
                    <ColorPicker
                        value={edge.color || '#8b5cf6'}
                        onChange={handleColorChange}
                    />
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => handleLabelChange(e.target.value)}
                        placeholder="Nome da conexão..."
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
                        content={edge.content ?? ''}
                        onChange={handleContentChange}
                        placeholder="Adicione notas sobre esta conexão..."
                        onNavigateToNode={onSelectNode}
                    />
                </div>

                {/* Estilo */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Estilo da Linha
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleStyleChange('solid')}
                            className={cn(
                                "flex-1 px-3 py-2 rounded-xl text-sm font-medium",
                                "border transition-all duration-200",
                                edge.style !== 'dashed'
                                    ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                                    : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                            )}
                        >
                            ─── Sólida
                        </button>
                        <button
                            onClick={() => handleStyleChange('dashed')}
                            className={cn(
                                "flex-1 px-3 py-2 rounded-xl text-sm font-medium",
                                "border transition-all duration-200",
                                edge.style === 'dashed'
                                    ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                                    : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                            )}
                        >
                            - - - Tracejada
                        </button>
                    </div>
                </div>

                {/* Inverter Direção */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Direção
                    </label>
                    <button
                        onClick={handleInvertDirection}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                            "bg-white/5 border border-white/10",
                            "text-zinc-300 hover:text-white text-sm",
                            "hover:bg-white/10 hover:border-white/20",
                            "transition-all duration-200"
                        )}
                    >
                        <ArrowLeftRight size={16} />
                        <span>Inverter Direção</span>
                    </button>
                </div>

                {/* Info - Source/Target */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Conexão
                    </label>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-500">De:</span>
                            <span className="text-zinc-200 font-medium truncate flex-1">
                                {sourceNode?.title || 'Desconhecido'}
                            </span>
                        </div>
                        <div className="flex justify-center text-zinc-600">
                            ↓
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-500">Para:</span>
                            <span className="text-zinc-200 font-medium truncate flex-1">
                                {targetNode?.title || 'Desconhecido'}
                            </span>
                        </div>
                    </div>
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
                                {edge.id.slice(0, 8)}...
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={handleDelete}
                    title="Excluir conexão"
                    className={cn(
                        "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                        "bg-red-500/10 border border-red-500/20",
                        "text-red-400 hover:text-red-300 text-sm",
                        "hover:bg-red-500/20 hover:border-red-500/30",
                        "transition-all duration-200"
                    )}
                >
                    <Trash2 size={16} />
                    <span>Excluir Conexão</span>
                </button>
            </div>
        </div>
    );
}

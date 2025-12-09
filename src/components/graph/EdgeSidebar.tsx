'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useEdge } from '@/lib/hooks';
import { EntitySidebar, SidebarSection, InfoPanel } from '@/components/ui/EntitySidebar';
import { TiptapEditor } from '@/components/editor';
import { cn } from '@/lib/utils';

// ============================================================================
// EDGE SIDEBAR - Painel flutuante de edição de edge
// Usa EntitySidebar como base
// ============================================================================

interface EdgeSidebarProps {
    edgeId: string;
    onClose: () => void;
    onSelectNode?: (nodeId: string) => void;
}

export function EdgeSidebar({ edgeId, onClose, onSelectNode }: EdgeSidebarProps) {
    const {
        edge,
        exists,
        sourceNode,
        targetNode,
        updateLabel,
        updateColor,
        updateContent,
        updateStyle,
        invertDirection,
        remove,
    } = useEdge(edgeId);

    const [label, setLabel] = useState(edge?.label ?? '');

    useEffect(() => {
        if (edge?.label !== undefined && edge.label !== label) {
            setLabel(edge.label ?? '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edge?.label]);

    useEffect(() => {
        if (!exists) {
            onClose();
        }
    }, [exists, onClose]);

    if (!edge) return null;

    const handleLabelChange = (newLabel: string) => {
        setLabel(newLabel);
        updateLabel(newLabel || '');
    };

    const handleDelete = () => {
        remove();
        onClose();
    };

    return (
        <EntitySidebar
            title={label}
            onTitleChange={handleLabelChange}
            color={edge.color || '#8b5cf6'}
            onColorChange={updateColor}
            onClose={onClose}
            onDelete={handleDelete}
            titlePlaceholder="Nome da conexão..."
            deleteButtonText="Excluir Conexão"
        >
            {/* Notas */}
            <SidebarSection label="Notas">
                <TiptapEditor
                    content={edge.content ?? ''}
                    onChange={updateContent}
                    placeholder="Adicione notas sobre esta conexão..."
                    onNavigateToNode={onSelectNode}
                />
            </SidebarSection>

            {/* Estilo */}
            <SidebarSection label="Estilo da Linha">
                <div className="flex gap-2">
                    <button
                        onClick={() => updateStyle('solid')}
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
                        onClick={() => updateStyle('dashed')}
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
            </SidebarSection>

            {/* Direção */}
            <SidebarSection label="Direção">
                <button
                    onClick={invertDirection}
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
            </SidebarSection>

            {/* Conexão */}
            <SidebarSection label="Conexão">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-zinc-500">De:</span>
                        <span className="text-zinc-200 font-medium truncate flex-1">
                            {sourceNode?.title || 'Desconhecido'}
                        </span>
                    </div>
                    <div className="flex justify-center text-zinc-600">↓</div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-zinc-500">Para:</span>
                        <span className="text-zinc-200 font-medium truncate flex-1">
                            {targetNode?.title || 'Desconhecido'}
                        </span>
                    </div>
                </div>
            </SidebarSection>

            {/* Info */}
            <SidebarSection label="Info">
                <InfoPanel
                    items={[
                        { label: 'ID', value: <span className="font-mono">{edge.id.slice(0, 8)}...</span> },
                    ]}
                />
            </SidebarSection>
        </EntitySidebar>
    );
}

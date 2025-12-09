'use client';

import { ArrowRight, ArrowLeft, Link2, Plus } from 'lucide-react';
import { useGraphStore } from '@/lib/store/graphStore';
import { extractWikiLinksFromHtml } from '@/lib/hooks/useWikiLinkSync';

// ============================================================================
// CONNECTIONS LIST - Lista de conexões (edges) de um nó
// Mostra conexões de entrada e saída, permite inserir WikiLinks no texto
// ============================================================================

interface ConnectionsListProps {
    nodeId: string;
    nodeContent: string;
    onInsertWikiLink?: (targetNodeId: string, targetTitle: string) => void;
}

export function ConnectionsList({ nodeId, nodeContent, onInsertWikiLink }: ConnectionsListProps) {
    const nodes = useGraphStore((state) => state.nodes);
    const getNodeConnections = useGraphStore((state) => state.getNodeConnections);

    const connections = getNodeConnections(nodeId);

    // Extrai WikiLinks já presentes no texto
    const existingWikiLinks = extractWikiLinksFromHtml(nodeContent);

    // Helper para obter título do nó
    const getNodeTitle = (id: string) => {
        const node = nodes.find(n => n.id === id);
        return node?.title ?? 'Nó não encontrado';
    };

    // Verifica se WikiLink já existe no texto
    const hasWikiLink = (targetId: string) => existingWikiLinks.includes(targetId);

    // Sem conexões
    if (connections.all.length === 0) {
        return (
            <div className="text-xs text-zinc-500 italic py-2">
                Nenhuma conexão
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Conexões de Saída (este nó → outros) */}
            {connections.outgoing.length > 0 && (
                <div className="space-y-1">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <ArrowRight size={10} />
                        Saída
                    </div>
                    <div className="space-y-1">
                        {connections.outgoing.map((edge) => (
                            <ConnectionItem
                                key={edge.id}
                                targetId={edge.target}
                                title={getNodeTitle(edge.target)}
                                hasWikiLink={hasWikiLink(edge.target)}
                                onInsert={onInsertWikiLink}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Conexões de Entrada (outros → este nó) */}
            {connections.incoming.length > 0 && (
                <div className="space-y-1">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <ArrowLeft size={10} />
                        Entrada
                    </div>
                    <div className="space-y-1">
                        {connections.incoming.map((edge) => (
                            <ConnectionItem
                                key={edge.id}
                                targetId={edge.source}
                                title={getNodeTitle(edge.source)}
                                hasWikiLink={hasWikiLink(edge.source)}
                                onInsert={onInsertWikiLink}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// CONNECTION ITEM - Item individual de conexão
// ============================================================================

interface ConnectionItemProps {
    targetId: string;
    title: string;
    hasWikiLink: boolean;
    onInsert?: (targetId: string, title: string) => void;
}

function ConnectionItem({ targetId, title, hasWikiLink, onInsert }: ConnectionItemProps) {
    return (
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-zinc-800/50 hover:bg-zinc-800 transition-colors group">
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <Link2 size={12} className="text-violet-400 shrink-0" />
                <span className="text-sm text-zinc-300 truncate">{title}</span>
            </div>

            {hasWikiLink ? (
                <span className="text-[10px] text-emerald-400 shrink-0">
                    ✓ no texto
                </span>
            ) : (
                <button
                    onClick={() => onInsert?.(targetId, title)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-violet-500/20"
                    title={`Inserir [[${title}]] no texto`}
                >
                    <Plus size={12} className="text-violet-400" />
                </button>
            )}
        </div>
    );
}

'use client';

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useGraphStore } from '@/lib/store/graphStore';

// ============================================================================
// WIKILINK NODE VIEW - Renderização dinâmica de WikiLinks
// Resolve título do nó via store, atualiza quando nó é renomeado
// ============================================================================

export function WikiLinkNodeView({ node }: NodeViewProps) {
    const { nodeId, title: fallbackTitle, isGhost } = node.attrs as {
        nodeId: string;
        title?: string;
        isGhost: boolean;
    };

    const nodes = useGraphStore((state) => state.nodes);

    // Resolve título dinamicamente
    const targetNode = nodes.find(n => n.id === nodeId);

    // Determina título e estado ghost
    let displayTitle: string;
    let isActuallyGhost = isGhost;

    if (nodeId && targetNode) {
        // Nó existe - usa título atual
        displayTitle = targetNode.title;
        isActuallyGhost = false;
    } else if (nodeId && !targetNode) {
        // Nó foi deletado - vira ghost
        displayTitle = fallbackTitle || 'Nó deletado';
        isActuallyGhost = true;
    } else {
        // Ghost original (sem nodeId)
        displayTitle = fallbackTitle || 'Novo nó';
        isActuallyGhost = true;
    }

    const className = isActuallyGhost
        ? 'wiki-link wiki-link-ghost'
        : 'wiki-link';

    return (
        <NodeViewWrapper
            as="span"
            className={className}
            data-wiki-link=""
            data-node-id={nodeId || ''}
            data-ghost={isActuallyGhost ? 'true' : undefined}
        >
            {displayTitle}
        </NodeViewWrapper>
    );
}

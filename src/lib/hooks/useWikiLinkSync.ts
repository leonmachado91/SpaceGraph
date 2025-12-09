import { useCallback } from 'react';
import { useGraphStore } from '@/lib/store/graphStore';
import type { GraphNode } from '@/types/graph';

// ============================================================================
// WIKILINK SYNC HOOK - Utilitários para sincronização WikiLinks ↔ Edges
// ============================================================================

/**
 * Extrai todos os nodeIds de WikiLinks presentes no HTML
 * @param html - Conteúdo HTML do editor
 * @returns Array de nodeIds encontrados
 */
export function extractWikiLinksFromHtml(html: string): string[] {
    if (!html) return [];

    const nodeIds: string[] = [];

    // Regex para encontrar data-node-id em spans de WikiLink
    const regex = /data-node-id="([^"]+)"/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
        const nodeId = match[1];
        // Ignora nodeIds vazios (ghosts ainda não criados)
        if (nodeId && nodeId.trim() !== '') {
            nodeIds.push(nodeId);
        }
    }

    // Remove duplicatas
    return [...new Set(nodeIds)];
}

/**
 * Resolve o título de um WikiLink dado seu nodeId
 * @param nodeId - ID do nó referenciado
 * @param nodes - Array de nós do store
 * @returns Objeto com título e flag isGhost
 */
export function resolveWikiLinkTitle(
    nodeId: string,
    nodes: GraphNode[]
): { title: string; isGhost: boolean } {
    const node = nodes.find(n => n.id === nodeId);

    if (node) {
        return {
            title: node.title,
            isGhost: false,
        };
    }

    // Nó não existe - é ghost
    return {
        title: 'Nó não encontrado',
        isGhost: true,
    };
}

/**
 * Hook para sincronização de WikiLinks
 */
export function useWikiLinkSync() {
    const nodes = useGraphStore((state) => state.nodes);
    const edges = useGraphStore((state) => state.edges);
    const addEdge = useGraphStore((state) => state.addEdge);

    /**
     * Retorna conexões de entrada e saída de um nó
     */
    const getNodeConnections = useCallback((nodeId: string) => {
        const outgoing = edges.filter(e => e.source === nodeId);
        const incoming = edges.filter(e => e.target === nodeId);

        return {
            outgoing, // Edges que saem deste nó
            incoming, // Edges que chegam neste nó
            all: [...outgoing, ...incoming],
        };
    }, [edges]);

    /**
     * Sincroniza edges baseado no conteúdo HTML do nó
     * - Cria edges para WikiLinks que não têm edge correspondente
     * - Remove edges cujos WikiLinks foram deletados
     */
    const syncEdgesFromContent = useCallback((nodeId: string, content: string, systemId: string) => {
        // Extrai WikiLinks do conteúdo
        const wikiLinkTargets = extractWikiLinksFromHtml(content);

        // Pega edges atuais deste nó (apenas outgoing - WikiLinks são unidirecionais)
        const currentEdges = edges.filter(e => e.source === nodeId);
        const currentTargets = currentEdges.map(e => e.target);

        // Edges a criar: WikiLinks sem edge correspondente
        const toCreate = wikiLinkTargets.filter(target => !currentTargets.includes(target));

        // Edges a deletar: edges sem WikiLink correspondente
        // NOTA: Apenas edges que foram criadas por WikiLinks (não edges manuais)
        // Por enquanto, não deletamos automaticamente para não quebrar edges manuais
        // TODO: Adicionar flag para distinguir edges de WikiLink de edges manuais

        // Cria novas edges
        toCreate.forEach(targetId => {
            // Evita criar edge para si mesmo
            if (targetId !== nodeId) {
                addEdge({
                    source: nodeId,
                    target: targetId,
                    systemId,
                });
            }
        });

        return {
            created: toCreate.length,
            wikiLinkTargets,
            currentTargets,
        };
    }, [edges, addEdge]);

    /**
     * Resolve título de um WikiLink
     */
    const resolveTitle = useCallback((nodeId: string) => {
        return resolveWikiLinkTitle(nodeId, nodes);
    }, [nodes]);

    return {
        extractWikiLinksFromHtml,
        resolveWikiLinkTitle: resolveTitle,
        getNodeConnections,
        syncEdgesFromContent,
    };
}

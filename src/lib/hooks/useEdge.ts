import { useCallback, useMemo } from 'react';
import { useGraphStore } from '@/lib/store/graphStore';
import { GraphEdge, EdgeStyle } from '@/types/graph';

// ============================================================================
// USE EDGE - Hook para manipular uma edge específica
// ============================================================================
// Encapsula a lógica de acesso e modificação de uma edge (conexão).
// ============================================================================

interface UseEdgeReturn {
    /** A edge atual, ou undefined se não existir */
    edge: GraphEdge | undefined;
    /** Se a edge existe */
    exists: boolean;
    /** Nó de origem */
    sourceNode: { id: string; title: string } | undefined;
    /** Nó de destino */
    targetNode: { id: string; title: string } | undefined;
    /** Atualiza o label da edge */
    updateLabel: (label: string) => void;
    /** Atualiza a cor da edge */
    updateColor: (color: string) => void;
    /** Atualiza o conteúdo (notas) da edge */
    updateContent: (content: string) => void;
    /** Atualiza o estilo (solid/dashed) */
    updateStyle: (style: EdgeStyle) => void;
    /** Atualiza múltiplas propriedades de uma vez */
    update: (updates: Partial<GraphEdge>) => void;
    /** Inverte a direção da edge (source <-> target) */
    invertDirection: () => void;
    /** Remove a edge */
    remove: () => void;
}

/**
 * Hook para acessar e manipular uma edge específica do grafo.
 */
export function useEdge(edgeId: string): UseEdgeReturn {
    // Selector otimizado para a edge específica
    const edge = useGraphStore(
        useCallback(
            (state) => state.edges.find((e) => e.id === edgeId),
            [edgeId]
        )
    );

    // Busca source e target IDs da edge (valores primitivos, não objetos)
    const sourceId = edge?.source;
    const targetId = edge?.target;

    // Selector separado para o nome do source (retorna primitivo)
    const sourceTitle = useGraphStore(
        useCallback(
            (state) => {
                if (!sourceId) return undefined;
                return state.nodes.find((n) => n.id === sourceId)?.title;
            },
            [sourceId]
        )
    );

    // Selector separado para o nome do target (retorna primitivo)
    const targetTitle = useGraphStore(
        useCallback(
            (state) => {
                if (!targetId) return undefined;
                return state.nodes.find((n) => n.id === targetId)?.title;
            },
            [targetId]
        )
    );

    // Monta os objetos sourceNode e targetNode de forma memoizada
    const sourceNode = useMemo(
        () => (sourceId && sourceTitle ? { id: sourceId, title: sourceTitle } : undefined),
        [sourceId, sourceTitle]
    );

    const targetNode = useMemo(
        () => (targetId && targetTitle ? { id: targetId, title: targetTitle } : undefined),
        [targetId, targetTitle]
    );

    // Pega as actions uma vez (getState não causa re-render)
    const updateEdge = useGraphStore.getState().updateEdge;
    const deleteEdge = useGraphStore.getState().deleteEdge;
    const invertEdgeDirection = useGraphStore.getState().invertEdgeDirection;

    // Memoiza callbacks
    const updateLabel = useCallback(
        (label: string) => updateEdge(edgeId, { label }),
        [edgeId, updateEdge]
    );

    const updateColor = useCallback(
        (color: string) => updateEdge(edgeId, { color }),
        [edgeId, updateEdge]
    );

    const updateContent = useCallback(
        (content: string) => updateEdge(edgeId, { content }),
        [edgeId, updateEdge]
    );

    const updateStyle = useCallback(
        (style: EdgeStyle) => updateEdge(edgeId, { style }),
        [edgeId, updateEdge]
    );

    const update = useCallback(
        (updates: Partial<GraphEdge>) => updateEdge(edgeId, updates),
        [edgeId, updateEdge]
    );

    const invertDir = useCallback(
        () => invertEdgeDirection(edgeId),
        [edgeId, invertEdgeDirection]
    );

    const remove = useCallback(
        () => deleteEdge(edgeId),
        [edgeId, deleteEdge]
    );

    return useMemo(
        () => ({
            edge,
            exists: !!edge,
            sourceNode,
            targetNode,
            updateLabel,
            updateColor,
            updateContent,
            updateStyle,
            update,
            invertDirection: invertDir,
            remove,
        }),
        [
            edge,
            sourceNode,
            targetNode,
            updateLabel,
            updateColor,
            updateContent,
            updateStyle,
            update,
            invertDir,
            remove,
        ]
    );
}

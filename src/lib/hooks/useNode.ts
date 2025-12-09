import { useCallback, useMemo } from 'react';
import { useGraphStore } from '@/lib/store/graphStore';
import { GraphNode } from '@/types/graph';

// ============================================================================
// USE NODE - Hook para manipular um nó específico
// ============================================================================
// Encapsula a lógica de acesso e modificação de um nó, evitando que
// componentes precisem conhecer a estrutura interna do store.
// ============================================================================

interface UseNodeReturn {
    /** O nó atual, ou undefined se não existir */
    node: GraphNode | undefined;
    /** Se o nó existe */
    exists: boolean;
    /** Atualiza o título do nó */
    updateTitle: (title: string) => void;
    /** Atualiza a cor do nó */
    updateColor: (color: string) => void;
    /** Atualiza o conteúdo (notas) do nó */
    updateContent: (content: string) => void;
    /** Atualiza o ícone do nó */
    updateIcon: (icon: string) => void;
    /** Atualiza múltiplas propriedades de uma vez */
    update: (updates: Partial<GraphNode>) => void;
    /** Remove o nó e todas as suas conexões */
    remove: () => void;
    /** Adiciona uma tag ao nó */
    addTag: (tagId: string) => void;
    /** Remove uma tag do nó */
    removeTag: (tagId: string) => void;
    /** Atualiza uma propriedade específica (de SuperTag) */
    updateProperty: (key: string, value: unknown) => void;
}

/**
 * Hook para acessar e manipular um nó específico do grafo.
 * 
 * @example
 * ```tsx
 * function NodeEditor({ nodeId }: { nodeId: string }) {
 *   const { node, updateTitle, updateColor, remove } = useNode(nodeId);
 *   
 *   if (!node) return <div>Nó não encontrado</div>;
 *   
 *   return (
 *     <input 
 *       value={node.title} 
 *       onChange={e => updateTitle(e.target.value)} 
 *     />
 *   );
 * }
 * ```
 */
export function useNode(nodeId: string): UseNodeReturn {
    // Selector otimizado: só re-renderiza quando o nó específico muda
    const node = useGraphStore(
        useCallback(
            (state) => state.nodes.find((n) => n.id === nodeId),
            [nodeId]
        )
    );

    // Pega as actions uma vez (não muda)
    const {
        updateNode,
        deleteNode,
        addTagToNode,
        removeTagFromNode,
        updateNodeProperty,
    } = useGraphStore.getState();

    // Memoiza callbacks para evitar re-renders desnecessários
    const updateTitle = useCallback(
        (title: string) => updateNode(nodeId, { title }),
        [nodeId, updateNode]
    );

    const updateColor = useCallback(
        (color: string) => updateNode(nodeId, { color }),
        [nodeId, updateNode]
    );

    const updateContent = useCallback(
        (content: string) => updateNode(nodeId, { content }),
        [nodeId, updateNode]
    );

    const updateIcon = useCallback(
        (icon: string) => updateNode(nodeId, { icon }),
        [nodeId, updateNode]
    );

    const update = useCallback(
        (updates: Partial<GraphNode>) => updateNode(nodeId, updates),
        [nodeId, updateNode]
    );

    const remove = useCallback(
        () => deleteNode(nodeId),
        [nodeId, deleteNode]
    );

    const addTag = useCallback(
        (tagId: string) => addTagToNode(nodeId, tagId),
        [nodeId, addTagToNode]
    );

    const removeTag = useCallback(
        (tagId: string) => removeTagFromNode(nodeId, tagId),
        [nodeId, removeTagFromNode]
    );

    const updateProperty = useCallback(
        (key: string, value: unknown) => updateNodeProperty(nodeId, key, value),
        [nodeId, updateNodeProperty]
    );

    return useMemo(
        () => ({
            node,
            exists: !!node,
            updateTitle,
            updateColor,
            updateContent,
            updateIcon,
            update,
            remove,
            addTag,
            removeTag,
            updateProperty,
        }),
        [
            node,
            updateTitle,
            updateColor,
            updateContent,
            updateIcon,
            update,
            remove,
            addTag,
            removeTag,
            updateProperty,
        ]
    );
}

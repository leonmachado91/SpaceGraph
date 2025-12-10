import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MockGraphService } from '@/lib/services/MockGraphService';
import { useGraphStore } from '@/lib/store/graphStore';

// ============================================================================
// LOAD GRAPH HOOK - Fetches data from the service and hydrates the store
// ============================================================================

// Singleton mock service
const graphService = new MockGraphService();

export function useLoadGraph(systemId: string) {
    const { setNodes, setEdges } = useGraphStore();

    // Avoid overwriting data restored from localStorage
    const initialState = useGraphStore.getState();
    const hasLocalData = initialState.nodes.length > 0 || initialState.edges.length > 0;

    const query = useQuery({
        queryKey: ['graph', systemId],
        queryFn: () => graphService.getGraph(systemId),
        staleTime: 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus: false,
        enabled: !!systemId && !hasLocalData, // only fetch if we have no local data
    });

    // When data arrives, populate the store if nothing is persisted
    useEffect(() => {
        if (query.data) {
            const state = useGraphStore.getState();
            const alreadyHasData = state.nodes.length > 0 || state.edges.length > 0;
            if (!alreadyHasData) {
                setNodes(query.data.nodes);
                setEdges(query.data.edges);
            }
        }
    }, [query.data, setNodes, setEdges]);

    return {
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
}

// Exporta serviço para uso em mutations
export { graphService };

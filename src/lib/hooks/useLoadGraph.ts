import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MockGraphService } from '@/lib/services/MockGraphService';
import { useGraphStore } from '@/lib/store/graphStore';

// ============================================================================
// LOAD GRAPH HOOK - Carrega dados do serviço e popula o store
// ============================================================================

// Instância singleton do serviço Mock
const graphService = new MockGraphService();

export function useLoadGraph(systemId: string) {
    const { setNodes, setEdges } = useGraphStore();

    const query = useQuery({
        queryKey: ['graph', systemId],
        queryFn: () => graphService.getGraph(systemId),
        staleTime: 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus: false,
        enabled: !!systemId, // Só executa se systemId não for vazio
    });

    // Quando dados chegam, popula o store
    useEffect(() => {
        if (query.data) {
            setNodes(query.data.nodes);
            setEdges(query.data.edges);
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

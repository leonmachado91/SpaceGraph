import { Node, Edge } from '@xyflow/react';
import { GraphNode, GraphEdge } from '@/types/graph';

// ============================================================================
// ADAPTERS - Converte entre tipos do domínio (GraphNode/Edge) e React Flow
// ============================================================================

/**
 * Converte um GraphNode do nosso domínio para o formato do React Flow
 */
export function toReactFlowNode(graphNode: GraphNode): Node {
    return {
        id: graphNode.id,
        type: 'orb', // nosso custom node type
        position: {
            x: graphNode.x,
            y: graphNode.y,
        },
        data: {
            title: graphNode.title,
            color: graphNode.color,
            icon: graphNode.icon,
            nodeType: graphNode.type,
            tags: graphNode.tags || [], // IDs das tags para LOD
        },
    };
}

/**
 * Converte uma lista de GraphNodes para React Flow Nodes
 */
export function toReactFlowNodes(graphNodes: GraphNode[]): Node[] {
    return graphNodes.map(toReactFlowNode);
}

/**
 * Converte um GraphEdge do nosso domínio para o formato do React Flow
 */
export function toReactFlowEdge(graphEdge: GraphEdge): Edge {
    const edgeColor = graphEdge.color || '#8b5cf6'; // Violet padrão

    return {
        id: graphEdge.id,
        source: graphEdge.source,
        target: graphEdge.target,
        type: 'default',
        // Área clicável invisível maior para facilitar seleção
        interactionWidth: 40,
        // Permite foco e seleção explicitamente
        focusable: true,
        selectable: true,
        data: {
            color: edgeColor,
            style: graphEdge.style || 'solid',
            label: graphEdge.label,
        },
    };
}

/**
 * Converte uma lista de GraphEdges para React Flow Edges
 */
export function toReactFlowEdges(graphEdges: GraphEdge[]): Edge[] {
    return graphEdges.map(toReactFlowEdge);
}

/**
 * Extrai posição de um React Flow Node para atualizar nosso domínio
 */
export function fromReactFlowPosition(rfNode: Node): { x: number; y: number } {
    return {
        x: rfNode.position.x,
        y: rfNode.position.y,
    };
}

/**
 * Cria um GraphNode a partir de dados mínimos (para criação via double-click)
 */
export function createGraphNode(
    x: number,
    y: number,
    systemId: string,
    title: string = 'New Node'
): Omit<GraphNode, 'id'> {
    return {
        title,
        type: 'default',
        x,
        y,
        color: '#6366f1', // indigo por padrão
        systemId,
    };
}

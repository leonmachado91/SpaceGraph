import { GraphData, GraphEdge, GraphNode } from "@/types/graph";

export interface GraphService {
    getGraph(systemId: string): Promise<GraphData>;
    createNode(node: Omit<GraphNode, 'id'>): Promise<GraphNode>;
    updateNode(id: string, updates: Partial<GraphNode>): Promise<GraphNode>;
    deleteNode(id: string): Promise<void>;
    createEdge(edge: Omit<GraphEdge, 'id'>): Promise<GraphEdge>;
    deleteEdge(id: string): Promise<void>;
}

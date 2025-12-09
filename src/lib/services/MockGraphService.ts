import { GraphData, GraphEdge, GraphNode } from "@/types/graph";
import { GraphService } from "./GraphService";

const MOCK_SYSTEM_ID = 'system-1';

const INITIAL_NODES: GraphNode[] = [
    { id: '1', title: 'Big Bang', type: 'default', x: 0, y: 0, color: '#3b82f6', systemId: MOCK_SYSTEM_ID },
    { id: '2', title: 'Stars', type: 'default', x: 200, y: 100, color: '#8b5cf6', systemId: MOCK_SYSTEM_ID },
    { id: '3', title: 'Galaxies', type: 'default', x: -200, y: 100, color: '#f43f5e', systemId: MOCK_SYSTEM_ID },
    { id: '4', title: 'Black Holes', type: 'default', x: 0, y: 200, color: '#10b981', systemId: MOCK_SYSTEM_ID },
    { id: '5', title: 'Dark Matter', type: 'default', x: 0, y: -200, color: '#f59e0b', systemId: MOCK_SYSTEM_ID },
];

const INITIAL_EDGES: GraphEdge[] = [
    { id: 'e1-2', source: '1', target: '2', systemId: MOCK_SYSTEM_ID },
    { id: 'e1-3', source: '1', target: '3', systemId: MOCK_SYSTEM_ID },
    { id: 'e2-4', source: '2', target: '4', systemId: MOCK_SYSTEM_ID },
    { id: 'e3-5', source: '3', target: '5', systemId: MOCK_SYSTEM_ID },
];

export class MockGraphService implements GraphService {
    private nodes: GraphNode[] = [...INITIAL_NODES];
    private edges: GraphEdge[] = [...INITIAL_EDGES];

    async getGraph(systemId: string): Promise<GraphData> {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            nodes: this.nodes.filter(n => n.systemId === systemId),
            edges: this.edges.filter(e => e.systemId === systemId),
        };
    }

    async createNode(node: Omit<GraphNode, 'id'>): Promise<GraphNode> {
        const newNode: GraphNode = {
            ...node,
            id: crypto.randomUUID(),
        };
        this.nodes.push(newNode);
        return newNode;
    }

    async updateNode(id: string, updates: Partial<GraphNode>): Promise<GraphNode> {
        const index = this.nodes.findIndex(n => n.id === id);
        if (index === -1) throw new Error('Node not found');

        this.nodes[index] = { ...this.nodes[index], ...updates };
        return this.nodes[index];
    }

    async deleteNode(id: string): Promise<void> {
        this.nodes = this.nodes.filter(n => n.id !== id);
        this.edges = this.edges.filter(e => e.source !== id && e.target !== id);
    }

    async createEdge(edge: Omit<GraphEdge, 'id'>): Promise<GraphEdge> {
        const newEdge: GraphEdge = {
            ...edge,
            id: crypto.randomUUID(),
        };
        this.edges.push(newEdge);
        return newEdge;
    }

    async deleteEdge(id: string): Promise<void> {
        this.edges = this.edges.filter(e => e.id !== id);
    }
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GraphNode, GraphEdge, SuperTag } from '@/types/graph';
import { PHYSICS } from '@/lib/constants';

// ============================================================================
// GRAPH STORE v2.1 - Fonte Única de Verdade para o NeoGraph
// ============================================================================
// Este store centraliza:
// - Dados do grafo (nodes, edges)
// - Configurações de física e visualização
// - Estado de interação (seleção, dragging)
// - Histórico para Undo/Redo
// - Persistência Local (localStorage)
// ============================================================================

// Tipo para snapshot do histórico
interface GraphSnapshot {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

interface GraphState {
    // === Dados do Grafo ===
    nodes: GraphNode[];
    edges: GraphEdge[];
    superTags: SuperTag[];
    currentSystemId: string;

    // === Histórico (Undo/Redo) ===
    history: GraphSnapshot[];
    future: GraphSnapshot[];

    // === Configurações de Física ===
    physicsEnabled: boolean;
    repulsionStrength: number;
    linkDistance: number;
    collisionRadius: number;
    // Advanced Physics
    centerStrength: number;
    axisStrength: number;
    densityGenericFactor: number;
    densityChargeFactor: number;
    densityMaxSize: number;

    // === Configurações Visuais ===
    showGrid: boolean;

    // === Estado de Interação ===
    selectedNodeIds: Set<string>;
    selectedEdgeId: string | null;
    isDragging: boolean;

    // === Busca (Spotlight) ===
    searchQuery: string;
    highlightedNodeIds: string[];
}

interface GraphActions {
    // === Node Actions ===
    setNodes: (nodes: GraphNode[]) => void;
    addNode: (node: Omit<GraphNode, 'id'>) => string;
    updateNode: (id: string, updates: Partial<GraphNode>) => void;
    updateNodePosition: (id: string, x: number, y: number) => void;
    deleteNode: (id: string) => void;

    // === Edge Actions ===
    setEdges: (edges: GraphEdge[]) => void;
    addEdge: (edge: Omit<GraphEdge, 'id'>) => string;
    updateEdge: (id: string, updates: Partial<GraphEdge>) => void;
    deleteEdge: (id: string) => void;
    invertEdgeDirection: (id: string) => void;

    // === WikiLink Sync ===
    getNodeConnections: (nodeId: string) => { outgoing: GraphEdge[]; incoming: GraphEdge[]; all: GraphEdge[] };
    syncEdgesFromContent: (nodeId: string, content: string, systemId: string) => void;

    // === SuperTag Actions ===
    createSuperTag: (tag: Omit<SuperTag, 'id'>) => void;
    updateSuperTag: (id: string, updates: Partial<SuperTag>) => void;
    deleteSuperTag: (id: string) => void;
    addTagToNode: (nodeId: string, tagId: string) => void;
    removeTagFromNode: (nodeId: string, tagId: string) => void;

    // === Node Properties (campos de SuperTags) ===
    updateNodeProperty: (nodeId: string, key: string, value: unknown) => void;
    removeNodeProperties: (nodeId: string, tagId: string) => void;

    // === Batch Position Update (para D3) ===
    updateNodePositions: (positions: Map<string, { x: number; y: number }>) => void;

    // === Undo/Redo ===
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    // === Physics Settings ===
    togglePhysics: () => void;
    setPhysicsEnabled: (enabled: boolean) => void;
    setRepulsionStrength: (strength: number) => void;
    setLinkDistance: (distance: number) => void;
    setCollisionRadius: (radius: number) => void;
    setCenterStrength: (strength: number) => void;
    setAxisStrength: (strength: number) => void;
    setDensityGenericFactor: (factor: number) => void;
    setDensityChargeFactor: (factor: number) => void;
    setDensityMaxSize: (size: number) => void;

    // === Visual Settings ===
    toggleGrid: () => void;

    // === Interaction State ===
    setSelectedNodeIds: (ids: Set<string>) => void;
    selectNode: (id: string, additive?: boolean) => void;
    selectEdge: (id: string | null) => void;
    clearSelection: () => void;
    setIsDragging: (dragging: boolean) => void;

    // === Busca (Spotlight) ===
    setSearchQuery: (query: string) => void;
    clearSearch: () => void;
    navigateToFirstResult: () => void;

    // === System ===
    setCurrentSystemId: (systemId: string) => void;
    reset: () => void;
}

type GraphStore = GraphState & GraphActions;

const HISTORY_LIMIT = 50;

// Estado inicial
const initialState: GraphState = {
    nodes: [],
    edges: [],
    superTags: [],
    currentSystemId: 'system-1',

    history: [],
    future: [],

    physicsEnabled: true,
    repulsionStrength: -300,
    linkDistance: PHYSICS.LINK_DISTANCE_DEFAULT,
    collisionRadius: PHYSICS.COLLISION_RADIUS_DEFAULT,
    centerStrength: PHYSICS.CENTER_STRENGTH,
    axisStrength: PHYSICS.AXIS_STRENGTH,
    densityGenericFactor: PHYSICS.DENSITY_GENERIC_FACTOR,
    densityChargeFactor: PHYSICS.DENSITY_CHARGE_FACTOR,
    densityMaxSize: PHYSICS.DENSITY_MAX_SIZE,

    showGrid: true,

    selectedNodeIds: new Set(),
    selectedEdgeId: null,
    isDragging: false,

    // Busca
    searchQuery: '',
    highlightedNodeIds: [],
};

// Cria snapshot do estado atual
const createSnapshot = (state: GraphState): GraphSnapshot => ({
    nodes: state.nodes.map(n => ({ ...n })),
    edges: state.edges.map(e => ({ ...e })),
});

// Empurra snapshot para o histórico
const pushHistory = (state: GraphState): GraphSnapshot[] => {
    const snapshot = createSnapshot(state);
    const newHistory = [...state.history, snapshot];
    // Limita tamanho do histórico
    if (newHistory.length > HISTORY_LIMIT) {
        newHistory.shift();
    }
    return newHistory;
};

export const useGraphStore = create<GraphStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            // === Node Actions (com histórico) ===
            setNodes: (nodes) => set((state) => ({
                nodes,
                history: pushHistory(state),
                future: [], // Limpa redo ao fazer nova ação
            })),

            addNode: (nodeData) => {
                const newNode: GraphNode = {
                    ...nodeData,
                    id: crypto.randomUUID(),
                };
                set((state) => ({
                    nodes: [...state.nodes, newNode],
                    history: pushHistory(state),
                    future: [],
                }));
                return newNode.id;
            },

            updateNode: (id, updates) => {
                set((state) => ({
                    nodes: state.nodes.map((node) =>
                        node.id === id ? { ...node, ...updates } : node
                    ),
                    history: pushHistory(state),
                    future: [],
                }));
            },

            // Posição NÃO salva no histórico (acontece muito frequentemente)
            updateNodePosition: (id, x, y) => {
                set((state) => ({
                    nodes: state.nodes.map((node) =>
                        node.id === id ? { ...node, x, y } : node
                    ),
                }));
            },

            deleteNode: (id) => {
                set((state) => ({
                    nodes: state.nodes.filter((node) => node.id !== id),
                    edges: state.edges.filter(
                        (edge) => edge.source !== id && edge.target !== id
                    ),
                    selectedNodeIds: new Set(
                        [...state.selectedNodeIds].filter((nodeId) => nodeId !== id)
                    ),
                    history: pushHistory(state),
                    future: [],
                }));
            },

            // === Edge Actions (com histórico) ===
            setEdges: (edges) => set((state) => ({
                edges,
                history: pushHistory(state),
                future: [],
            })),

            addEdge: (edgeData) => {
                const { edges } = get();
                const exists = edges.some(
                    (e) => e.source === edgeData.source && e.target === edgeData.target
                );
                if (exists) return '';

                const newEdge: GraphEdge = {
                    ...edgeData,
                    id: crypto.randomUUID(),
                };
                set((state) => ({
                    edges: [...state.edges, newEdge],
                    history: pushHistory(state),
                    future: [],
                }));
                return newEdge.id;
            },

            deleteEdge: (id) => {
                set((state) => ({
                    edges: state.edges.filter((edge) => edge.id !== id),
                    history: pushHistory(state),
                    future: [],
                }));
            },

            updateEdge: (id, updates) => {
                set((state) => ({
                    edges: state.edges.map((edge) => {
                        if (edge.id !== id) return edge;
                        return { ...edge, ...updates };
                    }),
                    history: pushHistory(state),
                    future: [],
                }));
            },

            invertEdgeDirection: (id) => {
                set((state) => ({
                    edges: state.edges.map((edge) => {
                        if (edge.id !== id) return edge;
                        // Swap source <-> target
                        return { ...edge, source: edge.target, target: edge.source };
                    }),
                    history: pushHistory(state),
                    future: [],
                }));
            },

            // === WikiLink Sync ===
            getNodeConnections: (nodeId) => {
                const state = get();
                const outgoing = state.edges.filter(e => e.source === nodeId);
                const incoming = state.edges.filter(e => e.target === nodeId);
                return {
                    outgoing,
                    incoming,
                    all: [...outgoing, ...incoming],
                };
            },

            syncEdgesFromContent: (nodeId, content, systemId) => {
                const state = get();

                // Extrai WikiLinks do conteúdo usando regex
                const nodeIds: string[] = [];
                const regex = /data-node-id="([^"]+)"/g;
                let match;
                while ((match = regex.exec(content)) !== null) {
                    const id = match[1];
                    if (id && id.trim() !== '' && id !== nodeId) {
                        nodeIds.push(id);
                    }
                }
                const wikiLinkTargets = [...new Set(nodeIds)];

                // Pega edges atuais deste nó (apenas outgoing)
                const currentEdges = state.edges.filter(e => e.source === nodeId);
                const currentTargets = currentEdges.map(e => e.target);

                // Edges a criar: WikiLinks sem edge correspondente
                const toCreate = wikiLinkTargets.filter(target => !currentTargets.includes(target));

                // Cria novas edges
                if (toCreate.length > 0) {
                    const newEdges = toCreate.map(targetId => ({
                        id: crypto.randomUUID(),
                        source: nodeId,
                        target: targetId,
                        systemId,
                    }));

                    set((state) => ({
                        edges: [...state.edges, ...newEdges],
                        history: pushHistory(state),
                        future: [],
                    }));
                }
            },

            // === SuperTag Actions ===
            createSuperTag: (tagData) => {
                const newTag: SuperTag = {
                    ...tagData,
                    id: crypto.randomUUID(),
                };
                set((state) => ({
                    superTags: [...state.superTags, newTag],
                }));
            },

            updateSuperTag: (id, updates) => {
                set((state) => ({
                    superTags: state.superTags.map((tag) =>
                        tag.id === id ? { ...tag, ...updates } : tag
                    ),
                }));
            },

            deleteSuperTag: (id) => {
                set((state) => ({
                    superTags: state.superTags.filter((tag) => tag.id !== id),
                    // Remove a tag de todos os nodes que a tinham
                    nodes: state.nodes.map((node) => ({
                        ...node,
                        tags: node.tags?.filter((tagId) => tagId !== id),
                    })),
                }));
            },

            addTagToNode: (nodeId, tagId) => {
                set((state) => ({
                    nodes: state.nodes.map((node) => {
                        if (node.id !== nodeId) return node;
                        const currentTags = node.tags ?? [];
                        if (currentTags.includes(tagId)) return node;
                        return { ...node, tags: [...currentTags, tagId] };
                    }),
                    history: pushHistory(state),
                    future: [],
                }));
            },

            removeTagFromNode: (nodeId, tagId) => {
                set((state) => ({
                    nodes: state.nodes.map((node) => {
                        if (node.id !== nodeId) return node;
                        return {
                            ...node,
                            tags: node.tags?.filter((t) => t !== tagId),
                        };
                    }),
                    history: pushHistory(state),
                    future: [],
                }));
            },

            // === Node Properties (campos de SuperTags) ===
            updateNodeProperty: (nodeId, key, value) => {
                set((state) => ({
                    nodes: state.nodes.map((node) => {
                        if (node.id !== nodeId) return node;
                        return {
                            ...node,
                            properties: {
                                ...node.properties,
                                [key]: value,
                            },
                        };
                    }),
                    history: pushHistory(state),
                    future: [],
                }));
            },

            removeNodeProperties: (nodeId, tagId) => {
                set((state) => ({
                    nodes: state.nodes.map((node) => {
                        if (node.id !== nodeId) return node;
                        // Remove todas as properties que começam com o tagId
                        const newProperties: Record<string, unknown> = {};
                        if (node.properties) {
                            Object.entries(node.properties).forEach(([key, val]) => {
                                if (!key.startsWith(`${tagId}.`)) {
                                    newProperties[key] = val;
                                }
                            });
                        }
                        return {
                            ...node,
                            properties: newProperties,
                        };
                    }),
                    history: pushHistory(state),
                    future: [],
                }));
            },

            // === Batch Position Update (SEM histórico - D3 chama frequentemente) ===
            updateNodePositions: (positions) => {
                set((state) => ({
                    nodes: state.nodes.map((node) => {
                        const newPos = positions.get(node.id);
                        if (newPos) {
                            return { ...node, x: newPos.x, y: newPos.y };
                        }
                        return node;
                    }),
                }));
            },

            // === Undo/Redo ===
            undo: () => {
                const { history, future, nodes, edges } = get();
                if (history.length === 0) return;

                const previous = history[history.length - 1];
                const newHistory = history.slice(0, -1);

                // Salva estado atual no future
                const currentSnapshot: GraphSnapshot = { nodes, edges };

                set({
                    nodes: previous.nodes,
                    edges: previous.edges,
                    history: newHistory,
                    future: [...future, currentSnapshot],
                });
            },

            redo: () => {
                const { history, future, nodes, edges } = get();
                if (future.length === 0) return;

                const next = future[future.length - 1];
                const newFuture = future.slice(0, -1);

                // Salva estado atual no history
                const currentSnapshot: GraphSnapshot = { nodes, edges };

                set({
                    nodes: next.nodes,
                    edges: next.edges,
                    history: [...history, currentSnapshot],
                    future: newFuture,
                });
            },

            canUndo: () => get().history.length > 0,
            canRedo: () => get().future.length > 0,

            // === Physics Settings ===
            togglePhysics: () => set((state) => ({ physicsEnabled: !state.physicsEnabled })),
            setPhysicsEnabled: (enabled) => set({ physicsEnabled: enabled }),
            setRepulsionStrength: (strength) => set({ repulsionStrength: strength }),
            setLinkDistance: (distance) => set({ linkDistance: distance }),
            setCollisionRadius: (radius) => set({ collisionRadius: radius }),
            setCenterStrength: (strength) => set({ centerStrength: strength }),
            setAxisStrength: (strength) => set({ axisStrength: strength }),
            setDensityGenericFactor: (factor) => set({ densityGenericFactor: factor }),
            setDensityChargeFactor: (factor) => set({ densityChargeFactor: factor }),
            setDensityMaxSize: (size) => set({ densityMaxSize: size }),

            // === Visual Settings ===
            toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

            // === Interaction State ===
            setSelectedNodeIds: (ids) => set((state) => {
                const sameSize = ids.size === state.selectedNodeIds.size;
                const sameContent = sameSize && [...ids].every((id) => state.selectedNodeIds.has(id));
                if (sameContent) return state;
                return { selectedNodeIds: ids };
            }),

            selectNode: (id, additive = false) => {
                set((state) => {
                    if (additive) {
                        const newSelection = new Set(state.selectedNodeIds);
                        if (newSelection.has(id)) {
                            newSelection.delete(id);
                        } else {
                            newSelection.add(id);
                        }
                        return { selectedNodeIds: newSelection, selectedEdgeId: null };
                    }
                    return { selectedNodeIds: new Set([id]), selectedEdgeId: null };
                });
            },

            selectEdge: (id) => {
                set((state) => ({
                    selectedEdgeId: id,
                    selectedNodeIds: id ? new Set() : state.selectedNodeIds,
                }));
            },

            clearSelection: () => set({ selectedNodeIds: new Set(), selectedEdgeId: null }),

            setIsDragging: (dragging) => set({ isDragging: dragging }),

            // === Busca (Spotlight) ===
            setSearchQuery: (query) => {
                const { nodes } = get();
                if (!query.trim()) {
                    set({ searchQuery: '', highlightedNodeIds: [] });
                    return;
                }

                const lowerQuery = query.toLowerCase();
                const matchingIds = nodes
                    .filter((node) => node.title.toLowerCase().includes(lowerQuery))
                    .map((node) => node.id);

                set({ searchQuery: query, highlightedNodeIds: matchingIds });
            },

            clearSearch: () => set({ searchQuery: '', highlightedNodeIds: [] }),

            navigateToFirstResult: () => {
                const { highlightedNodeIds } = get();
                if (highlightedNodeIds.length > 0) {
                    set({ selectedNodeIds: new Set([highlightedNodeIds[0]]), selectedEdgeId: null });
                }
            },

            // === System ===
            setCurrentSystemId: (systemId) => set({ currentSystemId: systemId }),

            reset: () => set({
                ...initialState,
                selectedNodeIds: new Set(),
            }),
        }),
        {
            name: 'neograph-storage',
            // Só persiste nodes e edges (não histórico, selection, etc)
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                superTags: state.superTags,
                currentSystemId: state.currentSystemId,
                physicsEnabled: state.physicsEnabled,
                repulsionStrength: state.repulsionStrength,
                linkDistance: state.linkDistance,
                collisionRadius: state.collisionRadius,
                centerStrength: state.centerStrength,
                axisStrength: state.axisStrength,
                densityGenericFactor: state.densityGenericFactor,
                densityChargeFactor: state.densityChargeFactor,
                densityMaxSize: state.densityMaxSize,
                showGrid: state.showGrid,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.selectedNodeIds = new Set();
                    state.history = [];
                    state.future = [];
                }
            },
        }
    )
);

// === Selectores para performance (evita re-renders desnecessários) ===
export const useNodes = () => useGraphStore((state) => state.nodes);
export const useEdges = () => useGraphStore((state) => state.edges);

// Selectores individuais para configurações de física
export const usePhysicsEnabled = () => useGraphStore((state) => state.physicsEnabled);
export const useRepulsionStrength = () => useGraphStore((state) => state.repulsionStrength);
export const useLinkDistance = () => useGraphStore((state) => state.linkDistance);
export const useCollisionRadius = () => useGraphStore((state) => state.collisionRadius);
export const useCenterStrength = () => useGraphStore((state) => state.centerStrength);
export const useAxisStrength = () => useGraphStore((state) => state.axisStrength);
export const useDensityGenericFactor = () => useGraphStore((state) => state.densityGenericFactor);
export const useDensityChargeFactor = () => useGraphStore((state) => state.densityChargeFactor);
export const useDensityMaxSize = () => useGraphStore((state) => state.densityMaxSize);

export const useShowGrid = () => useGraphStore((state) => state.showGrid);
export const useIsDragging = () => useGraphStore((state) => state.isDragging);

// Selectores para Undo/Redo
export const useCanUndo = () => useGraphStore((state) => state.history.length > 0);
export const useCanRedo = () => useGraphStore((state) => state.future.length > 0);

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    NodeChange,
    EdgeChange,
    Connection,
    useReactFlow,
    ReactFlowProvider,
    ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';
import { ConnectionLine } from './ConnectionLine';
import { CanvasToolbar } from './CanvasToolbar';
import { SettingsPanel } from './SettingsPanel';
import { PropertySidebar } from './PropertySidebar';
import { useGraphStore, useNodes, useEdges, useShowGrid } from '@/lib/store/graphStore';
import { useD3Simulation } from '@/lib/hooks/useD3Simulation';
import { useLoadGraph } from '@/lib/hooks/useLoadGraph';
import { toReactFlowNodes, toReactFlowEdges, createGraphNode } from '@/lib/adapters/graphAdapter';
import { EdgeSidebar } from './EdgeSidebar';

// ============================================================================
// GRAPH CANVAS - Main canvas component for the knowledge graph
// ============================================================================

const nodeTypes = {
    orb: GraphNode,
};

const edgeTypes = {
    default: GraphEdge,
};

const SYSTEM_ID = 'system-1';

function GraphCanvasContent() {
    const reactFlow = useReactFlow();
    const { screenToFlowPosition } = reactFlow;

    // Ensure we only load data after mount to avoid hydration mismatch
    const [mounted, setMounted] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Store state
    const nodes = useNodes();
    const edges = useEdges();
    const showGrid = useShowGrid();
    const {
        addNode,
        addEdge,
        deleteNode,
        setIsDragging,
        currentSystemId,
        selectNode,
        clearSelection,
    } = useGraphStore();

    // Load initial data
    const { isLoading, isError } = useLoadGraph(mounted ? SYSTEM_ID : '');

    // Initialize D3 physics
    const {
        reheat,
        updateNodeInSimulation,
        releaseNode,
        initSimulation,
    } = useD3Simulation(reactFlow);

    // Convert to React Flow format
    const rfNodes = useMemo(() => toReactFlowNodes(nodes), [nodes]);
    const rfEdges = useMemo(() => toReactFlowEdges(edges), [edges]);

    // Sincroniza nós/edges na instância do React Flow preservando posição/seleção atuais
    useEffect(() => {
        const existing = reactFlow.getNodes();
        const map = new Map(existing.map((n) => [n.id, n]));
        reactFlow.setNodes(
            rfNodes.map((n) => {
                const prev = map.get(n.id);
                return prev ? { ...n, position: prev.position, selected: prev.selected } : n;
            })
        );
    }, [rfNodes, reactFlow]);

    useEffect(() => {
        const existing = reactFlow.getEdges();
        const map = new Map(existing.map((e) => [e.id, e]));
        reactFlow.setEdges(
            rfEdges.map((e) => {
                const prev = map.get(e.id);
                return prev ? { ...e, selected: prev.selected } : e;
            })
        );
    }, [rfEdges, reactFlow]);

    // Handle node changes (position, selection, etc.)
    const onNodesChange = useCallback(
        (changes: NodeChange<Node>[]) => {
            changes.forEach((change) => {
                // Handle position changes (dragging)
                if (change.type === 'position' && change.id) {
                    if (change.dragging && change.position) {
                        // Início ou continuação do drag
                        setIsDragging(true);
                        updateNodeInSimulation(change.id, change.position.x, change.position.y);
                    } else if (!change.dragging) {
                        // Fim do drag
                        setIsDragging(false);
                        releaseNode(change.id);
                    }
                }

                // Handle selection changes
                if (change.type === 'select' && change.id) {
                    if (change.selected) {
                        selectNode(change.id, false);
                    } else {
                        clearSelection();
                    }
                }

                // Handle removal
                if (change.type === 'remove' && change.id) {
                    deleteNode(change.id);
                }
            });
        },
        [deleteNode, setIsDragging, updateNodeInSimulation, releaseNode, selectNode, clearSelection]
    );

    // Handle edge changes
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            changes.forEach((change) => {
                if (change.type === 'remove' && change.id) {
                    useGraphStore.getState().deleteEdge(change.id);
                }
            });
        },
        []
    );

    // Handle new connections (drag from handle to handle)
    const onConnect = useCallback(
        (connection: Connection) => {
            if (connection.source && connection.target && connection.source !== connection.target) {
                addEdge({
                    source: connection.source,
                    target: connection.target,
                    type: 'default',
                    systemId: currentSystemId,
                });
                // Reheat physics after connection
                setTimeout(() => reheat(), 100);
            }
        },
        [addEdge, currentSystemId, reheat]
    );

    // Double-click to create node - usa onDoubleClick dedicado
    const onPaneDoubleClick = useCallback(
        (event: React.MouseEvent) => {
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNodeData = createGraphNode(
                position.x,
                position.y,
                currentSystemId
            );
            addNode(newNodeData);

            // Pequeno delay para garantir que o nó foi adicionado ao store
            setTimeout(() => reheat(), 150);
        },
        [screenToFlowPosition, currentSystemId, addNode, reheat]
    );

    // Delete selected nodes on Delete key (não Backspace, para evitar conflito com edição)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Apenas Delete, não Backspace (backspace usado para edição de texto)
            if (event.key === 'Delete') {
                const target = event.target as HTMLElement;

                // Ignora se estiver em input, textarea ou contenteditable
                if (
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable ||
                    target.closest('[contenteditable="true"]')
                ) {
                    return;
                }

                const { selectedNodeIds } = useGraphStore.getState();
                if (selectedNodeIds.size > 0) {
                    selectedNodeIds.forEach((id) => deleteNode(id));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deleteNode]);

    // Not mounted yet
    if (!mounted) {
        return (
            <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
                <div className="text-zinc-400 animate-pulse">Initializing...</div>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
                <div className="text-zinc-400 animate-pulse">Loading graph...</div>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
                <div className="text-red-400">Failed to load graph</div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full relative" style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%)' }}>
            {/* Toolbar flutuante */}
            <CanvasToolbar
                onOpenSettings={() => setSettingsOpen(true)}
                onReheat={reheat}
            />

            {/* Painel de configurações */}
            <SettingsPanel
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onReinitSimulation={() => initSimulation()}
            />

            {/* Painel de propriedades do nó */}
            {selectedNodeId && (
                <PropertySidebar
                    key={selectedNodeId}
                    nodeId={selectedNodeId}
                    onClose={() => setSelectedNodeId(null)}
                    onSelectNode={(id) => setSelectedNodeId(id)}
                />
            )}

            {/* Painel de propriedades da edge */}
            {selectedEdgeId && !selectedNodeId && (
                <EdgeSidebar
                    key={selectedEdgeId}
                    edgeId={selectedEdgeId}
                    onClose={() => setSelectedEdgeId(null)}
                    onSelectNode={(id) => {
                        setSelectedEdgeId(null);
                        setSelectedNodeId(id);
                    }}
                />
            )}

            <ReactFlow
                defaultNodes={rfNodes}
                defaultEdges={rfEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionLineComponent={ConnectionLine}
                connectionMode={ConnectionMode.Loose}
                connectionRadius={50}
                onNodeClick={(_event, node) => {
                    setSelectedNodeId(node.id);
                    setSelectedEdgeId(null);
                }}
                onEdgeClick={(_event, edge) => {
                    setSelectedEdgeId(edge.id);
                    setSelectedNodeId(null);
                }}
                onPaneClick={() => {
                    setSelectedNodeId(null);
                    setSelectedEdgeId(null);
                }}
                onDoubleClick={onPaneDoubleClick}
                fitView
                className="!bg-transparent"
                minZoom={0.1}
                maxZoom={4}
                nodesDraggable={true}
                nodesConnectable={true}
                elementsSelectable={true}
                edgesFocusable={true}
                selectNodesOnDrag={false}
                deleteKeyCode={null}
            >
                {showGrid && <Background color="#333" gap={20} size={1} />}
                <Controls className="bg-zinc-900/80 backdrop-blur-sm border-zinc-800 fill-zinc-400 rounded-lg" />
            </ReactFlow>
        </div>
    );
}

export function GraphCanvas() {
    return (
        <ReactFlowProvider>
            <GraphCanvasContent />
        </ReactFlowProvider>
    );
}

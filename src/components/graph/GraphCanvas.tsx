'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ReactFlow,
    Background,
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
import { EdgeSidebar } from './EdgeSidebar';
import { TagManager } from '../tags/TagManager';
import { useGraphStore, useNodes, useEdges, useShowGrid } from '@/lib/store/graphStore';
import { useD3Simulation } from '@/lib/hooks/useD3Simulation';
import { useLoadGraph } from '@/lib/hooks/useLoadGraph';
import { toReactFlowNodes, toReactFlowEdges, createGraphNode } from '@/lib/adapters/graphAdapter';

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

    const [mounted, setMounted] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [tagManagerOpen, setTagManagerOpen] = useState(false);

    useEffect(() => {
        // Use setTimeout to avoid synchronous state update warning
        setTimeout(() => setMounted(true), 0);
    }, []);

    // Store state
    const nodes = useNodes();
    const edges = useEdges();
    const showGrid = useShowGrid();
    const highlightedNodeIds = useGraphStore((s) => s.highlightedNodeIds);
    const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds);
    const selectedNodeId = selectedNodeIds.size === 1 ? Array.from(selectedNodeIds)[0] : null;
    const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId);
    const {
        addNode,
        addEdge,
        deleteNode,
        setIsDragging,
        currentSystemId,
        selectNode,
        clearSelection,
        selectEdge,
        setSelectedNodeIds,
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

    // FitView quando navegar para resultado da busca (Enter)
    // FitView quando navegar para resultado da busca (Enter)
    useEffect(() => {
        if (selectedNodeId && highlightedNodeIds.length > 0) {
            // Verifica se é um nó destacado (veio da busca)
            if (highlightedNodeIds.includes(selectedNodeId)) {
                const node = nodes.find((n) => n.id === selectedNodeId);
                if (node) {
                    reactFlow.fitView({
                        nodes: [{ id: selectedNodeId }],
                        duration: 400,
                        padding: 0.5,
                    });
                }
            }
        }
    }, [selectedNodeId, highlightedNodeIds, nodes, reactFlow]);

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
                return {
                    ...n,
                    position: prev?.position ?? n.position,
                    selected: selectedNodeIds.has(n.id),
                };
            })
        );
    }, [rfNodes, reactFlow, selectedNodeIds]);

    useEffect(() => {
        reactFlow.setEdges(
            rfEdges.map((e) => ({
                ...e,
                selected: selectedEdgeId === e.id,
            }))
        );
    }, [rfEdges, reactFlow, selectedEdgeId]);

    // Handle node changes (position, selection, etc.)
    const onNodesChange = useCallback(
        (changes: NodeChange[]) => {
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

                // Handle removal
                if (change.type === 'remove' && change.id) {
                    deleteNode(change.id);
                }
            });
        },
        [deleteNode, setIsDragging, updateNodeInSimulation, releaseNode]
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

    // Quick Add: quando drag do handle termina no vazio, cria nó + conexão
    const onConnectEnd = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event: MouseEvent | TouchEvent, connectionState: any) => {
            const fromNode = connectionState.fromNode;
            const fromHandle = connectionState.fromHandle;
            const toNode = connectionState.toNode;
            const toHandle = connectionState.toHandle;

            // Se já conectou em um alvo válido, não faz quick-add
            if (!fromNode || !fromHandle || toNode || toHandle) return;

            // Pega posição do mouse/touch
            const clientX = 'touches' in event ? event.changedTouches[0].clientX : event.clientX;
            const clientY = 'touches' in event ? event.changedTouches[0].clientY : event.clientY;

            // Verifica se o drop foi em um nó existente
            const targetElement = document.elementFromPoint(clientX, clientY);
            const isOverNode = targetElement?.closest('.react-flow__node');

            // Se caiu em um nó, ignora (onConnect já tratou)
            if (isOverNode) return;

            // Cria novo nó na posição do drop
            const position = screenToFlowPosition({ x: clientX, y: clientY });

            const newNodeData = createGraphNode(position.x, position.y, currentSystemId);
            const newNodeId = addNode(newNodeData);

            if (!newNodeId) return;

            // Determina direção baseado no tipo de handle
            const isSource = fromHandle.type === 'source';
            addEdge({
                source: isSource ? fromNode.id : newNodeId,
                target: isSource ? newNodeId : fromNode.id,
                systemId: currentSystemId,
                type: 'default',
            });

            // Reheat physics
            setTimeout(() => reheat(), 100);
        },
        [currentSystemId, screenToFlowPosition, reheat, addNode, addEdge]
    );

    const onSelectionChange = useCallback(
        (params: { nodes: { id: string }[]; edges: { id: string }[] }) => {
            const nodeIds = new Set(params.nodes.map((n) => n.id));
            if (params.edges.length > 0) {
                selectEdge(params.edges[0].id);
                setSelectedNodeIds(new Set());
            } else {
                setSelectedNodeIds(nodeIds);
                selectEdge(null);
            }
        },
        [selectEdge, setSelectedNodeIds]
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
            const newNodeId = addNode(newNodeData);

            // Sincroniza com React Flow
            if (newNodeId) {
                reactFlow.addNodes({
                    id: newNodeId,
                    position: { x: newNodeData.x, y: newNodeData.y },
                    data: { title: newNodeData.title, color: newNodeData.color, tags: [] },
                    type: 'orb',
                });
            }

            // Pequeno delay para garantir que o nó foi adicionado ao store
            setTimeout(() => reheat(), 150);
        },
        [screenToFlowPosition, currentSystemId, addNode, reheat, reactFlow]
    );

    // Delete selected nodes/edges, duplicate selected nodes (Ctrl/Cmd + D)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
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

            // Delete
            if (event.key === 'Delete') {
                const { selectedNodeIds: currentSelectedNodeIds } = useGraphStore.getState();
                if (currentSelectedNodeIds.size > 0) {
                    currentSelectedNodeIds.forEach((id) => deleteNode(id));
                } else {
                    const { selectedEdgeId: currentSelectedEdgeId } = useGraphStore.getState();
                    if (currentSelectedEdgeId) {
                        useGraphStore.getState().deleteEdge(currentSelectedEdgeId);
                    }
                }
            }

            // Duplicate (Ctrl/Cmd + D)
            if ((event.ctrlKey || event.metaKey) && (event.key === 'd' || event.key === 'D')) {
                event.preventDefault();
                const state = useGraphStore.getState();
                const selectedNodes = state.nodes.filter((n) => state.selectedNodeIds.has(n.id));
                if (selectedNodes.length === 0) return;

                const idMap = new Map<string, string>();
                selectedNodes.forEach((node) => {
                    const rest = { ...node };
                    delete (rest as Partial<typeof node>).id;
                    const newId = state.addNode({
                        ...rest,
                        x: node.x + 50,
                        y: node.y + 50,
                    });
                    if (newId) {
                        idMap.set(node.id, newId);
                    }
                });

                // Replica edges internas entre nós duplicados
                state.edges
                    .filter((edge) => state.selectedNodeIds.has(edge.source) && state.selectedNodeIds.has(edge.target))
                    .forEach((edge) => {
                        const newSource = idMap.get(edge.source);
                        const newTarget = idMap.get(edge.target);
                        if (!newSource || !newTarget) return;
                        const rest = { ...edge };
                        delete (rest as Partial<typeof edge>).id;
                        delete (rest as Partial<typeof edge>).source;
                        delete (rest as Partial<typeof edge>).target;
                        state.addEdge({
                            ...(rest as Omit<typeof edge, 'id' | 'source' | 'target'>),
                            source: newSource,
                            target: newTarget,
                        });
                    });

                state.setSelectedNodeIds(new Set(idMap.values()));
                setTimeout(() => reheat(), 100);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deleteNode, reheat]);

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
        <div className="h-screen w-full relative bg-[radial-gradient(ellipse_at_center,#1a1a2e_0%,#0a0a0f_100%)]">
            {/* Toolbar flutuante unificada */}
            <CanvasToolbar
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenTagManager={() => setTagManagerOpen(true)}
            />

            {/* Painel de configurações */}
            <SettingsPanel
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onReinitSimulation={() => initSimulation()}
            />

            {/* Gerenciador de Tags */}
            <TagManager
                isOpen={tagManagerOpen}
                onClose={() => setTagManagerOpen(false)}
            />

            {/* Painel de propriedades do nó */}
            {selectedNodeId && (
                <PropertySidebar
                    key={selectedNodeId}
                    nodeId={selectedNodeId}
                    onClose={() => setSelectedNodeIds(new Set())}
                    onSelectNode={(id) => setSelectedNodeIds(new Set([id]))}
                />
            )}

            {/* Painel de propriedades da edge */}
            {selectedEdgeId && !selectedNodeId && (
                <EdgeSidebar
                    key={selectedEdgeId}
                    edgeId={selectedEdgeId}
                    onClose={() => selectEdge(null)}
                    onSelectNode={(id) => selectNode(id)}
                />
            )}

            <ReactFlow
                defaultNodes={rfNodes}
                defaultEdges={rfEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectEnd={onConnectEnd}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionLineComponent={ConnectionLine}
                connectionMode={ConnectionMode.Loose}
                connectionRadius={50}
                onNodeClick={(_event, node) => {
                    const additive = _event.metaKey || _event.ctrlKey || _event.shiftKey;
                    selectNode(node.id, additive);
                }}
                onEdgeClick={(_event, edge) => {
                    selectEdge(edge.id);
                    setSelectedNodeIds(new Set());
                }}
                onPaneClick={() => {
                    clearSelection();
                }}
                onDoubleClick={onPaneDoubleClick}
                onSelectionChange={onSelectionChange}
                fitView
                className="bg-transparent!"
                minZoom={0.1}
                maxZoom={4}
                nodesDraggable={true}
                nodesConnectable={true}
                elementsSelectable={true}
                edgesFocusable={true}
                selectNodesOnDrag={true}
                deleteKeyCode={null}
            >
                {showGrid && <Background color="#333" gap={20} size={1} />}
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

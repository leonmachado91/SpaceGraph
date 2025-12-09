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
        selectedEdgeId
    } = useGraphStore();

    // Derived Selection State (Derived from Store)
    const selectedNodeId = selectedNodeIds.size === 1 ? Array.from(selectedNodeIds)[0] : null;

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

    // Quick Add: quando drag do handle termina no vazio, cria nó + conexão
    const onConnectEnd = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event: MouseEvent | TouchEvent, connectionState: any) => {
            const fromNode = connectionState.fromNode;
            const fromHandle = connectionState.fromHandle;

            if (!fromNode || !fromHandle) return;

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

            // Gera ID antes para poder usar na edge
            const newNodeId = crypto.randomUUID();

            // Adiciona o nó diretamente ao store
            const { nodes: currentNodes, edges: currentEdges } = useGraphStore.getState();
            const newNode = {
                id: newNodeId,
                title: 'New Node',
                type: 'default' as const,
                x: position.x,
                y: position.y,
                color: '#6366f1',
                systemId: currentSystemId,
            };

            // Determina direção baseado no tipo de handle
            const isSource = fromHandle.type === 'source';
            const newEdge = {
                id: crypto.randomUUID(),
                source: isSource ? fromNode.id : newNodeId,
                target: isSource ? newNodeId : fromNode.id,
                systemId: currentSystemId,
            };

            // Atualiza store com nó + edge em uma única operação
            useGraphStore.setState({
                nodes: [...currentNodes, newNode],
                edges: [...currentEdges, newEdge],
            });

            // Sincroniza com React Flow para física imediata
            reactFlow.addNodes({
                id: newNodeId,
                position: { x: newNode.x, y: newNode.y },
                data: { title: newNode.title, color: newNode.color, tags: [] },
                type: 'orb',
            });
            reactFlow.addEdges({
                id: newEdge.id,
                source: newEdge.source,
                target: newEdge.target,
                type: 'default',
                style: { stroke: '#8b5cf6', strokeWidth: 2 },
            });

            // Reheat physics
            setTimeout(() => reheat(), 100);
        },
        [currentSystemId, screenToFlowPosition, reheat, reactFlow]
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
                    selectNode(node.id, false);
                }}
                onEdgeClick={(_event, edge) => {
                    selectEdge(edge.id);
                }}
                onPaneClick={() => {
                    clearSelection();
                }}
                onDoubleClick={onPaneDoubleClick}
                fitView
                className="bg-transparent!"
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

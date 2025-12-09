import { useEffect, useCallback } from 'react';
import {
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    forceCollide,
    forceX,
    forceY,
    Simulation,
    SimulationNodeDatum,
    SimulationLinkDatum,
} from 'd3-force';
import type { ReactFlowInstance } from '@xyflow/react';
import { useGraphStore } from '@/lib/store/graphStore';

// ============================================================================
// D3 SIMULATION HOOK - FÇðsica do Grafo (DESACOPLADO DO ZUSTAND)
// ============================================================================
// Atualiza posiÇõÇæes direto no React Flow (setNodes) e persiste no Zustand
// apenas de forma debounced ou em eventos chave (drag end, stop).
// ============================================================================

interface SimNode extends SimulationNodeDatum {
    id: string;
    label?: string;
    x: number;
    y: number;
    fx?: number | null;
    fy?: number | null;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
    id: string;
}

// SINGLETON
let simulation: Simulation<SimNode, SimLink> | null = null;
let simNodes: SimNode[] = [];
let lastTickTime = 0;
let reactFlowInstance: ReactFlowInstance | null = null;
let persistTimeout: ReturnType<typeof setTimeout> | null = null;

const TICK_THROTTLE_MS = 16; // ~60fps para animaÇõÇœ mais fluida
const PERSIST_DEBOUNCE_MS = 800;
const RESTART_ALPHA = 0.3;

export function useD3Simulation(
    rfInstance?: ReactFlowInstance | null,
) {
    const getStoreState = useGraphStore.getState;

    const setReactFlowInstance = useCallback((instance: ReactFlowInstance | null) => {
        reactFlowInstance = instance ?? null;
    }, []);

    const persistPositions = useCallback((immediate = false) => {
        if (!simNodes.length) return;

        const positions = new Map<string, { x: number; y: number }>();
        simNodes.forEach((node) => {
            if (node.x !== undefined && node.y !== undefined) {
                positions.set(node.id, { x: node.x, y: node.y });
            }
        });

        if (positions.size === 0) return;

        const { updateNodePositions } = getStoreState();

        if (immediate) {
            if (persistTimeout) {
                clearTimeout(persistTimeout);
                persistTimeout = null;
            }
            updateNodePositions(positions);
            return;
        }

        if (persistTimeout) {
            clearTimeout(persistTimeout);
        }
        persistTimeout = setTimeout(() => {
            updateNodePositions(positions);
            persistTimeout = null;
        }, PERSIST_DEBOUNCE_MS);
    }, [getStoreState]);

    const getLinkDistance = useCallback((link: SimLink): number => {
        const sourceNode = typeof link.source === 'object' ? link.source : null;
        const targetNode = typeof link.target === 'object' ? link.target : null;
        const sourceLabel = sourceNode?.label?.length ?? 5;
        const targetLabel = targetNode?.label?.length ?? 5;
        const { linkDistance } = getStoreState();
        return linkDistance + (sourceLabel + targetLabel) * 2;
    }, [getStoreState]);

    const initSimulation = useCallback(() => {
        const { nodes, edges, physicsEnabled, repulsionStrength, collisionRadius } = getStoreState();

        if (!physicsEnabled || nodes.length === 0) return;

        if (simulation) simulation.stop();

        simNodes = nodes.map((node) => {
            const existing = simNodes.find((n) => n.id === node.id);
            return {
                id: node.id,
                label: node.title,
                x: existing?.x ?? node.x,
                y: existing?.y ?? node.y,
                vx: existing?.vx ?? 0,
                vy: existing?.vy ?? 0,
            };
        });

        const simLinks: SimLink[] = edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
        }));

        simulation = forceSimulation<SimNode>(simNodes)
            .force('charge', forceManyBody<SimNode>().strength(repulsionStrength))
            .force('link', forceLink<SimNode, SimLink>(simLinks)
                .id((d) => d.id)
                .distance(getLinkDistance)
                .strength(0.5)
            )
            .force('center', forceCenter(0, 0).strength(0.02))
            .force('x', forceX(0).strength(0.008))
            .force('y', forceY(0).strength(0.008))
            .force('collide', forceCollide<SimNode>()
                .radius((d) => Math.max(collisionRadius, (d.label?.length ?? 5) * 4 + 25))
                .iterations(2)
            )
            .alphaDecay(0.02) // decai mais rÇ­pido para encerrar simulaÇõÇœ sem arrastar lag
            .velocityDecay(0.2) // menos amortecimento para suavizar movimento
            .alphaMin(0.001)
            .on('tick', () => {
                const now = performance.now();
                if (now - lastTickTime < TICK_THROTTLE_MS) return;
                lastTickTime = now;

                if (reactFlowInstance) {
                    const index = new Map(simNodes.map((n) => [n.id, n]));
                    reactFlowInstance.setNodes((nodes) =>
                        nodes.map((node) => {
                            const simNode = index.get(node.id);
                            if (simNode?.x !== undefined && simNode?.y !== undefined) {
                                return {
                                    ...node,
                                    position: { x: simNode.x, y: simNode.y },
                                };
                            }
                            return node;
                        })
                    );
                }
            });

        console.log('[D3] Simulation started');
    }, [getStoreState, getLinkDistance, persistPositions]);

    // PersistÇ‰ncia ao final da simulaÇõÇœ (quando alpha chega ao alphaMin)
    useEffect(() => {
        if (simulation) {
            const handler = () => persistPositions(true);
            simulation.on('end', handler);
            return () => {
                simulation?.on('end', null);
            };
        }
    }, [persistPositions]);

    const updateNodeInSimulation = useCallback((nodeId: string, x: number, y: number) => {
        if (!simulation || simNodes.length === 0) {
            initSimulation();
            return;
        }
        const simNode = simNodes.find((n) => n.id === nodeId);
        if (simNode) {
            simNode.fx = x;
            simNode.fy = y;
            simNode.x = x;
            simNode.y = y;
        }
        if (simulation.alpha() < 0.1) {
            simulation.alpha(0.15).restart();
        }
    }, [initSimulation]);

    const releaseNode = useCallback((nodeId: string) => {
        const simNode = simNodes.find((n) => n.id === nodeId);
        if (simNode) {
            simNode.fx = null;
            simNode.fy = null;
        }
        if (simulation) simulation.alpha(RESTART_ALPHA).restart();
        persistPositions(true);
    }, [persistPositions]);

    const addNodeToSimulation = useCallback((nodeId: string, x: number, y: number, label?: string) => {
        simNodes.push({ id: nodeId, label, x, y, vx: 0, vy: 0 });
        if (simulation) {
            simulation.nodes(simNodes);
            simulation.alpha(0.5).restart();
        }
    }, []);

    const removeNodeFromSimulation = useCallback((nodeId: string) => {
        simNodes = simNodes.filter((n) => n.id !== nodeId);
        if (simulation) {
            simulation.nodes(simNodes);
            simulation.alpha(0.3).restart();
        }
    }, []);

    const reheat = useCallback(() => {
        const { physicsEnabled } = getStoreState();
        if (!physicsEnabled) return;
        if (simulation) simulation.alpha(1).restart();
    }, [getStoreState]);

    const stop = useCallback(() => {
        if (simulation) simulation.stop();
    }, []);

    useEffect(() => {
        if (rfInstance) {
            setReactFlowInstance(rfInstance);
        }
        if (!simulation) {
            const t = setTimeout(() => initSimulation(), 100);
            return () => clearTimeout(t);
        }
    }, [initSimulation, rfInstance, setReactFlowInstance]);

    useEffect(() => {
        const unsubscribe = useGraphStore.subscribe((state, prevState) => {
            if (state.physicsEnabled !== prevState.physicsEnabled) {
                if (!state.physicsEnabled && simulation) {
                    simulation.stop();
                    persistPositions(true);
                } else if (state.physicsEnabled) {
                    initSimulation();
                }
            }

            if (state.nodes.length !== prevState.nodes.length) {
                setTimeout(() => initSimulation(), 50);
            }

            if (state.edges.length !== prevState.edges.length) {
                setTimeout(() => initSimulation(), 50);
            }
        });
        return unsubscribe;
    }, [getStoreState, initSimulation, persistPositions]);

    useEffect(() => {
        return () => {
            if (persistTimeout) {
                clearTimeout(persistTimeout);
            }
        };
    }, []);

    return {
        reheat,
        stop,
        updateNodeInSimulation,
        releaseNode,
        addNodeToSimulation,
        removeNodeFromSimulation,
        initSimulation,
        persistPositions,
        setReactFlowInstance,
    };
}

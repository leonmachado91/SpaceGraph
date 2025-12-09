import { useEffect, useCallback, useRef } from 'react';
import type { ReactFlowInstance } from '@xyflow/react';
import { useGraphStore } from '@/lib/store/graphStore';
import { simulationManager, SimNode } from '@/lib/simulation/D3SimulationManager';

// ============================================================================
// USE D3 SIMULATION - Hook React para física do grafo
// ============================================================================
// Este hook conecta o D3SimulationManager ao React Flow e ao Zustand store.
// 
// Responsabilidades:
// - Sincronizar posições da simulação com o React Flow (visual)
// - Persistir posições no Zustand store (debounced)
// - Reagir a mudanças no state (physicsEnabled, nodes, edges)
// ============================================================================

const PERSIST_DEBOUNCE_MS = 800;

export function useD3Simulation(rfInstance?: ReactFlowInstance | null) {
    const getStoreState = useGraphStore.getState;
    const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // === Persistência no Zustand ===

    const persistPositions = useCallback((immediate = false) => {
        const nodes = simulationManager.getNodes();
        if (nodes.length === 0) return;

        const positions = new Map<string, { x: number; y: number }>();
        nodes.forEach((node) => {
            if (node.x !== undefined && node.y !== undefined) {
                positions.set(node.id, { x: node.x, y: node.y });
            }
        });

        if (positions.size === 0) return;

        const { updateNodePositions } = getStoreState();

        if (immediate) {
            if (persistTimeoutRef.current) {
                clearTimeout(persistTimeoutRef.current);
                persistTimeoutRef.current = null;
            }
            updateNodePositions(positions);
            return;
        }

        if (persistTimeoutRef.current) {
            clearTimeout(persistTimeoutRef.current);
        }
        persistTimeoutRef.current = setTimeout(() => {
            updateNodePositions(positions);
            persistTimeoutRef.current = null;
        }, PERSIST_DEBOUNCE_MS);
    }, [getStoreState]);

    // === Callback de Tick - Atualiza React Flow ===

    useEffect(() => {
        if (!rfInstance) return;

        simulationManager.setOnTick((simNodes: SimNode[]) => {
            const index = new Map(simNodes.map((n) => [n.id, n]));
            rfInstance.setNodes((nodes) =>
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
        });

        return () => {
            simulationManager.setOnTick(null);
        };
    }, [rfInstance]);

    // === Callback de End - Persiste posições ===

    useEffect(() => {
        simulationManager.setOnEnd(() => {
            persistPositions(true);
        });

        return () => {
            simulationManager.setOnEnd(null);
        };
    }, [persistPositions]);

    // === Sincronização com o Store ===

    useEffect(() => {
        const unsubscribe = useGraphStore.subscribe((state, prevState) => {
            // Mudança de physicsEnabled
            if (state.physicsEnabled !== prevState.physicsEnabled) {
                if (state.physicsEnabled) {
                    // Ligando a física
                    if (simulationManager.isPaused()) {
                        simulationManager.resume();
                    } else {
                        // Precisa iniciar nova simulação
                        const { nodes, edges, repulsionStrength, linkDistance, collisionRadius } = state;
                        simulationManager.start(nodes, edges, {
                            repulsionStrength,
                            linkDistance,
                            collisionRadius,
                        });
                    }
                } else {
                    // Desligando a física
                    simulationManager.pause();
                    persistPositions(true);
                }
            }

            // Mudança na quantidade de nós
            if (state.nodes.length !== prevState.nodes.length && state.physicsEnabled) {
                setTimeout(() => {
                    const { nodes, edges, repulsionStrength, linkDistance, collisionRadius } = getStoreState();
                    simulationManager.start(nodes, edges, {
                        repulsionStrength,
                        linkDistance,
                        collisionRadius,
                    });
                }, 50);
            }

            // Mudança na quantidade de edges
            if (state.edges.length !== prevState.edges.length && state.physicsEnabled) {
                setTimeout(() => {
                    const { nodes, edges, repulsionStrength, linkDistance, collisionRadius } = getStoreState();
                    simulationManager.start(nodes, edges, {
                        repulsionStrength,
                        linkDistance,
                        collisionRadius,
                    });
                }, 50);
            }

            // Mudança nas configurações de física
            if (
                state.repulsionStrength !== prevState.repulsionStrength ||
                state.linkDistance !== prevState.linkDistance ||
                state.collisionRadius !== prevState.collisionRadius
            ) {
                simulationManager.updateConfig({
                    repulsionStrength: state.repulsionStrength,
                    linkDistance: state.linkDistance,
                    collisionRadius: state.collisionRadius,
                });
            }
        });

        return unsubscribe;
    }, [getStoreState, persistPositions]);

    // === Inicialização ===

    useEffect(() => {
        const { nodes, edges, physicsEnabled, repulsionStrength, linkDistance, collisionRadius } = getStoreState();

        if (physicsEnabled && nodes.length > 0 && simulationManager.isIdle()) {
            // Pequeno delay para garantir que o React Flow está pronto
            const timeout = setTimeout(() => {
                simulationManager.start(nodes, edges, {
                    repulsionStrength,
                    linkDistance,
                    collisionRadius,
                });
            }, 100);

            return () => clearTimeout(timeout);
        }
    }, [getStoreState]);

    // === Cleanup ===

    useEffect(() => {
        return () => {
            if (persistTimeoutRef.current) {
                clearTimeout(persistTimeoutRef.current);
            }
        };
    }, []);

    // === API Pública ===

    const initSimulation = useCallback(() => {
        const { nodes, edges, physicsEnabled, repulsionStrength, linkDistance, collisionRadius } = getStoreState();
        if (!physicsEnabled) return;

        simulationManager.start(nodes, edges, {
            repulsionStrength,
            linkDistance,
            collisionRadius,
        });
    }, [getStoreState]);

    const updateNodeInSimulation = useCallback((nodeId: string, x: number, y: number) => {
        simulationManager.updateNode(nodeId, x, y);
    }, []);

    const releaseNode = useCallback((nodeId: string) => {
        simulationManager.releaseNode(nodeId);
        persistPositions(true);
    }, [persistPositions]);

    const addNodeToSimulation = useCallback((nodeId: string, x: number, y: number, label?: string) => {
        simulationManager.addNode(nodeId, x, y, label);
    }, []);

    const removeNodeFromSimulation = useCallback((nodeId: string) => {
        simulationManager.removeNode(nodeId);
    }, []);

    const reheat = useCallback(() => {
        simulationManager.reheat();
    }, []);

    const stop = useCallback(() => {
        simulationManager.stop();
    }, []);

    const pause = useCallback(() => {
        simulationManager.pause();
        persistPositions(true);
    }, [persistPositions]);

    const resume = useCallback(() => {
        simulationManager.resume();
    }, []);

    return {
        // Ciclo de vida
        initSimulation,
        stop,
        pause,
        resume,
        reheat,

        // Manipulação de nós
        updateNodeInSimulation,
        releaseNode,
        addNodeToSimulation,
        removeNodeFromSimulation,

        // Persistência
        persistPositions,

        // Estado
        isRunning: simulationManager.isRunning.bind(simulationManager),
        isPaused: simulationManager.isPaused.bind(simulationManager),
        getState: simulationManager.getState.bind(simulationManager),
    };
}

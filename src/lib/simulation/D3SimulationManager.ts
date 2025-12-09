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
import { GraphNode, GraphEdge } from '@/types/graph';

// ============================================================================
// D3 SIMULATION MANAGER - Gerenciador de Física do Grafo
// ============================================================================
// Classe singleton que encapsula toda a lógica da simulação D3.
// Separada do React para facilitar testes e manutenção.
//
// Estados:
// - IDLE: Sem simulação ativa
// - RUNNING: Simulação rodando (física ativa)
// - PAUSED: Simulação pausada (nós editáveis sem física)
// ============================================================================

// === Tipos ===

export type SimulationState = 'IDLE' | 'RUNNING' | 'PAUSED';

export interface SimNode extends SimulationNodeDatum {
    id: string;
    label?: string;
    x: number;
    y: number;
    fx?: number | null;
    fy?: number | null;
}

export interface SimLink extends SimulationLinkDatum<SimNode> {
    id: string;
}

export interface SimulationConfig {
    repulsionStrength: number;
    linkDistance: number;
    collisionRadius: number;
}

export type OnTickCallback = (nodes: SimNode[]) => void;
export type OnEndCallback = () => void;

// === Constantes ===

const DEFAULT_CONFIG: SimulationConfig = {
    repulsionStrength: -300,
    linkDistance: 150,
    collisionRadius: 40,
};

const ALPHA_DECAY = 0.02;
const VELOCITY_DECAY = 0.2;
const ALPHA_MIN = 0.001;
const CENTER_STRENGTH = 0.02;
const AXIS_STRENGTH = 0.008;

// === Classe Principal ===

class D3SimulationManager {
    private static instance: D3SimulationManager | null = null;

    private simulation: Simulation<SimNode, SimLink> | null = null;
    private nodes: SimNode[] = [];
    private links: SimLink[] = [];
    private state: SimulationState = 'IDLE';
    private config: SimulationConfig = { ...DEFAULT_CONFIG };

    // Callbacks
    private onTickCallback: OnTickCallback | null = null;
    private onEndCallback: OnEndCallback | null = null;

    // Throttling
    private lastTickTime = 0;
    private readonly TICK_THROTTLE_MS = 16; // ~60fps

    // === Singleton ===

    private constructor() {
        // Privado para forçar uso do getInstance
    }

    static getInstance(): D3SimulationManager {
        if (!D3SimulationManager.instance) {
            D3SimulationManager.instance = new D3SimulationManager();
        }
        return D3SimulationManager.instance;
    }

    // === Getters ===

    getState(): SimulationState {
        return this.state;
    }

    isRunning(): boolean {
        return this.state === 'RUNNING';
    }

    isPaused(): boolean {
        return this.state === 'PAUSED';
    }

    isIdle(): boolean {
        return this.state === 'IDLE';
    }

    getNodes(): SimNode[] {
        return this.nodes;
    }

    // === Callbacks ===

    setOnTick(callback: OnTickCallback | null): void {
        this.onTickCallback = callback;
    }

    setOnEnd(callback: OnEndCallback | null): void {
        this.onEndCallback = callback;
    }

    // === Lifecycle ===

    /**
     * Inicia uma nova simulação com os nós e edges fornecidos.
     * Se já houver uma simulação, ela será parada primeiro.
     */
    start(nodes: GraphNode[], edges: GraphEdge[], config?: Partial<SimulationConfig>): void {
        // Para qualquer simulação existente
        this.destroy();

        if (nodes.length === 0) {
            console.log('[D3] No nodes to simulate');
            return;
        }

        // Atualiza configuração
        this.config = { ...DEFAULT_CONFIG, ...config };

        // Cria nós para a simulação, preservando posições existentes se houver
        this.nodes = nodes.map(node => {
            const existing = this.nodes.find(n => n.id === node.id);
            return {
                id: node.id,
                label: node.title,
                x: existing?.x ?? node.x,
                y: existing?.y ?? node.y,
                vx: existing?.vx ?? 0,
                vy: existing?.vy ?? 0,
            };
        });

        // Cria links
        this.links = edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
        }));

        // Cria a simulação D3
        this.simulation = forceSimulation<SimNode>(this.nodes)
            .force('charge', forceManyBody<SimNode>().strength(this.config.repulsionStrength))
            .force('link', forceLink<SimNode, SimLink>(this.links)
                .id(d => d.id)
                .distance(this.getLinkDistance.bind(this))
                .strength(0.5)
            )
            .force('center', forceCenter(0, 0).strength(CENTER_STRENGTH))
            .force('x', forceX(0).strength(AXIS_STRENGTH))
            .force('y', forceY(0).strength(AXIS_STRENGTH))
            .force('collide', forceCollide<SimNode>()
                .radius(d => Math.max(this.config.collisionRadius, (d.label?.length ?? 5) * 4 + 25))
                .iterations(2)
            )
            .alphaDecay(ALPHA_DECAY)
            .velocityDecay(VELOCITY_DECAY)
            .alphaMin(ALPHA_MIN)
            .on('tick', this.handleTick.bind(this))
            .on('end', this.handleEnd.bind(this));

        this.state = 'RUNNING';
        console.log('[D3] Simulation STARTED with', nodes.length, 'nodes');
    }

    /**
     * Pausa a simulação. Os nós ficam editáveis sem física.
     */
    pause(): void {
        if (this.state !== 'RUNNING' || !this.simulation) {
            console.log('[D3] Cannot pause: not running');
            return;
        }

        this.simulation.stop();
        this.state = 'PAUSED';
        console.log('[D3] Simulation PAUSED');
    }

    /**
     * Retoma a simulação pausada.
     */
    resume(): void {
        if (this.state !== 'PAUSED' || !this.simulation) {
            console.log('[D3] Cannot resume: not paused');
            return;
        }

        this.simulation.alpha(0.3).restart();
        this.state = 'RUNNING';
        console.log('[D3] Simulation RESUMED');
    }

    /**
     * Para a simulação mas mantém os dados para possível retomada.
     */
    stop(): void {
        if (!this.simulation) return;

        this.simulation.stop();
        this.state = 'IDLE';
        console.log('[D3] Simulation STOPPED');
    }

    /**
     * Destrói completamente a simulação e limpa todos os dados.
     */
    destroy(): void {
        if (this.simulation) {
            this.simulation.stop();
            this.simulation.on('tick', null);
            this.simulation.on('end', null);
            this.simulation = null;
        }
        this.nodes = [];
        this.links = [];
        this.state = 'IDLE';
    }

    // === Manipulação de Nós ===

    /**
     * Atualiza a posição de um nó durante o drag.
     * Fixa temporariamente o nó para que a física não o mova.
     */
    updateNode(nodeId: string, x: number, y: number): void {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;

        // Fixa a posição durante o drag
        node.fx = x;
        node.fy = y;
        node.x = x;
        node.y = y;

        // Só reaquece se estiver RUNNING
        if (this.isRunning() && this.simulation) {
            if (this.simulation.alpha() < 0.1) {
                this.simulation.alpha(0.15).restart();
            }
        }
    }

    /**
     * Libera um nó do estado fixado (após fim do drag).
     */
    releaseNode(nodeId: string): void {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;

        // Libera a fixação
        node.fx = null;
        node.fy = null;

        // Só reaquece se estiver RUNNING
        if (this.isRunning() && this.simulation) {
            this.simulation.alpha(0.3).restart();
        }
    }

    /**
     * Adiciona um novo nó à simulação existente.
     */
    addNode(nodeId: string, x: number, y: number, label?: string): void {
        // Verifica se já existe
        if (this.nodes.some(n => n.id === nodeId)) return;

        this.nodes.push({
            id: nodeId,
            label,
            x,
            y,
            vx: 0,
            vy: 0,
        });

        if (this.simulation && this.isRunning()) {
            this.simulation.nodes(this.nodes);
            this.simulation.alpha(0.5).restart();
        }
    }

    /**
     * Remove um nó da simulação.
     */
    removeNode(nodeId: string): void {
        this.nodes = this.nodes.filter(n => n.id !== nodeId);

        if (this.simulation && this.isRunning()) {
            this.simulation.nodes(this.nodes);
            this.simulation.alpha(0.3).restart();
        }
    }

    // === Controle de Energia ===

    /**
     * Reaquece a simulação para reorganizar os nós.
     */
    reheat(): void {
        if (!this.isRunning() || !this.simulation) {
            console.log('[D3] Cannot reheat: not running');
            return;
        }

        this.simulation.alpha(1).restart();
        console.log('[D3] Simulation REHEATED');
    }

    /**
     * Atualiza a configuração e reinicia a simulação se necessário.
     */
    updateConfig(config: Partial<SimulationConfig>): void {
        this.config = { ...this.config, ...config };

        if (this.simulation && this.isRunning()) {
            // Atualiza forças com nova configuração
            const charge = this.simulation.force('charge') as ReturnType<typeof forceManyBody>;
            if (charge && config.repulsionStrength !== undefined) {
                charge.strength(config.repulsionStrength);
            }

            const collide = this.simulation.force('collide') as ReturnType<typeof forceCollide>;
            if (collide && config.collisionRadius !== undefined) {
                collide.radius(d => Math.max(config.collisionRadius!, ((d as SimNode).label?.length ?? 5) * 4 + 25));
            }

            // Reaquece para aplicar mudanças
            this.simulation.alpha(0.3).restart();
        }
    }

    // === Handlers Internos ===

    private handleTick(): void {
        // Throttling para performance
        const now = performance.now();
        if (now - this.lastTickTime < this.TICK_THROTTLE_MS) return;
        this.lastTickTime = now;

        if (this.onTickCallback) {
            this.onTickCallback(this.nodes);
        }
    }

    private handleEnd(): void {
        console.log('[D3] Simulation ended (alpha reached minimum)');
        if (this.onEndCallback) {
            this.onEndCallback();
        }
    }

    private getLinkDistance(link: SimLink): number {
        const sourceNode = typeof link.source === 'object' ? link.source : null;
        const targetNode = typeof link.target === 'object' ? link.target : null;
        const sourceLabel = sourceNode?.label?.length ?? 5;
        const targetLabel = targetNode?.label?.length ?? 5;
        return this.config.linkDistance + (sourceLabel + targetLabel) * 2;
    }
}

// Exporta instância singleton
export const simulationManager = D3SimulationManager.getInstance();

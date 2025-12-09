'use client';

import { memo, useState, useMemo } from 'react';
import { Handle, Position, Node, NodeProps, useViewport, useReactFlow } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { NODE, ZOOM } from '@/lib/constants';
import { useGraphStore, useDensityGenericFactor, useDensityMaxSize } from '@/lib/store/graphStore';

// ============================================================================
// GRAPH NODE - Visual representation of a knowledge node with LOD
// ============================================================================
// Level of Detail (LOD) baseado no zoom:
// - LOD_FAR (zoom < 0.4): Apenas ponto colorido
// - LOD_MEDIUM (0.4-1.0): Ícone, título e bolinhas de tags na circunferência
// - LOD_CLOSE (zoom > 1.0): Mesmo, com tooltip de tags no hover
// ============================================================================

type CustomNodeData = {
    title: string;
    color?: string;
    icon?: string;
    nodeType?: string;
    tags?: string[];
    [key: string]: unknown;
};

type CustomNodeProps = NodeProps<Node<CustomNodeData>>;

// Level of Detail baseado no zoom
// - LOD_MEDIUM (zoom < 1.0): Ícone, título e bolinhas de tags
// - LOD_CLOSE (zoom >= 1.0): Mesmo, com tooltip de tags no hover
// Nota: LOD far foi removido pois useViewport causava bugs com edges
type LODLevel = 'medium' | 'close';

function getLODLevel(zoom: number): LODLevel {
    if (zoom < ZOOM.LOD_CLOSE_THRESHOLD) return 'medium';
    return 'close';
}

function getColorFromId(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
        hash |= 0;
    }
    return NODE.COLOR_PALETTE[Math.abs(hash) % NODE.COLOR_PALETTE.length];
}

// Calcula posição de um ponto na circunferência do nó
// Ângulo em graus (0 = direita, 90 = baixo, 180 = esquerda, 270 = cima)
function getPositionOnCircle(angleDeg: number, radius: number) {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
        x: Math.cos(angleRad) * radius,
        y: Math.sin(angleRad) * radius,
    };
}

export const NODE_RADIUS = NODE.RADIUS;

function GraphNodeComponent({ id, data, selected }: CustomNodeProps) {
    const { zoom } = useViewport();
    const lod = useMemo(() => getLODLevel(zoom), [zoom]);
    // Apenas nodes (para quick add), edges via seletor
    // const { nodes } = useGraphStore.getState(); // Removido pois usamos getState direto no handler
    const storeEdges = useGraphStore((s) => s.edges); // Reativo

    const degree = useMemo(() => {
        return storeEdges.filter(e => e.source === id || e.target === id).length;
    }, [storeEdges, id]);

    const reactFlow = useReactFlow();

    // Estado local para hover (para performance)
    const [isHovered, setIsHovered] = useState(false);
    const [hoveredTagIndex, setHoveredTagIndex] = useState<number | null>(null);

    // Dados do nó
    const nodeColor = data.color || getColorFromId(id);

    // Spotlight Effect
    const searchQuery = useGraphStore((s) => s.searchQuery);
    const highlightedNodeIds = useGraphStore((s) => s.highlightedNodeIds);
    const superTags = useGraphStore((s) => s.superTags);
    const isSearching = searchQuery.length > 0;
    const isHighlighted = highlightedNodeIds.includes(id);
    const isDimmed = isSearching && !isHighlighted;

    // Tags do nó com cores
    const nodeTags = useMemo(() => {
        if (!data.tags || data.tags.length === 0) return [];
        return data.tags
            .map((tagId) => superTags.find((t) => t.id === tagId))
            .filter(Boolean)
            .slice(0, 4); // Máximo 4 tags visíveis
    }, [data.tags, superTags]);

    // Posições das tags na circunferência (parte inferior, evitando handles)
    // Handles estão em 0° (direita) e 180° (esquerda)
    // Tags ficam na parte inferior: 210°, 240°, 270°, 300°, 330° (evitando 180° e 0°)
    const tagAngles = [225, 270, 315, 135]; // Posições para até 4 tags

    // Tamanho Dinâmico
    // Base: 70px (35 * 2)
    const baseSize = NODE_RADIUS * 2;
    const growthFactor = useDensityGenericFactor();
    const maxSize = useDensityMaxSize();
    const dynamicSize = Math.min(baseSize + (degree * growthFactor), maxSize);
    const currentRadius = dynamicSize / 2;

    return (
        <div
            className={cn(
                "relative flex items-center justify-center transition-all duration-200",
                "group cursor-pointer rounded-full",
                selected ? "z-50" : "z-10",
                isDimmed && "opacity-20 pointer-events-none"
            )}
            style={{ width: dynamicSize, height: dynamicSize }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setHoveredTagIndex(null);
            }}
        >
            {/* ========== Visual completo (medium/close) ========== */}
            <>
                {/* Glow Effect */}
                <div
                    className={cn(
                        "absolute inset-[-8px] rounded-full blur-xl transition-opacity duration-300",
                        selected ? "opacity-50" : isHovered ? "opacity-30" : "opacity-0"
                    )}
                    style={{ backgroundColor: nodeColor }}
                />

                {/* Glass Orb */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-full border-2 transition-all duration-300",
                        "bg-zinc-900/80 backdrop-blur-md"
                    )}
                    style={{
                        borderColor: selected || isHovered ? nodeColor : 'rgba(255,255,255,0.1)',
                        boxShadow: selected ? `0 0 25px -5px ${nodeColor}` : isHovered ? `0 0 15px -5px ${nodeColor}` : 'none',
                    }}
                />

                {/* Handles */}
                <Handle
                    type="source"
                    position={Position.Right}
                    id="center-source"
                    className={cn(
                        "w-5! h-5! border-2! transition-all duration-200 bg-zinc-800! cursor-pointer hover:scale-125!",
                        isHovered || selected ? "opacity-100! border-white/50!" : "opacity-0!"
                    )}
                    style={{ borderColor: isHovered || selected ? nodeColor : undefined }}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Quick Add: cria nó filho a +150px à direita
                        // Busca estado atualizado diretamente da store para garantir consistência
                        const { nodes: currentNodes, edges: currentEdges } = useGraphStore.getState();
                        const currentNode = currentNodes.find(n => n.id === id);
                        if (!currentNode) return;

                        const newNodeId = crypto.randomUUID();
                        const newNode = {
                            id: newNodeId,
                            title: 'New Node',
                            type: 'default' as const,
                            x: currentNode.x + 150,
                            y: currentNode.y,
                            color: '#6366f1',
                            systemId: currentNode.systemId,
                        };
                        const newEdge = {
                            id: crypto.randomUUID(),
                            source: id,
                            target: newNodeId,
                            systemId: currentNode.systemId,
                        };

                        // Atualiza Store
                        useGraphStore.setState({
                            nodes: [...currentNodes, newNode],
                            edges: [...currentEdges, newEdge],
                        });

                        // Atualiza React Flow para que a física pegue o novo nó
                        reactFlow.addNodes({
                            id: newNodeId,
                            position: { x: newNode.x, y: newNode.y },
                            data: { title: newNode.title, color: newNode.color, tags: [] },
                            type: 'orb',
                        });

                        // Adiciona edge no RF também para visualização imediata
                        reactFlow.addEdges({
                            id: newEdge.id,
                            source: newEdge.source,
                            target: newEdge.target,
                            type: 'default',
                        });
                    }}
                />
                <Handle
                    type="target"
                    position={Position.Left}
                    id="center-target"
                    className={cn(
                        "w-5! h-5! border-2! transition-all duration-200 bg-zinc-800!",
                        isHovered || selected ? "opacity-100! border-white/50!" : "opacity-0!"
                    )}
                    style={{ borderColor: isHovered || selected ? nodeColor : undefined }}
                />

                {/* Content: Ícone + Título */}
                <div className="relative z-10 flex flex-col items-center justify-center p-2">
                    <div
                        className="w-2.5 h-2.5 rounded-full mb-1.5"
                        style={{
                            backgroundColor: nodeColor,
                            boxShadow: `0 0 8px ${nodeColor}`,
                        }}
                    />
                    <div className={cn(
                        "text-[10px] font-medium tracking-wide uppercase",
                        "max-w-[55px] truncate text-center leading-tight",
                        selected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                    )}>
                        {data.title}
                    </div>
                </div>

                {/* Tags: Bolinhas na circunferência (parte inferior) */}
                {nodeTags.length > 0 && nodeTags.map((tag, index) => {
                    const pos = getPositionOnCircle(tagAngles[index] || 270, currentRadius + 4);
                    const isTagHovered = hoveredTagIndex === index;

                    return (
                        <div
                            key={tag?.id || index}
                            className="absolute pointer-events-auto"
                            style={{
                                left: '50%',
                                top: '50%',
                                transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`,
                            }}
                            onMouseEnter={() => setHoveredTagIndex(index)}
                            onMouseLeave={() => setHoveredTagIndex(null)}
                        >
                            {/* Bolinha da tag */}
                            <div
                                className="w-3 h-3 rounded-full cursor-pointer transition-transform hover:scale-125"
                                style={{
                                    backgroundColor: tag?.color || '#666',
                                    boxShadow: `0 0 6px ${tag?.color || '#666'}`,
                                }}
                            />

                            {/* Tooltip com nome da tag (apenas no hover) */}
                            {isTagHovered && lod === 'close' && (
                                <div
                                    className={cn(
                                        "absolute left-1/2 -translate-x-1/2 z-50",
                                        "px-2 py-1 rounded-md whitespace-nowrap",
                                        "bg-zinc-800/95 backdrop-blur-sm border border-white/10",
                                        "text-[10px] text-white",
                                        "animate-in fade-in zoom-in-95 duration-150",
                                        // Posiciona tooltip baseado no ângulo
                                        tagAngles[index] > 180 ? "-top-7" : "top-5"
                                    )}
                                >
                                    {tag?.name}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Tooltip para título longo (hover no nó) */}
                {isHovered && data.title.length > 8 && (
                    <div
                        className={cn(
                            "absolute -top-10 left-1/2 -translate-x-1/2 z-50",
                            "px-2 py-1 rounded-md",
                            "bg-zinc-800/95 backdrop-blur-sm border border-white/10",
                            "text-xs text-white whitespace-nowrap",
                            "animate-in fade-in zoom-in-95 duration-150"
                        )}
                    >
                        {data.title}
                    </div>
                )}
            </>
        </div>
    );
}

export const GraphNode = memo(GraphNodeComponent);

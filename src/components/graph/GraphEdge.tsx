import { memo, useMemo } from 'react';
import { EdgeProps, EdgeLabelRenderer, useStore } from '@xyflow/react';
import { NODE_RADIUS } from './GraphNode';
import { PHYSICS } from '@/lib/constants'; // Importar PHYSICS
import { useGraphStore } from '@/lib/store/graphStore';
import { cn } from '@/lib/utils';

// ============================================================================
// GRAPH EDGE - Conexão visual dinâmica entre nós
// ============================================================================
// OTIMIZAÇÃO: Usa useStore com selector específico para evitar re-renders
// desnecessários quando outros nós mudam de posição.
// ============================================================================

interface EdgeData {
    color?: string;
    style?: 'solid' | 'dashed';
    label?: string;
}

function getPointOnCircle(
    centerX: number,
    centerY: number,
    radius: number,
    angleRad: number
): { x: number; y: number } {
    return {
        x: centerX + radius * Math.cos(angleRad),
        y: centerY + radius * Math.sin(angleRad),
    };
}

// Helper para calcular raio dinâmico (copiado do GraphNode para consistência)
function getNodeRadius(degree: number): number {
    const baseSize = NODE_RADIUS * 2;
    const growthFactor = PHYSICS.DENSITY_GENERIC_FACTOR;
    const dynamicSize = Math.min(baseSize + (degree * growthFactor), PHYSICS.DENSITY_MAX_SIZE);
    return dynamicSize / 2;
}

function GraphEdgeComponent({
    source,
    target,
    data,
    selected,
}: EdgeProps) {
    // Selector para posições dos nós
    const nodePositions = useStore((state) => {
        const sourceNode = state.nodeLookup.get(source);
        const targetNode = state.nodeLookup.get(target);
        return {
            sourceX: sourceNode?.position.x ?? 0,
            sourceY: sourceNode?.position.y ?? 0,
            targetX: targetNode?.position.x ?? 0,
            targetY: targetNode?.position.y ?? 0,
        };
    });

    // Acesso às edges do store para calcular graus
    // IMPORTANTE: Isso pode ser pesado se houver muitas edges. 
    // Em um cenário real de produção com milhares de nós, o "degree" deveria ser uma propriedade do node no store.
    const allEdges = useGraphStore((s) => s.edges);

    // Spotlight Effect
    const searchQuery = useGraphStore((s) => s.searchQuery);
    const highlightedNodeIds = useGraphStore((s) => s.highlightedNodeIds);
    const isSearching = searchQuery.length > 0;
    const isConnectedToHighlighted = highlightedNodeIds.includes(source) || highlightedNodeIds.includes(target);
    const isDimmed = isSearching && !isConnectedToHighlighted;

    const edgeData = data as EdgeData | undefined;
    const baseColor = edgeData?.color || '#8b5cf6';
    const edgeStyle = edgeData?.style || 'solid';
    const label = edgeData?.label;

    // Calcular graus e raios dinâmicos
    const { sourceRadius, targetRadius } = useMemo(() => {
        const sourceDegree = allEdges.filter(e => e.source === source || e.target === source).length;
        const targetDegree = allEdges.filter(e => e.source === target || e.target === target).length;

        return {
            sourceRadius: getNodeRadius(sourceDegree),
            targetRadius: getNodeRadius(targetDegree)
        };
    }, [allEdges, source, target]);

    // Centro dos nós
    // O centro visual não muda (é x + raio dinâmico), mas a posição (x,y) do React Flow é o canto superior esquerdo.
    // Como o tamanho do nó mudou, o offset para o centro também muda!
    // GraphNode: style={{ width: dynamicSize, height: dynamicSize }}
    // A posição (x,y) que o D3/ReactFlow devolve é o canto superior esquerdo do nó *com o tamanho dinâmico*?
    // NÃO. O D3 simula o centro (normalmente). O `useD3Simulation` atualiza a posição do nó.
    // Se o nó cresce, ele cresce a partir do centro se o CSS estiver centralizado, 
    // MAS no React Flow, x/y é top/left.
    // O GraphNode renderiza baseado em props.x/props.y? 
    // Vamos assumir que a posição x/y do nó no ReactFlow é o centro menos o raio (se o renderer fizer isso) ou top/left.
    // D3SimulationManager.ts: node.x/y são centros.
    // useD3Simulation.ts: `onTick` atualiza nodes do RF.
    // Geralmente D3 usa centro. Se RF usa top-left, precisamos converter.

    // Se assumirmos que (sourceX, sourceY) é o TopLeft do nó:
    const sourceCenterX = nodePositions.sourceX + sourceRadius;
    const sourceCenterY = nodePositions.sourceY + sourceRadius;
    const targetCenterX = nodePositions.targetX + targetRadius;
    const targetCenterY = nodePositions.targetY + targetRadius;

    // Pontos de conexão
    const { startPoint, endPoint, angle } = useMemo(() => {
        const angleToTarget = Math.atan2(
            targetCenterY - sourceCenterY,
            targetCenterX - sourceCenterX
        );
        const angleToSource = angleToTarget + Math.PI;

        const offsetStart = sourceRadius + 2; // +2px gap
        const offsetEnd = targetRadius + 16;  // +16px gap (arrow)

        const start = getPointOnCircle(sourceCenterX, sourceCenterY, offsetStart, angleToTarget);
        const end = getPointOnCircle(targetCenterX, targetCenterY, offsetEnd, angleToSource);

        return {
            startPoint: start,
            endPoint: end,
            angle: angleToTarget * (180 / Math.PI)
        };
    }, [sourceCenterX, sourceCenterY, targetCenterX, targetCenterY, sourceRadius, targetRadius]);

    const edgePath = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
    const strokeDasharray = edgeStyle === 'dashed' ? '6 4' : undefined;

    const labelX = (startPoint.x + endPoint.x) / 2;
    const labelY = (startPoint.y + endPoint.y) / 2;
    const arrowX = endPoint.x;
    const arrowY = endPoint.y;

    let labelAngle = angle;
    if (angle > 90 || angle < -90) {
        labelAngle = angle + 180;
    }

    return (
        <g
            className={cn("graph-edge-group transition-opacity duration-300", isDimmed ? "opacity-10" : "opacity-100")}
            data-selected={selected}
        >
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={40}
                className="edge-hitarea"
            />
            <path
                d={edgePath}
                fill="none"
                stroke={baseColor}
                strokeWidth={12}
                strokeLinecap="round"
                className="edge-glow blur-[6px]"
            />
            <path
                d={edgePath}
                fill="none"
                stroke={baseColor}
                strokeWidth={2}
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                className="edge-line"
            />
            <g
                transform={`translate(${arrowX}, ${arrowY}) rotate(${angle})`}
                className="edge-arrow"
            >
                <polygon points="0,-5 12,0 0,5" fill={baseColor} />
            </g>
            {label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px) rotate(${labelAngle}deg)`,
                            pointerEvents: 'none',
                        }}
                        className="text-xs text-zinc-300 font-medium whitespace-nowrap px-1.5 py-0.5 bg-[#0a0a0f] rounded"
                    >
                        {label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </g>
    );
}

export const GraphEdge = memo(GraphEdgeComponent);

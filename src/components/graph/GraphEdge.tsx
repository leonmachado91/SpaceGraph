'use client';

import { memo, useMemo } from 'react';
import { EdgeProps, EdgeLabelRenderer, useStore } from '@xyflow/react';
import { NODE_RADIUS } from './GraphNode';

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

function GraphEdgeComponent({
    source,
    target,
    data,
    selected,
}: EdgeProps) {
    // OTIMIZAÇÃO: Selector específico que só atualiza quando source ou target mudam
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

    const edgeData = data as EdgeData | undefined;
    const baseColor = edgeData?.color || '#8b5cf6';
    const edgeStyle = edgeData?.style || 'solid';
    const label = edgeData?.label;

    // Centro dos nós
    const sourceCenterX = nodePositions.sourceX + NODE_RADIUS;
    const sourceCenterY = nodePositions.sourceY + NODE_RADIUS;
    const targetCenterX = nodePositions.targetX + NODE_RADIUS;
    const targetCenterY = nodePositions.targetY + NODE_RADIUS;

    // Pontos de conexão na borda dos círculos
    const { startPoint, endPoint, angle } = useMemo(() => {
        const angleToTarget = Math.atan2(
            targetCenterY - sourceCenterY,
            targetCenterX - sourceCenterX
        );
        const angleToSource = angleToTarget + Math.PI;

        const start = getPointOnCircle(sourceCenterX, sourceCenterY, NODE_RADIUS + 2, angleToTarget);
        const end = getPointOnCircle(targetCenterX, targetCenterY, NODE_RADIUS + 16, angleToSource);

        return {
            startPoint: start,
            endPoint: end,
            angle: angleToTarget * (180 / Math.PI)
        };
    }, [sourceCenterX, sourceCenterY, targetCenterX, targetCenterY]);

    const edgePath = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
    const labelX = (startPoint.x + endPoint.x) / 2;
    const labelY = (startPoint.y + endPoint.y) / 2;
    const arrowX = endPoint.x;
    const arrowY = endPoint.y;
    const strokeDasharray = edgeStyle === 'dashed' ? '6 4' : undefined;

    let labelAngle = angle;
    if (angle > 90 || angle < -90) {
        labelAngle = angle + 180;
    }

    return (
        <g className="graph-edge-group" data-selected={selected}>
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
                className="edge-glow"
                style={{ filter: 'blur(6px)' }}
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

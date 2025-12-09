'use client';

import { memo, useState } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

// ============================================================================
// GRAPH NODE - Visual representation of a knowledge node
// ============================================================================
// Usa um único handle centralizado. As conexões visuais são calculadas
// dinamicamente no GraphEdge baseado no ângulo entre os nós.
// ============================================================================

type CustomNodeData = {
    title: string;
    color?: string;
    icon?: string;
    nodeType?: string;
    [key: string]: unknown;
};

type CustomNodeProps = NodeProps<Node<CustomNodeData>>;

// Cores predefinidas para nós sem cor específica
const DEFAULT_COLORS = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#ec4899', // pink
    '#f43f5e', // rose
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#3b82f6', // blue
];

function getColorFromId(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
        hash |= 0;
    }
    return DEFAULT_COLORS[Math.abs(hash) % DEFAULT_COLORS.length];
}

// Tamanho do nó para cálculos de borda
export const NODE_RADIUS = 35; // Raio do círculo (width/2)

function GraphNodeComponent({ id, data, selected }: CustomNodeProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Cor do nó: usa data.color se existir, senão gera baseado no ID
    const nodeColor = data.color || getColorFromId(id);

    return (
        <div
            className={cn(
                "relative flex items-center justify-center rounded-full transition-all duration-300",
                "group cursor-pointer",
                "animate-in zoom-in-50 fade-in duration-300",
                selected
                    ? "scale-110 z-50"
                    : "scale-100 hover:scale-105 z-10"
            )}
            style={{
                width: NODE_RADIUS * 2,
                height: NODE_RADIUS * 2,
            }}
            onMouseEnter={() => {
                setIsHovered(true);
                if (data.title.length > 8) {
                    setTimeout(() => setShowTooltip(true), 500);
                }
            }}
            onMouseLeave={() => {
                setIsHovered(false);
                setShowTooltip(false);
            }}
        >
            {/* Glow Effect Layer */}
            <div
                className={cn(
                    "absolute inset-[-8px] rounded-full blur-xl transition-opacity duration-300",
                    selected ? "opacity-50" : isHovered ? "opacity-30" : "opacity-0"
                )}
                style={{ backgroundColor: nodeColor }}
            />

            {/* Glass Orb Layer */}
            <div
                className={cn(
                    "absolute inset-0 rounded-full border-2 transition-all duration-300",
                    "bg-zinc-900/80 backdrop-blur-md shadow-lg",
                    selected
                        ? "shadow-[0_0_25px_-5px_var(--node-color)]"
                        : isHovered
                            ? "shadow-[0_0_15px_-5px_var(--node-color)]"
                            : ""
                )}
                style={{
                    borderColor: selected || isHovered ? nodeColor : 'rgba(255,255,255,0.1)',
                    '--node-color': nodeColor,
                } as React.CSSProperties}
            />

            {/* Handle SOURCE - visível no hover, lado direito */}
            <Handle
                type="source"
                position={Position.Right}
                id="center-source"
                className={cn(
                    "w-5! h-5! border-2! transition-all duration-200",
                    "bg-zinc-800!",
                    isHovered || selected
                        ? "opacity-100! border-white/50!"
                        : "opacity-0!"
                )}
                style={{
                    borderColor: isHovered || selected ? nodeColor : undefined,
                }}
            />
            {/* Handle TARGET - visível no hover, lado esquerdo */}
            <Handle
                type="target"
                position={Position.Left}
                id="center-target"
                className={cn(
                    "w-5! h-5! border-2! transition-all duration-200",
                    "bg-zinc-800!",
                    isHovered || selected
                        ? "opacity-100! border-white/50!"
                        : "opacity-0!"
                )}
                style={{
                    borderColor: isHovered || selected ? nodeColor : undefined,
                }}
            />

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col items-center justify-center p-2">
                {/* Indicator dot */}
                <div
                    className="w-2.5 h-2.5 rounded-full mb-1.5 transition-transform duration-200"
                    style={{
                        backgroundColor: nodeColor,
                        transform: selected ? 'scale(1.2)' : 'scale(1)',
                        boxShadow: `0 0 8px ${nodeColor}`,
                    }}
                />

                {/* Title */}
                <div className={cn(
                    "text-[10px] font-medium tracking-wide uppercase transition-colors duration-200",
                    "max-w-[55px] truncate text-center leading-tight",
                    selected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                )}>
                    {data.title}
                </div>
            </div>

            {/* Tooltip para títulos longos */}
            {showTooltip && data.title.length > 8 && (
                <div
                    className={cn(
                        "absolute -top-10 left-1/2 -translate-x-1/2 z-[100]",
                        "px-2 py-1 rounded-md",
                        "bg-zinc-800/95 backdrop-blur-sm border border-white/10",
                        "text-xs text-white whitespace-nowrap",
                        "animate-in fade-in zoom-in-95 duration-150"
                    )}
                >
                    {data.title}
                </div>
            )}
        </div>
    );
}

export const GraphNode = memo(GraphNodeComponent);

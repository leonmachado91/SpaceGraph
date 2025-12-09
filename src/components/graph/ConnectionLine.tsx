'use client';

import { ConnectionLineComponentProps, getStraightPath } from '@xyflow/react';

// ============================================================================
// CONNECTION LINE - Visual da linha durante arraste de conexão
// ============================================================================

export function ConnectionLine({
    fromX,
    fromY,
    toX,
    toY,
}: ConnectionLineComponentProps) {
    const [edgePath] = getStraightPath({
        sourceX: fromX,
        sourceY: fromY,
        targetX: toX,
        targetY: toY,
    });

    return (
        <g>
            {/* Glow effect */}
            <path
                d={edgePath}
                fill="none"
                stroke="#6366f1"
                strokeWidth={6}
                strokeOpacity={0.3}
                style={{ filter: 'blur(4px)' }}
            />
            {/* Main line - dashed */}
            <path
                d={edgePath}
                fill="none"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="8 4"
                className="animate-pulse"
            />
            {/* Target indicator circle */}
            <circle
                cx={toX}
                cy={toY}
                r={8}
                fill="none"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="4 2"
                className="animate-pulse"
            />
        </g>
    );
}

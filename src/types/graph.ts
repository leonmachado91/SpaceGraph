export type NodeType = 'default' | 'note' | 'group' | 'image';
export type EdgeType = 'default' | 'step' | 'smoothstep' | 'straight';

// ============================================================================
// SUPERTAGS - Sistema de tags com campos dinâmicos
// ============================================================================

export type TagFieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox';

export interface TagField {
    id: string;
    name: string;
    type: TagFieldType;
    options?: string[]; // Para type: 'select'
    defaultValue?: string | number | boolean;
}

export interface SuperTag {
    id: string;
    name: string;
    color: string;
    icon?: string;
    fields: TagField[];
}

// ============================================================================
// GRAPH ENTITIES
// ============================================================================

export interface GraphNode {
    id: string;
    title: string;
    type: NodeType;
    x: number;
    y: number;
    color?: string;
    icon?: string;
    content?: string;
    tags?: string[]; // IDs das SuperTags aplicadas
    properties?: Record<string, unknown>; // Valores dos campos herdados das tags
    systemId: string;
}

export type EdgeStyle = 'solid' | 'dashed';

export interface GraphEdge {
    id: string;
    source: string;
    target: string;

    // Propriedades visuais
    label?: string;
    color?: string;
    style?: EdgeStyle;      // solid | dashed
    animated?: boolean;     // Partículas animadas (futuro)
    type?: EdgeType;

    // Propriedades ricas (igual aos nodes)
    content?: string;       // Notas/descrição da conexão
    tags?: string[];        // SuperTags aplicadas
    properties?: Record<string, unknown>; // Campos herdados das tags

    systemId: string;
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}


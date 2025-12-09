// ============================================================================
// CONSTANTES DO NEOGRAPH
// ============================================================================
// Valores centralizados para facilitar manutenção e consistência.
// ============================================================================

// === Nós ===

export const NODE = {
    /** Raio visual do nó circular (metade do diâmetro) */
    RADIUS: 35,
    /** Cor padrão para nós sem cor definida */
    DEFAULT_COLOR: '#6366f1', // indigo
    /** Cores disponíveis para selection automática baseada em ID */
    COLOR_PALETTE: [
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
    ],
} as const;

// === Edges ===

export const EDGE = {
    /** Cor padrão para edges sem cor definida */
    DEFAULT_COLOR: '#8b5cf6', // violet
    /** Largura visual da linha */
    STROKE_WIDTH: 2,
    /** Largura do glow */
    GLOW_WIDTH: 12,
    /** Largura da área clicável (hitbox) */
    HITBOX_WIDTH: 40,
} as const;

// === Física D3 ===

export const PHYSICS = {
    /** Taxa de decaimento do alpha (energia) */
    ALPHA_DECAY: 0.02,
    /** Decaimento de velocidade (amortecimento) */
    VELOCITY_DECAY: 0.2,
    /** Alpha mínimo antes de parar a simulação */
    ALPHA_MIN: 0.001,
    /** Força de atração para o centro */
    CENTER_STRENGTH: 0.05,
    /** Força de atração para os eixos X/Y */
    AXIS_STRENGTH: 0.02,
    /** Força de repulsão padrão entre nós */
    REPULSION_DEFAULT: -300,
    /** Distância padrão de links */
    LINK_DISTANCE_DEFAULT: 100,
    /** Raio de colisão padrão */
    COLLISION_RADIUS_DEFAULT: 40,
    /** Intervalo mínimo entre ticks (em ms) para throttling */
    TICK_THROTTLE_MS: 16, // ~60fps
    /** Debounce para persistir posições (em ms) */
    PERSIST_DEBOUNCE_MS: 800,
    /** Alpha ao reiniciar simulação após mudança */
    RESTART_ALPHA: 0.3,
    /** Fator de crescimento visual do raio do nó por conexão */
    DENSITY_GENERIC_FACTOR: 15,
    /** Tamanho visual máximo do nó (em pixels) */
    DENSITY_MAX_SIZE: 800,
    /** Fator de aumento da força de repulsão por conexão (0.2 = +20%) */
    DENSITY_CHARGE_FACTOR: 0.2,
} as const;

// === UI ===

export const UI = {
    /** Z-index do toolbar flutuante */
    TOOLBAR_Z_INDEX: 50,
    /** Z-index da sidebar */
    SIDEBAR_Z_INDEX: 40,
    /** Z-index do modal/overlay */
    MODAL_Z_INDEX: 60,
    /** Largura padrão da sidebar */
    SIDEBAR_WIDTH: 340,
    /** Duração de animações em ms */
    ANIMATION_DURATION: 200,
    /** Debounce para salvar edições de texto */
    SAVE_DEBOUNCE_MS: 1000,
} as const;

// === Histórico ===

export const HISTORY = {
    /** Número máximo de snapshots no histórico de undo */
    MAX_SNAPSHOTS: 50,
} as const;

// === Zoom ===

export const ZOOM = {
    /** Zoom mínimo permitido */
    MIN: 0.1,
    /** Zoom máximo permitido */
    MAX: 4,
    /** Threshold para Galaxy View (apenas pontos) */
    GALAXY_THRESHOLD: 0.5,
    /** Threshold para Detail View (tags, quick add) */
    DETAIL_THRESHOLD: 1.2,
    /** LOD: Threshold abaixo do qual mostra apenas ponto colorido */
    LOD_FAR_THRESHOLD: 0.4,
    /** LOD: Threshold acima do qual mostra nomes das tags */
    LOD_CLOSE_THRESHOLD: 1.0,
} as const;

// === Cores do Tema ===

export const THEME = {
    /** Cor de fundo do canvas (centro do gradiente) */
    CANVAS_BG_CENTER: '#1a1a2e',
    /** Cor de fundo do canvas (borda do gradiente) */
    CANVAS_BG_EDGE: '#0a0a0f',
    /** Cor de texto primário */
    TEXT_PRIMARY: '#f4f4f5', // zinc-100
    /** Cor de texto secundário */
    TEXT_SECONDARY: '#a1a1aa', // zinc-400
    /** Cor de seleção/foco */
    SELECTION_COLOR: '#8b5cf6', // violet-500
    /** Cor de ação/link */
    ACTION_COLOR: '#3b82f6', // blue-500
    /** Cor de perigo/erro */
    DANGER_COLOR: '#f43f5e', // rose-500
} as const;

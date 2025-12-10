// ============================================================================
// NEO GRAPH CONSTANTS
// ============================================================================
// Centralized values for easier maintenance and consistency.
// ============================================================================

// === Nodes ===

export const NODE = {
    /** Visual radius (half diameter) */
    RADIUS: 35,
    /** Default color when none is set */
    DEFAULT_COLOR: '#6366f1', // indigo
    /** Palette used for automatic selection based on ID */
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
    /** Default color for edges */
    DEFAULT_COLOR: '#8b5cf6', // violet
    /** Line width */
    STROKE_WIDTH: 2,
    /** Glow width */
    GLOW_WIDTH: 12,
    /** Clickable hitbox width */
    HITBOX_WIDTH: 40,
} as const;

// === D3 Physics ===

export const PHYSICS = {
    /** Alpha decay rate */
    ALPHA_DECAY: 0.02,
    /** Velocity decay (damping) */
    VELOCITY_DECAY: 0.2,
    /** Minimum alpha before stopping */
    ALPHA_MIN: 0.001,
    /** Attraction to center */
    CENTER_STRENGTH: 0.05,
    /** Attraction to X/Y axis */
    AXIS_STRENGTH: 0.02,
    /** Default repulsion between nodes */
    REPULSION_DEFAULT: -300,
    /** Default link distance */
    LINK_DISTANCE_DEFAULT: 100,
    /** Default collision radius */
    COLLISION_RADIUS_DEFAULT: 40,
    /** Min interval between ticks (ms) for throttling */
    TICK_THROTTLE_MS: 16, // ~60fps
    /** Debounce to persist positions (ms) */
    PERSIST_DEBOUNCE_MS: 800,
    /** Alpha when restarting simulation after change */
    RESTART_ALPHA: 0.3,
    /** Visual growth factor per connection */
    DENSITY_GENERIC_FACTOR: 15,
    /** Maximum visual size (pixels) */
    DENSITY_MAX_SIZE: 800,
    /** Repulsion increase factor per connection (0.2 = +20%) */
    DENSITY_CHARGE_FACTOR: 0.2,
} as const;

// === UI ===

export const UI = {
    /** Floating toolbar z-index */
    TOOLBAR_Z_INDEX: 50,
    /** Sidebar z-index */
    SIDEBAR_Z_INDEX: 40,
    /** Modal/overlay z-index */
    MODAL_Z_INDEX: 60,
    /** Default sidebar width */
    SIDEBAR_WIDTH: 340,
    /** Animation duration in ms */
    ANIMATION_DURATION: 200,
    /** Debounce for saving text edits */
    SAVE_DEBOUNCE_MS: 1000,
} as const;

// === History ===

export const HISTORY = {
    /** Max undo snapshots */
    MAX_SNAPSHOTS: 50,
} as const;

// === Zoom ===

export const ZOOM = {
    /** Minimum zoom */
    MIN: 0.1,
    /** Maximum zoom */
    MAX: 4,
    /** Threshold for galaxy view (dots only) */
    GALAXY_THRESHOLD: 0.5,
    /** Threshold for detail view (tags, quick add) */
    DETAIL_THRESHOLD: 1.2,
    /** LOD: below this shows dot only */
    LOD_FAR_THRESHOLD: 0.4,
    /** LOD: above this shows tag names */
    LOD_CLOSE_THRESHOLD: 1.0,
} as const;

// === Theme colors ===

export const THEME = {
    /** Canvas background (gradient center) */
    CANVAS_BG_CENTER: '#1a1a2e',
    /** Canvas background (gradient edge) */
    CANVAS_BG_EDGE: '#0a0a0f',
    /** Primary text color */
    TEXT_PRIMARY: '#f4f4f5', // zinc-100
    /** Secondary text color */
    TEXT_SECONDARY: '#a1a1aa', // zinc-400
    /** Selection/focus color */
    SELECTION_COLOR: '#8b5cf6', // violet-500
    /** Action/link color */
    ACTION_COLOR: '#3b82f6', // blue-500
    /** Danger/error color */
    DANGER_COLOR: '#f43f5e', // rose-500
} as const;

'use client';

import { useEffect, useState, useRef } from 'react';
import {
    Play, Pause, Grid3X3, Settings,
    Undo2, Redo2, Search, X, ZoomIn, ZoomOut, Maximize,
    Eye, Tag, Network, List, Clock
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useGraphStore, usePhysicsEnabled, useShowGrid, useCanUndo, useCanRedo, useNodes } from '@/lib/store/graphStore';
import { cn } from '@/lib/utils';

// ============================================================================
// CANVAS TOOLBAR - Barra de ferramentas unificada
// ============================================================================
// Contém todos os controles: Undo/Redo, Física, Grid, Zoom, Busca, Settings
// ============================================================================

interface ToolbarButtonProps {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                "p-2.5 rounded-lg transition-all duration-200",
                "hover:bg-white/10 active:scale-95",
                "text-zinc-400 hover:text-white",
                active && "bg-indigo-500/20 text-indigo-400 hover:text-indigo-300",
                disabled && "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-zinc-400"
            )}
        >
            {children}
        </button>
    );
}

function ToolbarDivider() {
    return <div className="w-px h-6 bg-white/10 mx-1" />;
}

interface CanvasToolbarProps {
    onOpenSettings: () => void;
    onOpenTagManager: () => void;
}

type ViewMode = 'graph' | 'list' | 'timeline';

const viewModes = [
    { id: 'graph' as const, icon: Network, label: 'Grafo', available: true },
    { id: 'list' as const, icon: List, label: 'Lista', available: false },
    { id: 'timeline' as const, icon: Clock, label: 'Timeline', available: false },
];

export function CanvasToolbar({ onOpenSettings, onOpenTagManager }: CanvasToolbarProps) {
    const reactFlow = useReactFlow();
    const inputRef = useRef<HTMLInputElement>(null);

    const [searchOpen, setSearchOpen] = useState(false);
    const [viewMenuOpen, setViewMenuOpen] = useState(false);
    const [currentView, setCurrentView] = useState<ViewMode>('graph');

    const physicsEnabled = usePhysicsEnabled();
    const showGrid = useShowGrid();
    const canUndo = useCanUndo();
    const canRedo = useCanRedo();
    const nodes = useNodes();

    const searchQuery = useGraphStore((s) => s.searchQuery);
    const highlightedNodeIds = useGraphStore((s) => s.highlightedNodeIds);
    const setSearchQuery = useGraphStore((s) => s.setSearchQuery);
    const clearSearch = useGraphStore((s) => s.clearSearch);

    const { togglePhysics, toggleGrid, undo, redo, selectNode } = useGraphStore();

    // Resultados da busca
    const searchResults = nodes.filter((n) => highlightedNodeIds.includes(n.id));

    // Focus no input quando abre
    useEffect(() => {
        if (searchOpen) {
            inputRef.current?.focus();
        }
    }, [searchOpen]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setSearchOpen(false);
            clearSearch();
        }
    };

    const handleResultClick = (nodeId: string) => {
        selectNode(nodeId);
        // Move câmera para o nó
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            reactFlow.setCenter(node.x, node.y, { zoom: 1.5, duration: 800 });
        }
        // Fecha busca
        setSearchOpen(false);
    };

    // Hotkey Ctrl+K para abrir busca
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
            {/* Main Bar */}
            <div
                className={cn(
                    "flex items-center gap-1 p-1.5 rounded-xl",
                    "bg-zinc-900/80 backdrop-blur-xl",
                    "border border-white/10",
                    "shadow-lg shadow-black/20"
                )}
            >
                {/* Visualizations Dropdown Trigger */}
                <div className="relative">
                    <ToolbarButton
                        onClick={() => setViewMenuOpen(!viewMenuOpen)}
                        active={viewMenuOpen}
                        title="Modo de Visualização"
                    >
                        <Eye size={18} />
                    </ToolbarButton>

                    {/* Dropdown Menu */}
                    {viewMenuOpen && (
                        <div className={cn(
                            "absolute top-full left-0 mt-2 p-1 min-w-[150px]",
                            "bg-zinc-900/95 backdrop-blur-xl rounded-xl",
                            "border border-white/10 shadow-xl",
                            "flex flex-col gap-0.5"
                        )}>
                            {viewModes.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => {
                                        if (mode.available) {
                                            setCurrentView(mode.id);
                                            setViewMenuOpen(false);
                                        }
                                    }}
                                    disabled={!mode.available}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                        "hover:bg-white/10 text-left",
                                        currentView === mode.id ? "text-indigo-400 bg-indigo-500/10" : "text-zinc-400",
                                        !mode.available && "opacity-40 cursor-not-allowed"
                                    )}
                                >
                                    <mode.icon size={14} />
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <ToolbarDivider />

                {/* Undo */}
                <ToolbarButton onClick={undo} disabled={!canUndo} title="Desfazer (Ctrl+Z)">
                    <Undo2 size={18} />
                </ToolbarButton>

                {/* Redo */}
                <ToolbarButton onClick={redo} disabled={!canRedo} title="Refazer (Ctrl+Shift+Z)">
                    <Redo2 size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Toggle Física */}
                <ToolbarButton
                    onClick={togglePhysics}
                    active={physicsEnabled}
                    title={physicsEnabled ? "Pausar Física" : "Ativar Física"}
                >
                    {physicsEnabled ? <Pause size={18} /> : <Play size={18} />}
                </ToolbarButton>

                {/* Toggle Grid */}
                <ToolbarButton
                    onClick={toggleGrid}
                    active={showGrid}
                    title={showGrid ? "Esconder Grid" : "Mostrar Grid"}
                >
                    <Grid3X3 size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Zoom Out */}
                <ToolbarButton onClick={() => reactFlow.zoomOut({ duration: 200 })} title="Zoom Out">
                    <ZoomOut size={18} />
                </ToolbarButton>

                {/* Fit View */}
                <ToolbarButton onClick={() => reactFlow.fitView({ duration: 300 })} title="Ajustar à Tela">
                    <Maximize size={18} />
                </ToolbarButton>

                {/* Zoom In */}
                <ToolbarButton onClick={() => reactFlow.zoomIn({ duration: 200 })} title="Zoom In">
                    <ZoomIn size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* SuperTags */}
                <ToolbarButton onClick={onOpenTagManager} title="Gerenciar SuperTags">
                    <Tag size={18} />
                </ToolbarButton>

                {/* Search */}
                <ToolbarButton
                    onClick={() => setSearchOpen(!searchOpen)}
                    active={searchOpen}
                    title="Buscar (Ctrl+K)"
                >
                    <Search size={18} />
                </ToolbarButton>

                {/* Settings */}
                <ToolbarButton onClick={onOpenSettings} title="Configurações">
                    <Settings size={18} />
                </ToolbarButton>
            </div>

            {/* Search Bar + Resultados (expandido) */}
            {searchOpen && (
                <div
                    className={cn(
                        "mt-2 w-[400px] max-h-[60vh] flex flex-col",
                        "bg-zinc-900/95 backdrop-blur-xl rounded-xl",
                        "border border-white/10 shadow-2xl shadow-black/50",
                        "animate-in slide-in-from-top-2 duration-200"
                    )}
                >
                    {/* Header: Input */}
                    <div className="flex items-center gap-3 p-3 border-b border-white/5">
                        <Search className="text-zinc-500" size={18} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={handleSearch}
                            onKeyDown={handleKeyDown}
                            placeholder="Buscar nós..."
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-500 text-sm"
                        />
                        {searchQuery && (
                            <button onClick={clearSearch} title="Limpar busca" className="text-zinc-500 hover:text-white">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Results List */}
                    {searchQuery && (
                        <div className="overflow-y-auto p-1 custom-scrollbar">
                            {searchResults.length === 0 ? (
                                <div className="p-4 text-center text-zinc-500 text-sm">
                                    Nenhum resultado encontrado
                                </div>
                            ) : (
                                <div className="flex flex-col gap-0.5">
                                    {searchResults.map((node) => (
                                        <button
                                            key={node.id}
                                            onClick={() => handleResultClick(node.id)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: node.color || '#6366f1' }}
                                            />
                                            <span className="text-zinc-300 group-hover:text-white text-sm truncate flex-1">
                                                {node.title || 'Untitled Node'}
                                            </span>
                                            {node.tags && node.tags.length > 0 && (
                                                <div className="flex gap-1">
                                                    {node.tags.slice(0, 2).map(tag => (
                                                        <span key={tag} className="text-[10px] uppercase bg-white/5 px-1.5 py-0.5 rounded text-zinc-500">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

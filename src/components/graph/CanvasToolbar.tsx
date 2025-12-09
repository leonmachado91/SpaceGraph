'use client';

import { useEffect } from 'react';
import { Play, Pause, Grid3X3, Sparkles, Settings, Undo2, Redo2 } from 'lucide-react';
import { useGraphStore, usePhysicsEnabled, useShowGrid, useCanUndo, useCanRedo } from '@/lib/store/graphStore';
import { cn } from '@/lib/utils';

// ============================================================================
// CANVAS TOOLBAR - Controles flutuantes do canvas
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

interface CanvasToolbarProps {
    onOpenSettings: () => void;
    onReheat: () => void;
}

export function CanvasToolbar({ onOpenSettings, onReheat }: CanvasToolbarProps) {
    const physicsEnabled = usePhysicsEnabled();
    const showGrid = useShowGrid();
    const canUndo = useCanUndo();
    const canRedo = useCanRedo();
    const { togglePhysics, toggleGrid, undo, redo } = useGraphStore();

    // Atalhos de teclado para Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignora se estiver digitando em um input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Ctrl+Z = Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            // Ctrl+Shift+Z ou Ctrl+Y = Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || e.key === 'y')) {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    return (
        <div
            className={cn(
                "absolute top-4 left-1/2 -translate-x-1/2 z-50",
                "flex items-center gap-1 px-2 py-1.5 rounded-xl",
                // Glassmorphism
                "bg-zinc-900/80 backdrop-blur-xl",
                "border border-white/10",
                "shadow-lg shadow-black/20"
            )}
        >
            {/* Undo */}
            <ToolbarButton
                onClick={undo}
                disabled={!canUndo}
                title="Desfazer (Ctrl+Z)"
            >
                <Undo2 size={18} />
            </ToolbarButton>

            {/* Redo */}
            <ToolbarButton
                onClick={redo}
                disabled={!canRedo}
                title="Refazer (Ctrl+Shift+Z)"
            >
                <Redo2 size={18} />
            </ToolbarButton>

            {/* Divider */}
            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Toggle Física */}
            <ToolbarButton
                onClick={togglePhysics}
                active={physicsEnabled}
                title={physicsEnabled ? "Pausar Física" : "Ativar Física"}
            >
                {physicsEnabled ? <Pause size={18} /> : <Play size={18} />}
            </ToolbarButton>

            {/* Reheat / Reorganizar */}
            <ToolbarButton
                onClick={onReheat}
                title="Reorganizar Nós"
            >
                <Sparkles size={18} />
            </ToolbarButton>

            {/* Toggle Grid */}
            <ToolbarButton
                onClick={toggleGrid}
                active={showGrid}
                title={showGrid ? "Esconder Grid" : "Mostrar Grid"}
            >
                <Grid3X3 size={18} />
            </ToolbarButton>

            {/* Divider */}
            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Settings */}
            <ToolbarButton
                onClick={onOpenSettings}
                title="Configurações Avançadas"
            >
                <Settings size={18} />
            </ToolbarButton>
        </div>
    );
}

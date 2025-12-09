'use client';

import { X } from 'lucide-react';
import { useGraphStore, usePhysicsEnabled, useRepulsionStrength, useLinkDistance, useCollisionRadius } from '@/lib/store/graphStore';
import { cn } from '@/lib/utils';

// ============================================================================
// SETTINGS PANEL - Painel de configurações avançadas
// ============================================================================

interface SliderControlProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    formatValue?: (value: number) => string;
}

function SliderControl({ label, value, min, max, step = 1, onChange, formatValue }: SliderControlProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm text-zinc-400">{label}</label>
                <span className="text-sm font-mono text-zinc-300">
                    {formatValue ? formatValue(value) : value}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className={cn(
                    "w-full h-1.5 rounded-full appearance-none cursor-pointer",
                    "bg-zinc-700",
                    "[&::-webkit-slider-thumb]:appearance-none",
                    "[&::-webkit-slider-thumb]:w-4",
                    "[&::-webkit-slider-thumb]:h-4",
                    "[&::-webkit-slider-thumb]:rounded-full",
                    "[&::-webkit-slider-thumb]:bg-indigo-500",
                    "[&::-webkit-slider-thumb]:hover:bg-indigo-400",
                    "[&::-webkit-slider-thumb]:transition-colors"
                )}
            />
        </div>
    );
}

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onReinitSimulation: () => void;
}

export function SettingsPanel({ isOpen, onClose, onReinitSimulation }: SettingsPanelProps) {
    const physicsEnabled = usePhysicsEnabled();
    const repulsionStrength = useRepulsionStrength();
    const linkDistance = useLinkDistance();
    const collisionRadius = useCollisionRadius();

    const {
        setRepulsionStrength,
        setLinkDistance,
        setCollisionRadius,
        togglePhysics,
    } = useGraphStore();

    // Handler que atualiza store E reinicia simulação
    const handleRepulsionChange = (value: number) => {
        setRepulsionStrength(value);
        setTimeout(() => onReinitSimulation(), 50);
    };

    const handleLinkDistanceChange = (value: number) => {
        setLinkDistance(value);
        setTimeout(() => onReinitSimulation(), 50);
    };

    const handleCollisionChange = (value: number) => {
        setCollisionRadius(value);
        setTimeout(() => onReinitSimulation(), 50);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={cn(
                    "fixed right-0 top-0 h-full w-80 z-50",
                    "bg-zinc-900/95 backdrop-blur-xl",
                    "border-l border-white/10",
                    "shadow-2xl shadow-black/50",
                    "flex flex-col",
                    "animate-in slide-in-from-right duration-200"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white">Configurações</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Physics Toggle */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-300">Física Ativa</span>
                        <button
                            onClick={togglePhysics}
                            className={cn(
                                "w-12 h-6 rounded-full transition-colors duration-200",
                                "relative",
                                physicsEnabled ? "bg-indigo-500" : "bg-zinc-700"
                            )}
                        >
                            <span
                                className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200",
                                    physicsEnabled ? "left-7" : "left-1"
                                )}
                            />
                        </button>
                    </div>

                    <hr className="border-white/10" />

                    {/* Força de Repulsão */}
                    <SliderControl
                        label="Força de Repulsão"
                        value={repulsionStrength}
                        min={-500}
                        max={-50}
                        step={10}
                        onChange={handleRepulsionChange}
                    />

                    {/* Distância de Links */}
                    <SliderControl
                        label="Distância de Links"
                        value={linkDistance}
                        min={50}
                        max={300}
                        step={10}
                        onChange={handleLinkDistanceChange}
                        formatValue={(v) => `${v}px`}
                    />

                    {/* Raio de Colisão */}
                    <SliderControl
                        label="Raio de Colisão"
                        value={collisionRadius}
                        min={20}
                        max={100}
                        step={5}
                        onChange={handleCollisionChange}
                        formatValue={(v) => `${v}px`}
                    />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10">
                    <p className="text-xs text-zinc-500 text-center">
                        Ajuste os valores e veja as mudanças em tempo real
                    </p>
                </div>
            </div>
        </>
    );
}

'use client';

import { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { useGraphStore } from '@/lib/store/graphStore';
import { TagField, TagFieldType } from '@/types/graph';
import { cn } from '@/lib/utils';

// ============================================================================
// TAG EDITOR MODAL - Editar nome, cor e campos de uma SuperTag
// ============================================================================

interface TagEditorModalProps {
    tagId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

const FIELD_TYPES: { value: TagFieldType; label: string }[] = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'date', label: 'Data' },
    { value: 'select', label: 'Seleção' },
    { value: 'checkbox', label: 'Checkbox' },
];

const COLOR_PRESETS = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
    '#f59e0b', '#10b981', '#06b6d4', '#6366f1',
];

export function TagEditorModal({ tagId, isOpen, onClose }: TagEditorModalProps) {
    const { superTags, updateSuperTag } = useGraphStore();
    const tag = superTags.find((t) => t.id === tagId);

    // Inicializa estado apenas quando tagId muda (usa useMemo para evitar cascading renders)
    const initialValues = tag ? { name: tag.name, color: tag.color, fields: [...tag.fields] } : null;

    const [name, setName] = useState(initialValues?.name ?? '');
    const [color, setColor] = useState(initialValues?.color ?? '#3b82f6');
    const [fields, setFields] = useState<TagField[]>(initialValues?.fields ?? []);

    // Reset quando tagId muda (useEffect apenas para detectar mudança de tagId)
    const [prevTagId, setPrevTagId] = useState<string | null>(tagId);
    if (tagId !== prevTagId) {
        setPrevTagId(tagId);
        if (tag) {
            setName(tag.name);
            setColor(tag.color);
            setFields([...tag.fields]);
        }
    }

    if (!isOpen || !tag) return null;

    const handleSave = () => {
        updateSuperTag(tagId!, {
            name: name.trim() || 'Sem nome',
            color,
            fields,
        });
        onClose();
    };

    const handleAddField = () => {
        const newField: TagField = {
            id: `field-${Date.now()}`,
            name: 'Novo Campo',
            type: 'text',
        };
        setFields([...fields, newField]);
    };

    const handleRemoveField = (fieldId: string) => {
        setFields(fields.filter((f) => f.id !== fieldId));
    };

    const handleUpdateField = (fieldId: string, updates: Partial<TagField>) => {
        setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className={cn(
                    "w-full max-w-lg mx-4",
                    "bg-zinc-900 border border-white/10 rounded-2xl",
                    "shadow-2xl shadow-black/50",
                    "animate-in fade-in zoom-in-95 duration-200"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white">Editar Tag</h2>
                    <button
                        onClick={onClose}
                        title="Fechar"
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Nome */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            Nome da Tag
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome..."
                            className={cn(
                                "w-full px-3 py-2.5 rounded-xl text-base",
                                "bg-white/5 border border-white/10 text-white",
                                "placeholder:text-zinc-600",
                                "focus:outline-none focus:border-violet-500/50"
                            )}
                        />
                    </div>

                    {/* Cor */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            Cor
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {COLOR_PRESETS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    title={`Selecionar cor ${c}`}
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-all",
                                        color === c && "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Campos */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                Campos
                            </label>
                            <button
                                onClick={handleAddField}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs",
                                    "bg-violet-500/20 text-violet-400",
                                    "hover:bg-violet-500/30 transition-colors"
                                )}
                            >
                                <Plus size={12} />
                                <span>Adicionar</span>
                            </button>
                        </div>

                        {fields.length === 0 ? (
                            <div className="text-center text-zinc-500 py-4 text-sm">
                                Nenhum campo definido
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {fields.map((field) => (
                                    <div
                                        key={field.id}
                                        className={cn(
                                            "flex items-start gap-2 p-3 rounded-xl",
                                            "bg-white/5 border border-white/10"
                                        )}
                                    >
                                        <GripVertical size={16} className="text-zinc-600 mt-2 shrink-0" />

                                        <div className="flex-1 space-y-2">
                                            {/* Nome do campo */}
                                            <input
                                                type="text"
                                                value={field.name}
                                                onChange={(e) => handleUpdateField(field.id, { name: e.target.value })}
                                                placeholder="Nome do campo..."
                                                className={cn(
                                                    "w-full px-2 py-1.5 rounded-lg text-sm",
                                                    "bg-white/5 border border-white/10 text-white",
                                                    "focus:outline-none focus:border-violet-500/50"
                                                )}
                                            />

                                            {/* Tipo do campo */}
                                            <select
                                                value={field.type}
                                                onChange={(e) => handleUpdateField(field.id, {
                                                    type: e.target.value as TagFieldType,
                                                    options: e.target.value === 'select' ? ['Opção 1', 'Opção 2'] : undefined
                                                })}
                                                title="Tipo do campo"
                                                aria-label="Tipo do campo"
                                                className={cn(
                                                    "w-full px-2 py-1.5 rounded-lg text-sm",
                                                    "bg-white/5 border border-white/10 text-white",
                                                    "focus:outline-none focus:border-violet-500/50"
                                                )}
                                            >
                                                {FIELD_TYPES.map((ft) => (
                                                    <option key={ft.value} value={ft.value} className="bg-zinc-900">
                                                        {ft.label}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Options para select */}
                                            {field.type === 'select' && (
                                                <div className="space-y-1">
                                                    <label className="text-xs text-zinc-500">
                                                        Opções (uma por linha)
                                                    </label>
                                                    <textarea
                                                        value={(field.options || []).join('\n')}
                                                        onChange={(e) => handleUpdateField(field.id, {
                                                            options: e.target.value.split('\n').filter(Boolean)
                                                        })}
                                                        rows={4}
                                                        placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                                                        className={cn(
                                                            "w-full px-2 py-1.5 rounded-lg text-sm",
                                                            "bg-white/5 border border-white/10 text-white",
                                                            "placeholder:text-zinc-600",
                                                            "focus:outline-none focus:border-violet-500/50",
                                                            "resize-none"
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleRemoveField(field.id)}
                                            title="Remover campo"
                                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium",
                            "bg-violet-500 text-white",
                            "hover:bg-violet-600 transition-colors"
                        )}
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}

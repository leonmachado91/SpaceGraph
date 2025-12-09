'use client';

import { useGraphStore } from '@/lib/store/graphStore';
import { cn } from '@/lib/utils';

// ============================================================================
// PROPERTIES PANEL - Renderiza campos herdados das SuperTags aplicadas
// ============================================================================

interface PropertiesPanelProps {
    nodeId: string;
    nodeTags: string[];
}

export function PropertiesPanel({ nodeId, nodeTags }: PropertiesPanelProps) {
    const { superTags, nodes, updateNodeProperty } = useGraphStore();
    const node = nodes.find((n) => n.id === nodeId);

    if (!node) return null;

    // Busca as SuperTags aplicadas que têm campos
    const appliedTagsWithFields = superTags.filter(
        (tag) => nodeTags.includes(tag.id) && tag.fields.length > 0
    );

    // Não mostra se não há campos
    if (appliedTagsWithFields.length === 0) return null;

    const handleFieldChange = (tagId: string, fieldId: string, value: unknown) => {
        const key = `${tagId}.${fieldId}`;
        updateNodeProperty(nodeId, key, value);
    };

    const getFieldValue = (tagId: string, fieldId: string) => {
        const key = `${tagId}.${fieldId}`;
        return node.properties?.[key];
    };

    return (
        <div className="space-y-4">
            {appliedTagsWithFields.map((tag) => (
                <div key={tag.id} className="space-y-2">
                    {/* Header da tag */}
                    <div className="flex items-center gap-2">
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-xs font-medium text-zinc-400">
                            #{tag.name}
                        </span>
                    </div>

                    {/* Campos da tag */}
                    <div className="space-y-2 pl-4">
                        {tag.fields.map((field) => (
                            <div key={field.id} className="space-y-1">
                                <label className="text-xs text-zinc-500">
                                    {field.name}
                                </label>

                                {/* Renderiza input baseado no tipo */}
                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        value={(getFieldValue(tag.id, field.id) as string) ?? ''}
                                        onChange={(e) => handleFieldChange(tag.id, field.id, e.target.value)}
                                        placeholder={`${field.name}...`}
                                        className={cn(
                                            "w-full px-2.5 py-1.5 rounded-lg text-sm",
                                            "bg-white/5 border border-white/10 text-white",
                                            "placeholder:text-zinc-600",
                                            "focus:outline-none focus:border-violet-500/50"
                                        )}
                                    />
                                )}

                                {field.type === 'number' && (
                                    <input
                                        type="number"
                                        value={(getFieldValue(tag.id, field.id) as number) ?? ''}
                                        onChange={(e) => handleFieldChange(tag.id, field.id, e.target.valueAsNumber || null)}
                                        placeholder="0"
                                        className={cn(
                                            "w-full px-2.5 py-1.5 rounded-lg text-sm",
                                            "bg-white/5 border border-white/10 text-white",
                                            "placeholder:text-zinc-600",
                                            "focus:outline-none focus:border-violet-500/50"
                                        )}
                                    />
                                )}

                                {field.type === 'date' && (
                                    <input
                                        type="date"
                                        value={(getFieldValue(tag.id, field.id) as string) ?? ''}
                                        onChange={(e) => handleFieldChange(tag.id, field.id, e.target.value)}
                                        title={field.name}
                                        aria-label={field.name}
                                        className={cn(
                                            "w-full px-2.5 py-1.5 rounded-lg text-sm",
                                            "bg-white/5 border border-white/10 text-white",
                                            "focus:outline-none focus:border-violet-500/50",
                                            "scheme-dark"
                                        )}
                                    />
                                )}

                                {field.type === 'select' && field.options && (
                                    <select
                                        value={(getFieldValue(tag.id, field.id) as string) ?? ''}
                                        onChange={(e) => handleFieldChange(tag.id, field.id, e.target.value)}
                                        title={field.name}
                                        aria-label={field.name}
                                        className={cn(
                                            "w-full px-2.5 py-1.5 rounded-lg text-sm",
                                            "bg-white/5 border border-white/10 text-white",
                                            "focus:outline-none focus:border-violet-500/50"
                                        )}
                                    >
                                        <option value="" className="bg-zinc-900">Selecione...</option>
                                        {field.options.map((opt) => (
                                            <option key={opt} value={opt} className="bg-zinc-900">
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {field.type === 'checkbox' && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={(getFieldValue(tag.id, field.id) as boolean) ?? false}
                                            onChange={(e) => handleFieldChange(tag.id, field.id, e.target.checked)}
                                            className={cn(
                                                "w-4 h-4 rounded border border-white/20",
                                                "bg-white/5 text-violet-500",
                                                "focus:ring-violet-500/30 focus:ring-offset-0"
                                            )}
                                        />
                                        <span className="text-sm text-zinc-300">{field.name}</span>
                                    </label>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

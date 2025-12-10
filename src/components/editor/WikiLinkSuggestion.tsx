'use client';

import { forwardRef, useImperativeHandle, useState, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';

// ============================================================================
// WIKILINK SUGGESTION - Dropdown de autocomplete para WikiLinks
// ============================================================================

export interface WikiLinkItem {
    id: string;
    title: string;
    isGhost?: boolean;
}

interface WikiLinkSuggestionListProps {
    items: WikiLinkItem[];
    command: (item: WikiLinkItem) => void;
    query?: string;
}

export const WikiLinkSuggestionList = forwardRef<
    { onKeyDown: (event: KeyboardEvent) => boolean },
    WikiLinkSuggestionListProps
>((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Adiciona opção de criar nó se query não existe
    const allItems: WikiLinkItem[] = useMemo(() => {
        const hasExactMatch = props.items.some(
            (item) => item.title.toLowerCase() === (props.query ?? '').toLowerCase()
        );

        return [
            ...props.items,
            ...(!hasExactMatch && props.query?.trim()
                ? [{ id: `ghost-${props.query}`, title: props.query.trim(), isGhost: true }]
                : []
            ),
        ];
    }, [props.items, props.query]);

    const safeSelectedIndex = useMemo(() => {
        if (allItems.length === 0) return 0;
        return Math.min(selectedIndex, allItems.length - 1);
    }, [allItems.length, selectedIndex]);

    const selectItem = useCallback(
        (index: number) => {
            const item = allItems[index];
            if (item) {
                props.command(item);
            }
        },
        [allItems, props]
    );

    const upHandler = useCallback(() => {
        if (!allItems.length) return;
        setSelectedIndex((prev) =>
            (prev + allItems.length - 1) % allItems.length
        );
    }, [allItems.length]);

    const downHandler = useCallback(() => {
        if (!allItems.length) return;
        setSelectedIndex((prev) =>
            (prev + 1) % allItems.length
        );
    }, [allItems.length]);

    const enterHandler = useCallback(() => {
        selectItem(safeSelectedIndex);
    }, [selectItem, safeSelectedIndex]);

    useImperativeHandle(ref, () => ({
        onKeyDown: (event: KeyboardEvent) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }
            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }
            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }
            return false;
        },
    }));

    if (allItems.length === 0) {
        return (
            <div className="wiki-link-suggestion">
                <div className="wiki-link-suggestion-empty">
                    Digite um nome para criar nó
                </div>
            </div>
        );
    }

    return (
        <div className="wiki-link-suggestion">
            {allItems.map((item, index) => (
                <button
                    key={item.id}
                    onClick={() => selectItem(index)}
                    className={`wiki-link-suggestion-item ${index === safeSelectedIndex ? 'is-selected' : ''
                        } ${item.isGhost ? 'is-ghost' : ''}`}
                    title={item.isGhost ? `Criar "${item.title}"` : item.title}
                >
                    {item.isGhost && <Plus size={14} className="text-violet-400" />}
                    <span className="wiki-link-suggestion-title">
                        {item.isGhost ? `Criar "${item.title}"` : item.title}
                    </span>
                </button>
            ))}
        </div>
    );
});

WikiLinkSuggestionList.displayName = 'WikiLinkSuggestionList';

// ============================================================================
// SUGGESTION CONFIG
// ============================================================================

import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';

export function createSuggestionConfig(
    getNodes: () => { id: string; title: string }[],
) {
    return {
        items: ({ query }: { query: string }): WikiLinkItem[] => {
            const nodes = getNodes();
            return nodes
                .filter((node) =>
                    node.title.toLowerCase().includes(query.toLowerCase())
                )
                .slice(0, 8);
        },

        render: () => {
            let component: ReactRenderer<
                { onKeyDown: (event: KeyboardEvent) => boolean },
                WikiLinkSuggestionListProps
            >;
            let popup: TippyInstance[];
            let currentQuery = '';

            return {
                onStart: (props: SuggestionProps<WikiLinkItem>) => {
                    currentQuery = props.query;
                    component = new ReactRenderer(WikiLinkSuggestionList, {
                        props: { ...props, query: currentQuery },
                        editor: props.editor,
                    });

                    if (!props.clientRect) return;

                    popup = tippy('body', {
                        getReferenceClientRect: props.clientRect as () => DOMRect,
                        appendTo: () => document.body,
                        content: component.element,
                        showOnCreate: true,
                        interactive: true,
                        trigger: 'manual',
                        placement: 'bottom-start',
                    });
                },

                onUpdate(props: SuggestionProps<WikiLinkItem>) {
                    currentQuery = props.query;
                    component.updateProps({ ...props, query: currentQuery });

                    if (!props.clientRect) return;

                    popup[0].setProps({
                        getReferenceClientRect: props.clientRect as () => DOMRect,
                    });
                },

                onKeyDown(props: SuggestionKeyDownProps) {
                    if (props.event.key === 'Escape') {
                        popup[0].hide();
                        return true;
                    }

                    return component.ref?.onKeyDown(props.event) ?? false;
                },

                onExit() {
                    popup[0].destroy();
                    component.destroy();
                },
            };
        },
    };
}

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import type { SuggestionOptions } from '@tiptap/suggestion';
import { WikiLinkNodeView } from './WikiLinkNodeView';

// ============================================================================
// WIKILINK EXTENSION - Links internos estilo [[Node Name]]
// Título é resolvido dinamicamente via store, não é armazenado
// ============================================================================

export interface WikiLinkOptions {
    HTMLAttributes: Record<string, string>;
    suggestion: Omit<SuggestionOptions, 'editor'>;
}

export const WikiLinkPluginKey = new PluginKey('wikiLink');

export const WikiLink = Node.create<WikiLinkOptions>({
    name: 'wikiLink',

    group: 'inline',

    inline: true,

    selectable: true,

    atom: true,

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'wiki-link',
            },
            suggestion: {
                char: '[[',
                pluginKey: WikiLinkPluginKey,
                command: ({ editor, range, props }: { editor: unknown; range: unknown; props: { id: string; title: string; isGhost?: boolean } }) => {
                    (editor as { chain: () => { focus: () => { deleteRange: (range: unknown) => { insertContent: (content: unknown[]) => { run: () => void } } } } })
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .insertContent([
                            {
                                type: 'wikiLink',
                                attrs: {
                                    nodeId: props.id,
                                    // title removido - será resolvido dinamicamente
                                    isGhost: props.isGhost ?? false,
                                },
                            },
                            { type: 'text', text: ' ' },
                        ])
                        .run();
                },
            },
        };
    },

    addAttributes() {
        return {
            nodeId: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute('data-node-id'),
                renderHTML: (attributes: { nodeId: string }) => ({
                    'data-node-id': attributes.nodeId,
                }),
            },
            // title mantido apenas para compatibilidade com conteúdo antigo
            // mas não é usado na renderização - título vem do store
            title: {
                default: '',
                parseHTML: (element: HTMLElement) => element.textContent,
                renderHTML: () => ({}),
            },
            isGhost: {
                default: false,
                parseHTML: (element: HTMLElement) => element.getAttribute('data-ghost') === 'true',
                renderHTML: (attributes: { isGhost: boolean }) =>
                    attributes.isGhost ? { 'data-ghost': 'true' } : {},
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-wiki-link]',
            },
        ];
    },

    renderHTML({ node, HTMLAttributes }: { node: any; HTMLAttributes: any }) {
        const isGhost = node.attrs.isGhost;
        // Fallback para quando não há NodeView (SSR, export, etc)
        return [
            'span',
            mergeAttributes(
                this.options.HTMLAttributes,
                HTMLAttributes,
                {
                    'data-wiki-link': '',
                    'class': isGhost ? 'wiki-link wiki-link-ghost' : 'wiki-link',
                }
            ),
            // Usa title antigo como fallback se existir
            node.attrs.title || '...',
        ];
    },

    // NodeView para renderização dinâmica no React
    addNodeView() {
        return ReactNodeViewRenderer(WikiLinkNodeView);
    },

    addKeyboardShortcuts() {
        return {
            Backspace: () =>
                this.editor.commands.command(({ tr, state }: { tr: { insertText: (text: string, from: number, to: number) => void }; state: { selection: { empty: boolean; anchor: number }; doc: { nodesBetween: (from: number, to: number, callback: (node: { type: { name: string }; nodeSize: number }, pos: number) => boolean | void) => void } } }) => {
                    let isWikiLink = false;
                    const { selection } = state;
                    const { empty, anchor } = selection;

                    if (!empty) return false;

                    state.doc.nodesBetween(anchor - 1, anchor, (node: { type: { name: string }; nodeSize: number }, pos: number) => {
                        if (node.type.name === this.name) {
                            isWikiLink = true;
                            tr.insertText('', pos, pos + node.nodeSize);
                            return false;
                        }
                    });

                    return isWikiLink;
                }),
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

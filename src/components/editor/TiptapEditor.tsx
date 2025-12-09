'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { WikiLink } from './extensions/WikiLink';
import { createSuggestionConfig } from './WikiLinkSuggestion';
import { useGraphStore } from '@/lib/store/graphStore';

// ============================================================================
// TIPTAP EDITOR - Editor de texto rico para conteúdo dos nós
// ============================================================================

interface TiptapEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    currentNodeId?: string;
    onNavigateToNode?: (nodeId: string) => void;
}

export function TiptapEditor({
    content,
    onChange,
    placeholder = 'Comece a escrever...',
    className,
    currentNodeId,
    onNavigateToNode,
}: TiptapEditorProps) {
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const editorRef = useRef<Editor | null>(null);

    const nodes = useGraphStore((state) => state.nodes);
    const addNode = useGraphStore((state) => state.addNode);
    const addEdge = useGraphStore((state) => state.addEdge);
    const syncEdgesFromContent = useGraphStore((state) => state.syncEdgesFromContent);

    // Cria configuração de sugestão com acesso aos nós
    const suggestionConfig = useMemo(() => {
        const config = createSuggestionConfig(
            () => nodes.map((n) => ({ id: n.id, title: n.title }))
        );

        return {
            ...config,
            command: ({ editor, range, props }: { editor: Editor; range: { from: number; to: number }; props: { id: string; title: string; isGhost?: boolean } }) => {
                // Insere o WikiLink
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertContent([
                        {
                            type: 'wikiLink',
                            attrs: {
                                nodeId: props.isGhost ? '' : props.id,
                                title: props.title,
                                isGhost: props.isGhost ?? false,
                            },
                        },
                        { type: 'text', text: ' ' },
                    ])
                    .run();

                // Sync de edges será feito no onUpdate
            },
        };
    }, [nodes]);

    // Handler para clique em WikiLink
    const handleWikiLinkClick = useCallback((target: HTMLElement) => {
        const nodeId = target.getAttribute('data-node-id');
        const isGhost = target.getAttribute('data-ghost') === 'true';
        const title = target.textContent ?? '';

        if (isGhost && currentNodeId) {
            // Cria o nó
            const currentNode = nodes.find(n => n.id === currentNodeId);
            const offsetX = 200 + Math.random() * 100;
            const offsetY = Math.random() * 100 - 50;

            addNode({
                title: title,
                type: 'default',
                x: (currentNode?.x ?? 0) + offsetX,
                y: (currentNode?.y ?? 0) + offsetY,
                systemId: currentNode?.systemId ?? 'system-1',
            });

            // Aguarda o nó ser criado, cria edge e atualiza o WikiLink
            setTimeout(() => {
                const newNodes = useGraphStore.getState().nodes;
                const newNode = newNodes.find(n => n.title === title);
                if (newNode) {
                    // Cria a edge
                    addEdge({
                        source: currentNodeId,
                        target: newNode.id,
                        systemId: currentNode?.systemId ?? 'system-1',
                    });

                    // Atualiza o WikiLink ghost para real usando a API do Tiptap
                    const editorInstance = editorRef.current;
                    if (editorInstance) {
                        const { state, view } = editorInstance;
                        const { tr } = state;
                        let updated = false;

                        // Percorre todos os nós do documento buscando WikiLinks ghost
                        // Pega lista atualizada de nodes
                        const currentNodes = useGraphStore.getState().nodes;

                        state.doc.descendants((node, pos) => {
                            if (node.type.name === 'wikiLink') {
                                const attrs = node.attrs;

                                // Ghost se:
                                // 1. Não tem nodeId
                                // 2. isGhost é true
                                // 3. nodeId aponta para nó que não existe mais
                                const hasValidNodeId = attrs.nodeId && attrs.nodeId !== '';
                                const nodeExists = hasValidNodeId && currentNodes.some(n => n.id === attrs.nodeId);
                                const isGhostNode = !hasValidNodeId || attrs.isGhost === true || !nodeExists;

                                // Verifica se o título bate
                                const nodeTitle = attrs.title || '';
                                const matchesTitle = nodeTitle === title || nodeTitle === '';

                                if (isGhostNode && matchesTitle) {
                                    // Atualiza os atributos do nó
                                    tr.setNodeMarkup(pos, undefined, {
                                        ...attrs,
                                        nodeId: newNode.id,
                                        title: title,
                                        isGhost: false,
                                    });
                                    updated = true;
                                    return false; // Para após encontrar o primeiro
                                }
                            }
                        });

                        if (updated) {
                            view.dispatch(tr);
                            // IMPORTANTE: Força a persistência imediata ANTES de navegar
                            // O setTimeout é necessário para dar tempo do dispatch processar
                            setTimeout(() => {
                                const updatedHtml = editorInstance.getHTML();
                                onChange(updatedHtml);
                                // Navega para o novo nó só depois de persistir
                                onNavigateToNode?.(newNode.id);
                            }, 50);
                            return; // Retorna aqui, navegação será feita no setTimeout acima
                        }
                    }

                    // Fallback: navega mesmo se não conseguiu atualizar
                    onNavigateToNode?.(newNode.id);
                }
            }, 100);

            return;
        }

        if (nodeId && onNavigateToNode) {
            onNavigateToNode(nodeId);
        }
    }, [nodes, currentNodeId, addNode, addEdge, onNavigateToNode, onChange]);

    // Configuração do editor
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
            Link.configure({
                openOnClick: true,
                autolink: true,
                HTMLAttributes: {
                    class: 'text-cyan-400 hover:text-cyan-300 underline cursor-pointer',
                },
            }),
            WikiLink.configure({
                suggestion: suggestionConfig,
            }),
        ],
        content,
        editorProps: {
            attributes: {
                class: 'tiptap',
            },
            handleClick: (view, pos, event) => {
                const target = event.target as HTMLElement;
                if (target.classList.contains('wiki-link')) {
                    handleWikiLinkClick(target);
                    return true;
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(() => {
                const html = editor.getHTML();
                onChange(html);

                // Sincroniza edges baseado no conteúdo
                if (currentNodeId) {
                    const currentNode = nodes.find(n => n.id === currentNodeId);
                    syncEdgesFromContent(currentNodeId, html, currentNode?.systemId ?? 'system-1');
                }
            }, 500);
        },
    });

    // Armazena referência ao editor
    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Usa queueMicrotask para evitar conflito com o ciclo de renderização
            // (Tiptap usa flushSync internamente que conflita com React render)
            queueMicrotask(() => {
                if (editor && !editor.isDestroyed) {
                    editor.commands.setContent(content);
                }
            });
        }
    }, [content, editor]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    if (!editor) {
        return null;
    }

    return (
        <div className={`tiptap-wrapper ${className ?? ''}`}>
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}

export { Editor };

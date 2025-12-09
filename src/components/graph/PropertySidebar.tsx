'use client';

import { useEffect, useState } from 'react';
import { useNode } from '@/lib/hooks';
import { EntitySidebar, SidebarSection, InfoPanel } from '@/components/ui/EntitySidebar';
import { TiptapEditor } from '@/components/editor';
import { TagSelector, PropertiesPanel } from '@/components/tags';
import { ConnectionsList } from './ConnectionsList';

// ============================================================================
// PROPERTY SIDEBAR - Painel flutuante de edição de nó
// Usa EntitySidebar como base
// ============================================================================

interface PropertySidebarProps {
    nodeId: string;
    onClose: () => void;
    onSelectNode?: (nodeId: string) => void;
}

export function PropertySidebar({ nodeId, onClose, onSelectNode }: PropertySidebarProps) {
    const {
        node,
        exists,
        updateTitle,
        updateColor,
        updateContent,
        remove,
    } = useNode(nodeId);

    const [title, setTitle] = useState(node?.title ?? '');

    // Sincroniza título local quando o nó muda externamente
    useEffect(() => {
        if (node?.title && node.title !== title) {
            setTitle(node.title);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [node?.title]);

    useEffect(() => {
        if (!exists) {
            onClose();
        }
    }, [exists, onClose]);

    if (!node) return null;

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        updateTitle(newTitle);
    };

    const handleDelete = () => {
        remove();
        onClose();
    };

    const handleInsertWikiLink = (targetId: string, targetTitle: string) => {
        const wikiLinkHtml = `<span class="wiki-link" data-wiki-link="" data-node-id="${targetId}">${targetTitle}</span> `;
        const newContent = (node.content ?? '') + wikiLinkHtml;
        updateContent(newContent);
    };

    return (
        <EntitySidebar
            title={title}
            onTitleChange={handleTitleChange}
            color={node.color}
            onColorChange={updateColor}
            onClose={onClose}
            onDelete={handleDelete}
            titlePlaceholder="Nome do nó..."
            deleteButtonText="Excluir Nó"
        >
            {/* Notas */}
            <SidebarSection label="Notas">
                <TiptapEditor
                    content={node.content ?? ''}
                    onChange={updateContent}
                    placeholder="Adicione notas ou descrição..."
                    currentNodeId={nodeId}
                    onNavigateToNode={onSelectNode}
                />
            </SidebarSection>

            {/* Tags */}
            <SidebarSection label="Tags">
                <TagSelector nodeId={nodeId} nodeTags={node.tags ?? []} />
            </SidebarSection>

            {/* Propriedades */}
            <PropertiesPanel nodeId={nodeId} nodeTags={node.tags ?? []} />

            {/* Conexões */}
            <SidebarSection label="Conexões">
                <ConnectionsList
                    nodeId={nodeId}
                    nodeContent={node.content ?? ''}
                    onInsertWikiLink={handleInsertWikiLink}
                />
            </SidebarSection>

            {/* Info */}
            <SidebarSection label="Info">
                <InfoPanel
                    items={[
                        { label: 'ID', value: <span className="font-mono">{node.id.slice(0, 8)}...</span> },
                        { label: 'Posição', value: `${Math.round(node.x)}, ${Math.round(node.y)}` },
                    ]}
                />
            </SidebarSection>
        </EntitySidebar>
    );
}

# 002 - WikiLinks, SuperTags e Refatoração de Sincronização

**Data:** 2025-12-07  
**Sessão:** Fase 3 - Rich Content & WikiLinks

---

## Resumo Cronológico

### 1. Correção de Build WikiLinks
- Instalação de `@tiptap/core` que estava faltando
- Build passou após adicionar dependência

### 2. Melhorias nos WikiLinks (4 itens)
O usuário reportou 4 melhorias necessárias:

1. **Navegação ao clicar** - WikiLink agora navega para o nó referenciado
2. **Visual sem `[[]]`** - WikiLinks mostram apenas o nome, sem os colchetes
3. **Criação de Edge automática** - Ao inserir WikiLink, edge é criada no canvas
4. **WikiLink Ghost** - Opção "Criar 'Nome'" no dropdown para nós inexistentes

### 3. Correção do WikiLink Ghost
Múltiplas iterações para corrigir:
- Ghost estava criando nó na inserção (deveria criar apenas ao clicar)
- Ghost não criava edge após criar o nó
- Ghost não atualizava de tracejado para sólido após criar nó

**Solução final:**
- Removida criação de nó na inserção
- `handleWikiLinkClick` cria nó + edge ao clicar
- API do Tiptap (`state.doc.descendants` + `tr.setNodeMarkup`) para atualizar atributos do WikiLink
- `onChange` chamado antes de navegar para persistir mudança

### 4. Discussão Arquitetural
Usuário identificou que o sistema estava "burro" - apenas causa/consequência sem sincronização real:
- Renomear nó não atualiza WikiLinks
- Edge criada no canvas não cria WikiLink
- Edge deletada não remove WikiLink

### 5. Proposta de Refatoração
Criada proposta para **Single Source of Truth**:
- Edges = fonte única de verdade
- WikiLinks = visão derivada (título resolvido por ID)
- Nova seção "Conexões" na sidebar

**Decisões do usuário:**
1. Edge no canvas → aparece na lista de conexões (não auto-insere no texto)
2. Nó deletado → WikiLinks viram ghost
3. Bidirecional → 2 WikiLinks (um em cada nó)

---

## Arquivos Modificados/Criados

### Código

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/editor/extensions/WikiLink.ts` | Modificado | Adicionado atributo `isGhost`, visual ghost, sem `[[]]` |
| `src/components/editor/WikiLinkSuggestion.tsx` | Modificado | Opção "Criar 'Nome'" para ghosts |
| `src/components/editor/TiptapEditor.tsx` | Modificado | handleWikiLinkClick, criação de edges, atualização ghost→real |
| `src/components/graph/PropertySidebar.tsx` | Modificado | Props onSelectNode, currentNodeId, onNavigateToNode |
| `src/components/graph/GraphCanvas.tsx` | Modificado | onSelectNode no PropertySidebar |
| `src/app/globals.css` | Modificado | Estilos `.wiki-link-ghost` (borda tracejada) |

### Especificação

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `spec/proposal.md` | Reescrito | Proposta de refatoração WikiLinks↔Edges |
| `spec/tasks.md` | Reescrito | Tarefas para refatoração em 7 fases |

---

## Dependências Adicionadas

```
@tiptap/core 3.13.0
```

---

## Próximos Passos

Aguardando aprovação do usuário para iniciar implementação da refatoração de sincronização WikiLinks↔Edges.

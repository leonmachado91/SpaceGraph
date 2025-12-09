# Proposta: Features Restantes do MVP

**Versão:** 2.0  
**Status:** Aguardando Aprovação  
**Escopo:** Complemento das funcionalidades especificadas no Brief que ainda não foram implementadas

---

## 1. Visão Geral

Esta proposta cobre as funcionalidades restantes para completar o MVP do NeoGraph conforme definido nos documentos do Brief. As features estão organizadas por prioridade e complexidade.

---

## 2. Features a Implementar

### 2.1. Level of Detail (LOD) por Zoom
**Brief:** UX §3.1, FRONT §4  
**Prioridade:** Alta (Performance)

Renderização condicional do conteúdo dos nós baseada no nível de zoom:

| Zoom | Visual | Performance |
|------|--------|-------------|
| < 0.5 | Ponto colorido (2px) | Máxima |
| 0.5-1.2 | Ícone + Título truncado | Média |
| > 1.2 | Título completo + Tags + Quick Add | Normal |

**Implementação:**
- Usar `useViewport()` do React Flow dentro do `GraphNode`
- Renderização condicional via CSS classes e retorno JSX
- Remover sombras/bordas em zoom baixo

---

### 2.2. Quick Add (+)
**Brief:** PRD §4.4, UX §3.3  
**Prioridade:** Alta (UX Core)

Botão flutuante que aparece ao passar o mouse sobre um nó para criação rápida de conexões.

**Comportamento:**
1. **Hover no nó** → Botão `+` aparece na borda direita
2. **Clique no +** → Cria nó filho a +100px e conecta automaticamente
3. **Drag do +** → Puxa linha fantasma, solta em nó existente ou vazio

**Implementação:**
- Componente `QuickAddHandle` dentro do `GraphNode`
- Estado `isCreatingConnection` no store
- Reutilizar lógica de `ConnectionLine` para linha fantasma

---

### 2.3. Pinning (Fixar Nós)
**Brief:** PRD §3.2  
**Prioridade:** Média

Permite ao usuário fixar nós no lugar, ignorando a física.

**Implementação:**
- Campo `fixed_x` e `fixed_y` já existe no schema
- Menu de contexto ou double-click para fixar
- Ícone de 📌 visual no nó fixado
- D3 ignora nós com `fx`/`fy` definidos

---

### 2.4. Busca com Spotlight Effect
**Brief:** PRD §6.2  
**Prioridade:** Alta (Navegação)

Busca de nós por título/conteúdo com efeito visual de destaque.

**Comportamento:**
1. Input de busca na Top Bar
2. Ao digitar, filtra nós em tempo real
3. Nós não-matching ficam com opacidade 10%
4. Nós matching + suas conexões diretas permanecem visíveis
5. Enter navega para o primeiro resultado (fitView)

**Implementação:**
- Componente `SearchBar` na área superior
- Estado `searchQuery` e `highlightedNodeIds` no store
- Classes CSS condicionais no `GraphNode` e `GraphEdge`

---

### 2.5. The Dock (Navegação Lateral)
**Brief:** UX §2.1  
**Prioridade:** Média

Barra de navegação vertical flutuante à esquerda.

**Estrutura:**
- Ícone Dashboard (Home)
- Ícone Sistemas (Multi-workspace futuro)
- Ícone Tags (abre TagManager)
- Ícone Busca
- Ícone Configurações

**Implementação:**
- Componente `TheDock` posicionado fixed left
- Glassmorphism consistente
- Tooltips no hover

---

### 2.6. Snapshots (Histórico de Versões)
**Brief:** PRD §6.1, ARCH §3  
**Prioridade:** Média

Salvar estados completos do grafo para restauração futura.

**Comportamento:**
1. Botão "Criar Snapshot" manual
2. Lista de snapshots com nome + data
3. Visualização read-only de snapshots antigos
4. Restaurar snapshot (com confirmação)

**Implementação:**
- Tabela `snapshots` no Supabase (já especificada no ARCH)
- Modal `SnapshotManager` 
- Função `createSnapshot()` e `restoreSnapshot()` no store

---

### 2.7. Modo Leitura
**Brief:** PRD §5.2  
**Prioridade:** Baixa

Transforma a experiência em documento, ocultando o canvas.

**Implementação:**
- Toggle "Modo Leitura" no header
- Canvas minimiza/oculta
- Conteúdo do nó selecionado expande para tela central
- Navegação por WikiLinks mantida

---

### 2.8. Exportação JSON
**Brief:** PRD §7  
**Prioridade:** Baixa

Backup total do sistema em formato JSON.

**Implementação:**
- Botão "Exportar" nas configurações
- Gera JSON com `{ nodes, edges, tags, metadata }`
- Download automático do arquivo

---

### 2.9. Upload de Imagens
**Brief:** EDITOR §5  
**Prioridade:** Média

Integração com Supabase Storage para imagens no editor.

**Implementação:**
- Extensão `Image` do Tiptap
- Drag & Drop + Paste
- Upload assíncrono para Supabase Storage
- Substituição de blob local por URL

---

### 2.10. Navegação Mobile (Gestos)
**Brief:** PRD §4.2, FRONT §7  
**Prioridade:** Baixa (Pós-MVP)

Diferenciação de gestos para mobile.

**Implementação:**
- Wrapper de touch events
- 1 dedo = seleção/move
- 2 dedos = pan
- Pinch = zoom
- Hitboxes expandidas (20px)

---

## 3. Ordem de Implementação Sugerida

### Fase 1: Core UX (Essencial)
1. Busca com Spotlight
2. Level of Detail (LOD)
3. Quick Add (+)

### Fase 2: Organização
4. The Dock
5. Pinning

### Fase 3: Persistência
6. Snapshots
7. Exportação JSON

### Fase 4: Rich Content
8. Upload de Imagens
9. Modo Leitura

### Fase 5: Mobile (Pós-MVP)
10. Navegação Mobile

---

## 4. Verificação

- Testar cada feature isoladamente
- Validar performance com grafos de 100+ nós
- Verificar integração com Supabase (onde aplicável)
- Testar em diferentes resoluções

---

## 5. User Review Required

> [!IMPORTANT]
> **Decisão necessária:** Qual fase você gostaria de implementar primeiro?
> 
> Sugiro começar pela **Fase 1 (Core UX)** pois são features que impactam diretamente a usabilidade diária do app.

# Tasks: Features Restantes do MVP

---

## Fase 1: Core UX (Essencial)

### 1.1 Busca com Spotlight Effect
- [ ] 1.1.1 Criar componente `SearchBar` com input estilizado (glassmorphism)
- [ ] 1.1.2 Adicionar estado `searchQuery` e `highlightedNodeIds` no `graphStore`
- [ ] 1.1.3 Implementar lógica de filtro por título (fuzzy match)
- [ ] 1.1.4 Adicionar classes CSS de opacidade reduzida para nós não-matching
- [ ] 1.1.5 Destacar conexões diretas dos nós matching
- [ ] 1.1.6 Implementar navegação com Enter (fitView no primeiro resultado)
- [ ] 1.1.7 Adicionar atalho de teclado (Ctrl+K) para focar busca
- [ ] 1.1.8 Testar busca com grafos de 50+ nós

### 1.2 Level of Detail (LOD)
- [ ] 1.2.1 Importar `useViewport()` no `GraphNode`
- [ ] 1.2.2 Criar renderização condicional para zoom < 0.5 (ponto colorido)
- [ ] 1.2.3 Criar renderização condicional para zoom 0.5-1.2 (ícone + título)
- [ ] 1.2.4 Criar renderização completa para zoom > 1.2 (título + tags)
- [ ] 1.2.5 Remover sombras/bordas em LOD baixo para performance
- [ ] 1.2.6 Testar transições suaves entre níveis de LOD
- [ ] 1.2.7 Validar performance com 100+ nós em cada nível

### 1.3 Quick Add (+)
- [ ] 1.3.1 Criar componente `QuickAddHandle` como botão flutuante
- [ ] 1.3.2 Posicionar na borda direita do nó (visível apenas no hover)
- [ ] 1.3.3 Implementar clique: criar nó filho a +150px e conectar
- [ ] 1.3.4 Implementar drag: iniciar linha fantasma (reutilizar ConnectionLine)
- [ ] 1.3.5 Detectar drop em nó existente → criar edge
- [ ] 1.3.6 Detectar drop no vazio → criar novo nó na posição
- [ ] 1.3.7 Adicionar animação de criação (scale-in + particles opcional)
- [ ] 1.3.8 Testar fluxo completo de criação rápida

---

## Fase 2: Organização

### 2.1 The Dock (Navegação Lateral)
- [ ] 2.1.1 Criar componente `TheDock` com posição fixed left
- [ ] 2.1.2 Adicionar ícones: Home, Tags, Busca, Settings
- [ ] 2.1.3 Aplicar glassmorphism e hover states
- [ ] 2.1.4 Implementar tooltips com labels
- [ ] 2.1.5 Conectar botões às ações (abrir TagManager, focar SearchBar, etc)
- [ ] 2.1.6 Testar responsividade (ocultar em mobile?)

### 2.2 Pinning (Fixar Nós)
- [ ] 2.2.1 Adicionar `isFixed` ou `fx`/`fy` ao tipo `GraphNode`
- [ ] 2.2.2 Criar ação `toggleNodePin(nodeId)` no store
- [ ] 2.2.3 Adicionar botão de pin no menu de contexto do nó
- [ ] 2.2.4 Exibir ícone 📌 visual no nó quando fixado
- [ ] 2.2.5 Modificar D3 para respeitar `fx`/`fy` de nós fixados
- [ ] 2.2.6 Double-click como atalho para fixar/desfixar
- [ ] 2.2.7 Testar comportamento da física com nós fixados

---

## Fase 3: Persistência

### 3.1 Snapshots (Histórico de Versões)
- [ ] 3.1.1 Criar tabela `snapshots` no Supabase (ver schema_sql.md)
- [ ] 3.1.2 Criar serviço `SnapshotService` com CRUD
- [ ] 3.1.3 Implementar `createSnapshot()` que salva estado completo
- [ ] 3.1.4 Criar componente `SnapshotManager` (modal com lista)
- [ ] 3.1.5 Implementar visualização read-only de snapshot antigo
- [ ] 3.1.6 Implementar `restoreSnapshot()` com confirmação
- [ ] 3.1.7 Adicionar botão "Criar Snapshot" na UI (Dock ou Settings)
- [ ] 3.1.8 Testar criar, visualizar e restaurar snapshots

### 3.2 Exportação JSON
- [ ] 3.2.1 Criar função `exportSystemToJSON()` no store
- [ ] 3.2.2 Serializar `{ nodes, edges, superTags, metadata }`
- [ ] 3.2.3 Criar botão "Exportar" no Settings ou Dock
- [ ] 3.2.4 Implementar download automático do arquivo .json
- [ ] 3.2.5 Testar integridade do JSON exportado

---

## Fase 4: Rich Content

### 4.1 Upload de Imagens
- [ ] 4.1.1 Configurar Supabase Storage bucket para imagens
- [ ] 4.1.2 Adicionar extensão `Image` ao Tiptap
- [ ] 4.1.3 Implementar handler de Drag & Drop no editor
- [ ] 4.1.4 Implementar handler de Paste (Ctrl+V)
- [ ] 4.1.5 Criar preview local (blob) durante upload
- [ ] 4.1.6 Fazer upload assíncrono para Supabase Storage
- [ ] 4.1.7 Substituir blob por URL pública no conteúdo
- [ ] 4.1.8 Testar upload de diferentes formatos (jpg, png, webp)

### 4.2 Modo Leitura
- [ ] 4.2.1 Adicionar estado `isReadMode` no store
- [ ] 4.2.2 Criar toggle "Modo Leitura" no header/dock
- [ ] 4.2.3 Criar layout de tela cheia para conteúdo do nó
- [ ] 4.2.4 Ocultar/minimizar canvas quando ativo
- [ ] 4.2.5 Manter navegação por WikiLinks funcional
- [ ] 4.2.6 Testar alternância entre modos

---

## Fase 5: Mobile (Pós-MVP)

### 5.1 Navegação Mobile
- [ ] 5.1.1 Criar wrapper `TouchHandler` para eventos touch
- [ ] 5.1.2 Implementar detecção de 1 dedo vs 2 dedos
- [ ] 5.1.3 Mapear 1 dedo → seleção/move elemento
- [ ] 5.1.4 Mapear 2 dedos → pan do canvas
- [ ] 5.1.5 Implementar pinch-to-zoom
- [ ] 5.1.6 Expandir hitboxes para 20px (handles, edges)
- [ ] 5.1.7 Adicionar CSS `touch-action: none` no container
- [ ] 5.1.8 Testar em dispositivos reais (iOS/Android)

---

## Notas

- Cada fase pode ser implementada independentemente
- Priorizar Fase 1 para impacto imediato na UX
- Fase 5 pode ser adiada para versão pós-MVP

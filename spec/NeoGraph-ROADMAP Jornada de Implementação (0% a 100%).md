# NeoGraph-ROADMAP: Jornada de Implementação (0% a 100%)

**Versão:** 1.1 (Atualizado)  
**Última Atualização:** 07/12/2024  
**Objetivo:** Guia tático passo a passo para construção do MVP (Mínimo Produto Viável).

Este roadmap é desenhado em **Sprints de Dependência**: cada fase constrói o chão necessário para a próxima caminhar. Não pule etapas.

---

## **Fase 0: A Fundação & Simulação (Setup Local)** ✅

*Foco: Ambiente de desenvolvimento e estrutura de dados mockados (Memória RAM).*

- **0.1. Inicialização do Projeto:** ✅
    - [x] `pnpm create next-app` (App Router, TypeScript, Tailwind).
    - [x] Instalar bibliotecas UI base: `shadcn/ui` (Sheet, Button, Dialog, Form, Input, Card).
    - [x] Configurar Linting (ESLint, Prettier) conforme Global Spec.
- **0.2. Camada de Abstração de Dados (Mock Service):** ✅
    - [x] Criar interface `GraphService`. Mock Store com LocalStorage.
    - [x] Funções `createNode`, `updateNode`, `deleteNode` funcionando.
- **0.3. Global State Setup:** ✅
    - [x] Configurar **Zustand** (Store centralizado com persist).
    - [x] Configurar **TanStack Query** (Provider na raiz + useLoadGraph hook).

> ✅ Checkpoint: Rota /graph acessível. Ambiente rodando, consumindo dados do localStorage.

---

## **Fase 1: O Motor Gráfico (Visual Core)** ✅

*Foco: Integração D3 + React Flow.*

- **1.1. Canvas Infinito:** ✅
    - [x] Implementar `ReactFlow` na rota do grafo.
    - [x] Customizar o Node Component: Design "Deep Space" com glassmorphism e neon.
- **1.2. Integração Física (D3 Force):** ✅
    - [x] Hook `useD3Simulation` com forceSimulation.
    - [x] Sincronizar coordenadas D3 → React Flow via batch updates.
    - [x] Colisão dinâmica baseada no tamanho do label.
    - [x] Forças x/y de centralização.
- **1.3. CRUD Visual Básico:** ✅
    - [x] **Create:** Duplo clique no fundo cria Node.
    - [x] **Delete:** Selecionar nó e teclar Delete.
    - [x] **Drag & Drop:** Arrastar nó funciona (pausa física via fx/fy).

> ✅ Checkpoint: Grafo visual com física funcionando.

---

## **Fase 2: Conexões e Interação** 🔶 PARCIALMENTE COMPLETO

*Foco: Dar sentido às bolinhas.*

- **2.1. Gestão de Arestas (Edges):** ✅
    - [x] Configurar `ConnectionLine` no React Flow (linha visual durante arraste).
    - [x] Salvar nova Edge no store + localStorage.
    - [ ] **Re-connectable:** Habilitar arrastar ponta de linha para mudar destino.
- **2.2. Mecânica de Física com Links:** ✅
    - [x] Links criados funcionam como "molas" no D3.
    - [x] Distância dinâmica baseada nos labels dos nós.
- **2.3. Painel Lateral (Sidebar) & Seleção:** ❌ A FAZER
    - [ ] Criar UI da Sidebar (Sheet).
    - [ ] Lógica: Clicar no Node → Abre Sidebar → Mostra detalhes.
    - [ ] Editar Título na Sidebar → Reflete no Node do grafo.

> 🔶 Checkpoint: Grafo funcional offline. Falta sidebar de edição.

---

## **Fase 3: Conteúdo Rico & WikiLinks** ❌ A FAZER

*Foco: Transformar em ferramenta de conhecimento.*

- **3.1. Tiptap Editor:**
    - [ ] Implementar componente Tiptap dentro da aba "Conteúdo" na Sidebar.
    - [ ] Configurar persistência com debounce no LocalStorage.
- **3.2. Sistema de SuperTags:**
    - [ ] Criar interface de gerenciamento de tags e campos customizados.
- **3.3. Implementação de WikiLinks (`[[`):**
    - [ ] Criar extensão custom do Tiptap.
    - [ ] Gatilho `[[`: Busca nós na lista local.
    - [ ] Componente React de renderização do Link.

> Checkpoint: Produto visualmente completo com persistência local.

---

## **Fase 4: Backend Integration (O "Transplante")** ❌ A FAZER

*Foco: Trocar a RAM pelo Supabase.*

- **4.1. Infraestrutura Supabase:**
    - [ ] Criar projeto no Supabase Dashboard.
    - [ ] Configurar Auth (Google + Email/Senha).
    - [ ] Instalar SDK real: `@supabase/auth-helpers-nextjs`.
- **4.2. SQL Schema Migration:**
    - [ ] Escrever e rodar criação de tabelas (`nodes`, `edges`, `systems`).
    - [ ] Aplicar RLS.
    - [ ] Criar RPC `get_light_graph` no banco.
- **4.3. Conectar Pontas (Adapter):**
    - [ ] Modificar `GraphService.ts`: Substituir localStorage por Supabase.
    - [ ] Criar Tela "Meus Sistemas" e lógica de criação de Workspaces.

> Checkpoint: O App exige login e salva dados na nuvem.

---

## **Fase 5: Refinamento, Mobile e Performance (1.0)** ❌ A FAZER

*Foco: Polimento final e UX.*

- **5.1. UX Mobile:**
    - [ ] Implementar Wrapper de Gestos (1 dedo select, 2 dedos pan).
    - [ ] Aumentar Hitbox das arestas e nós.
- **5.2. Search & Filter (Highlighter):**
    - [ ] Criar barra de busca global.
    - [ ] Efeito visual: Spotlight nos resultados.
- **5.3. Snapshots (Histórico):**
    - [ ] Botão "Salvar Versão" e dump no banco.
- **5.4. Level of Detail (LOD):**
    - [ ] Otimizar renderização baseada no Zoom.

> Final Checkpoint (MVP): Lançamento.

---

## **Extras Implementados (fora do Roadmap original)**

- [x] **Undo/Redo:** Ctrl+Z / Ctrl+Shift+Z funcionando com histórico de 50 ações.
- [x] **Toolbar Flutuante:** Botões de física, grid, settings, undo/redo.
- [x] **Painel de Settings:** Sliders para repulsão, link distance, collision radius.
- [x] **Visual Premium:** Nós com cores dinâmicas, glow, animações de entrada.
- [x] **Edges com Glow:** Estilo neon nas conexões.
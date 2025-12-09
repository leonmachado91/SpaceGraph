# Relatório de Análise Técnica Aprofundada: NeoGraph v2

**Data:** 2025-12-08  
**Escopo:** Análise completa de bugs, performance, arquitetura e qualidade de código

---

## 1. Sumário Executivo

A aplicação NeoGraph sofre de um **gargalo de performance crítico** que afeta tanto a fluidez da animação quanto a capacidade de interação (cliques em edges). A causa raiz é um padrão de "update storm" onde a simulação D3 atualiza o estado global do Zustand ~30x/segundo, forçando re-renders completos do React Flow.

Além disso, foram identificadas oportunidades significativas de **refatoração e modularização** para melhorar a manutenibilidade do código.

---

## 2. Bugs Críticos Confirmados

### 2.1 Bug: Edges Não Selecionáveis no Início

**Sintoma:** Ao carregar a página, as edges não respondem a cliques por alguns segundos. Após estabilização ou foco na janela, voltam a funcionar.

**Análise Profunda:**
```
┌─────────────────┐
│  D3 Simulation  │ ← Calcula novas posições a cada tick (~60fps interno)
└────────┬────────┘
         │ throttle 32ms
         ▼
┌─────────────────┐
│ syncPositionsToStore() │ ← Chama updateNodePositions()
└────────┬────────┘
         ▼
┌─────────────────┐
│  Zustand Store  │ ← state.nodes é recriado (imutabilidade)
└────────┬────────┘
         ▼
┌─────────────────┐
│ GraphCanvasContent │ ← useNodes() detecta mudança → RE-RENDER COMPLETO
└────────┬────────┘
         ▼
┌─────────────────┐
│   GraphEdge     │ ← Cada edge também usa useNodes() → CASCATA
└─────────────────┘
```

**Evidência no código (`GraphEdge.tsx:45`):**
```tsx
const nodes = useNodes(); // ← PROBLEMA: Subscreve ao estado global
```

Cada tick da simulação dispara:
1. Update no store Zustand
2. Re-render de `GraphCanvasContent`
3. Re-render de **todas** as edges (porque usam `useNodes()`)
4. Bloqueio da main thread → eventos de clique são perdidos

**Prova:** Durante o "warmup" da simulação, o alpha decai de 1.0 para ~0.001. Esse período dura ~15s com os parâmetros atuais. Durante esse tempo, a main thread está ~80% ocupada processando renders.

### 2.2 Bug: Lentidão/Lag na Simulação

**Causa:** Mesma do bug 2.1. O loop D3 → Zustand → React é muito pesado para rodar suavemente.

**Métricas estimadas (com 10 nós, 15 edges):**
- Renders por segundo durante warmup: ~30
- Tempo médio de render: ~25-35ms
- Tempo disponível para física + eventos: ~0ms (bloqueado)

---

## 3. Problemas de Arquitetura e Código

### 3.1 Arquivos Monolíticos (Candidatos a Refatoração)

| Arquivo | Linhas | Problema | Solução Proposta |
|---------|--------|----------|------------------|
| `graphStore.ts` | 546 | Contém CRUD, histórico, física, seleção, sync | Dividir em slices: `dataSlice`, `interactionSlice`, `physicsSlice` |
| `TiptapEditor.tsx` | 267 | Lógica de WikiLink ghost, criação de nós, sync de edges | Extrair `useWikiLinkCommands` hook |
| `GraphCanvas.tsx` | 307 | Hotkeys, lifecycle, seleção, renderização | Extrair `useGraphHotkeys`, `useGraphSetup` |

### 3.2 Código Duplicado

| Local 1 | Local 2 | Função Duplicada |
|---------|---------|------------------|
| `graphStore.ts:274-310` | `useWikiLinkSync.ts:88-114` | `syncEdgesFromContent` |
| `EdgeSidebar.tsx` | `PropertySidebar.tsx` | Layout, header, footer idênticos |

### 3.3 Inconsistências

1. **GraphService Interface:** Definida mas nunca implementada além de mock. Não há integração real com backend.

2. **GraphEdge usa `useNodes()`:** Deveria usar apenas as props passadas pelo React Flow para evitar acoplamento.

3. **`groupRef` não utilizado:** Em `GraphEdge.tsx:49` há `const groupRef = useRef<SVGGElement>(null)` que não é usado para nada além de referência passiva.

### 3.4 Potenciais Memory Leaks

- `TiptapEditor.tsx:34`: `debounceRef` é limpo no unmount, OK.
- `useD3Simulation.ts:256-262`: Subscription sem cleanup adequado em edge cases.

---

## 4. Oportunidades de Melhoria

### 4.1 Performance (Prioridade: CRÍTICA)

**Solução Recomendada:** Desacoplar posição visual do estado estrutural.

```
ANTES (atual):
D3 tick → Zustand → React re-render → ReactFlow internal update

DEPOIS (proposto):
D3 tick → useReactFlow().setNodes() (direto, sem Zustand)
         └→ Zustand só no final (debounce 1s ou onSimulationEnd)
```

**Implementação:**
1. `useD3Simulation` passa instância de `useReactFlow` via contexto ou parâmetro
2. `syncPositionsToStore` é substituído por `reactFlowInstance.setNodes(updater)`
3. Zustand só persiste quando simulação estabiliza (`alpha < 0.01`)

### 4.2 Remove `useNodes()` do GraphEdge

O React Flow já passa as coordenadas corretas via props. O uso de `useNodes()` é redundante e causa os re-renders em cascata.

### 4.3 Modularização do Store

Implementar padrão de slices do Zustand:

```ts
// stores/graphDataSlice.ts
export const createGraphDataSlice = (set, get) => ({
  nodes: [],
  edges: [],
  addNode: (node) => set(...),
  // ...
});

// stores/graphStore.ts
export const useGraphStore = create((...a) => ({
  ...createGraphDataSlice(...a),
  ...createInteractionSlice(...a),
  ...createPhysicsSlice(...a),
}));
```

### 4.4 Componente Base para Sidebars

Criar `<BaseSidebar>` com header/footer padrão, usado por `EdgeSidebar` e `PropertySidebar`.

---

## 5. Plano de Correção Recomendado

| Fase | Ação | Impacto | Esforço |
|------|------|---------|---------|
| 1 | Remover `useNodes()` do `GraphEdge` | Alto | Baixo |
| 2 | Refatorar sync D3→ReactFlow (bypass Zustand) | Crítico | Médio |
| 3 | Dividir `graphStore.ts` em slices | Médio | Médio |
| 4 | Extrair hooks de `GraphCanvas` e `TiptapEditor` | Médio | Médio |
| 5 | Criar `BaseSidebar` component | Baixo | Baixo |

---

## 6. Conclusão

A análise confirma que os problemas de **seleção e performance estão diretamente relacionados** ao padrão de update atual. A correção da Fase 1 e 2 deve resolver ambos os bugs de forma definitiva.

A refatoração adicional (Fases 3-5) melhorará significativamente a manutenibilidade, mas não é urgente para resolver os bugs reportados.

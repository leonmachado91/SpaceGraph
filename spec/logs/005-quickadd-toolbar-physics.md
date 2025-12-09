# 005 - Quick Add, Refatoração de Toolbar e Correções de Física

## Resumo da Sessão

Nesta sessão, focamos na implementação da funcionalidade "Quick Add" (criação rápida de nós via handles), na criação e posterior remoção do componente `TheDock` em favor de uma `CanvasToolbar` unificada, e na resolução de bugs críticos de sincronização entre o estado do React Flow e a simulação de física D3.

### 1. Funcionalidade Quick Add (Fase 1.3)
- **Implementado Click-to-Create:** Clicar no handle direito (`source`) de um nó cria instantaneamente um nó filho conectado a +150px de distância.
- **Implementado Drag-to-Create:** Arrastar um handle para o espaço vazio do canvas cria um novo nó na posição do soltura.
- **Implementado Drag-to-Connect:** Arrastar para um nó existente conecta os dois (comportamento padrão mantido/reforçado).

### 2. The Dock & Toolbar (Fase 2.1)
- **Implementação Inicial:** Criado componente lateral `TheDock` com navegação (Visualização, Tags, Settings).
- **Feedback & Refatoração:** O usuário optou por centralizar tudo na barra superior.
- **Remoção:** Componente `TheDock.tsx` foi excluído e suas referências removidas do `GraphCanvas`.
- **CanvasToolbar Unificada:**
  - Adicionado dropdown de **Visualização** (Grafo, Lista, Timeline).
  - Adicionado botão de **SuperTags** (abre modal `TagManager`).
  - Restaurado botão de **Settings**.
  - Removido botão visual de **Reheat** (funcionalidade mantida interna).

### 3. Correções de Física e Sincronização
Ocorreram problemas onde novos nós ficavam "fixos" (sem física) ao serem criados. A investigação revelou um descompasso entre o Zustand Store e a instância interna do React Flow.

- **Sincronização Imediata:** Atualizado `GraphNode.tsx` e `GraphCanvas.tsx` (nos eventos `onClick`, `onLetGo` e `onDoubleClick`) para registrar novos nós explicitamente na instância do React Flow (`reactFlow.addNodes`) ao mesmo tempo que no Store. Isso garante feedback visual instantâneo.
- **Retorno de IDs:** O store `graphStore.ts` foi atualizado para que as actions `addNode` e `addEdge` retornem os IDs gerados, permitindo uso imediato pelos componentes.
- **Correção do Resume:** Modificado o hook `useD3Simulation.ts`. Ao retomar a física (Resume), ele agora verifica se a quantidade de nós no Store difere da simulação. Se houver discrepância (nós adicionados durante pausa), ele força um reinício (Restart) completo da simulação para incluir os novos elementos.

---

## Arquivos Modificados

### Componentes de UI/Grafo
- `src/components/graph/CanvasToolbar.tsx`: Adicionados novos botões, dropdown de visão, removido Reheat.
- `src/components/graph/GraphCanvas.tsx`: Integrado TagManager, removido Dock, corrigida lógica de `onConnectEnd` e `onPaneDoubleClick`.
- `src/components/graph/GraphNode.tsx`: Adicionado handler de clique para Quick Add com sincronização React Flow.

### Lógica e Store
- `src/lib/store/graphStore.ts`: Atualizados `addNode` e `addEdge` para retornar IDs (string).
- `src/lib/hooks/useD3Simulation.ts`: Melhorada lógica de `resume` para detectar mudanças estruturais no grafo.

### Documentação
- `spec/tasks.md`: Atualizado status das tarefas da Fase 1.3 e 2.1.
- `src/components/graph/TheDock.tsx`: (Arquivo Deletado)

# 📊 Relatório de Auditoria: NeoGraph

**Data:** 06/12/2024  
**Status:** Análise Completa  
**Objetivo:** Diagnosticar problemas e propor soluções para tornar o NeoGraph um app funcional e profissional

---

## 🔴 Resumo Executivo

O NeoGraph está em um estado **não-funcional** devido a problemas críticos de arquitetura na integração entre D3.js e React Flow. A camada de dados (Mock Service) não está conectada à UI, e o hook de física (`useForceLayout`) contém bugs fundamentais que impedem a simulação de funcionar corretamente. A interface visual tem uma boa base estética (Orb/Glassmorphism), mas a UX está quebrada.

### Classificação Geral: ⚠️ Refatoração Necessária

| Área | Status | Criticidade |
|------|--------|-------------|
| Integração D3 + React Flow | 🔴 Quebrado | **Alta** |
| Camada de Dados (Services) | 🟡 Não Utilizada | **Média** |
| Componentes Visuais | 🟢 Funcional (base) | Baixa |
| Estado Global (Zustand) | 🟡 Parcialmente Conectado | Média |
| CSS/Design System | 🟢 Bem Configurado | Baixa |

---

## 🔍 Problemas Identificados

### 1. **CRÍTICO: Hook `useForceLayout` Desconectado**

**Arquivo:** [useForceLayout.ts](file:///e:/Andamento/Webapps/NeoGraph/src/lib/hooks/useForceLayout.ts)

O hook é chamado mas **não recebe nem retorna dados**. Ele busca nós internamente via `getNodes()`, mas:

```typescript
// Problema: O hook é chamado sem parâmetros e não retorna nada útil
useForceLayout(); // Linha 39 do GraphCanvas.tsx
```

**Bugs específicos:**

1. **Cópia Rasa de Nós (Linha 34):** O código cria cópias dos nós, mas o D3 atualiza essas cópias e não os nós originais. As posições calculadas nunca chegam de volta ao React Flow corretamente.

2. **Cleanup Agressivo (Linhas 105-107):** O `return` do useEffect **sempre para** a simulação, matando-a antes de completar o cálculo. Isso acontece porque as dependências incluem `getNodes().length`, que muda a cada render.

3. **Dependências Inconsistentes (Linha 110):** O array de dependências mistura funções estáveis com valores dinâmicos, causando re-execuções inesperadas:
   ```typescript
   // Problemático:
   [physicsEnabled, repulsionStrength, linkDistance, setNodes, getNodes().length, getEdges().length]
   ```

4. **Referência Mutável vs Estado Imutável:** O D3 força modifica objetos por referência (`simNode.x = ...`), mas React precisa de novas referências para detectar mudanças.

---

### 2. **CRÍTICO: Canvas Não Usa os Dados do MockService**

**Arquivo:** [GraphCanvas.tsx](file:///e:/Andamento/Webapps/NeoGraph/src/components/graph/GraphCanvas.tsx#L23-L30)

O canvas usa `INITIAL_NODES` hardcoded diretamente no componente, ignorando completamente o `MockGraphService`:

```typescript
// Dados hardcoded que ignoram o serviço
const INITIAL_NODES = [
    { id: '1', position: { x: 0, y: 0 }, data: { title: 'Start' }, type: 'orb' },
    { id: '2', position: { x: 200, y: 100 }, data: { title: 'End' }, type: 'orb' },
];
```

**Consequências:**
- O MockService tem 5 nós ricos (`Big Bang`, `Stars`, etc.) que nunca aparecem
- Não há persistência (nem em memória) das mudanças
- O padrão "Service Layer" documentado em `proposal.md` não foi implementado

---

### 3. **MÉDIO: Tipos Incompatíveis entre Camadas**

**Arquivos:** [graph.ts](file:///e:/Andamento/Webapps/NeoGraph/src/types/graph.ts) vs componentes

Há dois sistemas de tipos conflitantes:

| Origem | Formato de Posição |
|--------|-------------------|
| `GraphNode` (types) | `x: number, y: number` (flat) |
| React Flow Node | `position: { x: number, y: number }` (nested) |

Isso exige conversão manual em todos os lugares, aumentando a chance de bugs.

---

### 4. **MÉDIO: Criação de Nó sem Coordenadas Corretas**

**Arquivo:** [GraphCanvas.tsx](file:///e:/Andamento/Webapps/NeoGraph/src/components/graph/GraphCanvas.tsx#L41-L55)

O double-click para criar nó usa `event.clientX/clientY` diretamente, sem converter para coordenadas do viewport do grafo:

```typescript
// BUG: Usa coordenadas da tela, não do canvas
position: { x: event.clientX - 100, y: event.clientY - 100 },
```

O correto seria usar `screenToFlowPosition()` do React Flow.

---

### 5. **MENOR: Design Visual Incompleto**

O [GraphNode.tsx](file:///e:/Andamento/Webapps/NeoGraph/src/components/graph/GraphNode.tsx) tem um visual Orb/Glassmorphism bem iniciado, mas:

- **Cores não são dinâmicas:** O `color` do nó (definido no MockService) não é aplicado
- **Handles invisíveis:** Os handles de conexão estão com `opacity-0`, dificultando a UX de conexão
- **Tamanho fixo (60x60):** Não há variação para nós de diferentes importâncias

---

### 6. **MENOR: Configuração do Projeto**

- **Metadata genérica:** `layout.tsx` ainda tem `"Create Next App"` como título
- **Dark Mode forçado:** Não há toggle, está hardcoded com `className="dark"`
- **TanStack Query configurado mas não usado:** O provider existe, mas nenhuma query foi criada

---

## 🛠️ Recomendações de Ação

### Nível 1: Conserto Imediato (Bugs Bloqueantes)

#### 1.1 Refatorar `useForceLayout` Completamente

```diff
- Approach atual: Hook autônomo que tenta sincronizar internamente
+ Approach recomendado: Hook controlado que recebe nodes/edges e retorna posições atualizadas
```

**Estratégia sugerida (padrão da indústria):**

1. Usar `useRef` para manter a simulação D3 fora do ciclo de vida React
2. O D3 calcula posições, mas **não chama setNodes no tick**
3. Usar `requestAnimationFrame` para fazer batch updates
4. Implementar flag `isDragging` para pausar física durante drag

#### 1.2 Conectar MockService ao Canvas

Criar hook `useGraphData`:
```typescript
// lib/hooks/useGraphData.ts
export function useGraphData(systemId: string) {
    return useQuery({
        queryKey: ['graph', systemId],
        queryFn: () => mockGraphService.getGraph(systemId),
    });
}
```

E usar no Canvas para popular os nós iniciais.

---

### Nível 2: Arquitetura Sólida

#### 2.1 Criar Camada de Adaptadores

Para resolver a incompatibilidade de tipos, criar funções de mapeamento:

```typescript
// lib/adapters/graphAdapter.ts
export function toReactFlowNode(graphNode: GraphNode): Node {
    return {
        id: graphNode.id,
        position: { x: graphNode.x, y: graphNode.y },
        data: { title: graphNode.title, color: graphNode.color },
        type: 'orb',
    };
}
```

#### 2.2 Implementar Gestão de Estado Centralizada

O grafo tem três "fontes de verdade" conflitantes:
1. Estado interno do React Flow (`useNodesState`)
2. Estado do MockService
3. Posições calculadas pelo D3

**Recomendação:** Usar Zustand como fonte única de verdade para os dados do grafo, e React Flow apenas como "view layer".

---

### Nível 3: UX/UI Polish

| Item | Ação |
|------|------|
| Handles invisíveis | Mostrar handles on hover do nó |
| Cores dinâmicas | Aplicar `data.color` ao glow e borda |
| Criação de nó | Usar `screenToFlowPosition()` |
| Metadata | Atualizar título para "NeoGraph - Knowledge Space" |

---

## 📋 Proposta de Reconstrução

Dado o nível de problemas fundamentais, recomendo **reconstruir a camada de integração D3+ReactFlow do zero**, mantendo:

- ✅ Estrutura de diretórios atual
- ✅ CSS/Design System existente  
- ✅ Componente visual GraphNode (com ajustes)
- ✅ MockGraphService (conectando-o)
- ✅ Zustand Store (expandindo-o)

E substituindo:

- ❌ `useForceLayout.ts` → Nova implementação com padrão correto
- ❌ Lógica de dados do `GraphCanvas.tsx` → Usar React Query + Service

### Estimativa de Esforço

| Tarefa | Complexidade | Horas Estimadas |
|--------|--------------|-----------------|
| Refatorar useForceLayout | Alta | 4-6h |
| Conectar MockService | Média | 2-3h |
| Adapters de tipos | Baixa | 1h |
| Ajustes visuais | Baixa | 1-2h |
| Testes manuais | Média | 2h |

**Total estimado:** 10-14 horas de trabalho focado

---

## ❓ Decisões Pendentes

1. **Física sempre ativa ou toggle?**  
   O store tem `physicsEnabled`, mas onde fica o controle na UI?

2. **Persistência local antes do Supabase?**  
   O roadmap sugere localStorage na Fase 0-3. Implementar agora?

3. **Prioridade: funcionalidade ou visual?**  
   Corrigir bugs primeiro ou polir a aparência junto?

---

## 📎 Anexos

### Arquivos Principais Analisados

| Arquivo | Linhas | Problemas |
|---------|--------|-----------|
| [GraphCanvas.tsx](file:///e:/Andamento/Webapps/NeoGraph/src/components/graph/GraphCanvas.tsx) | 85 | Dados hardcoded, integração D3 quebrada |
| [GraphNode.tsx](file:///e:/Andamento/Webapps/NeoGraph/src/components/graph/GraphNode.tsx) | 64 | Visual ok, handles escondidos |
| [useForceLayout.ts](file:///e:/Andamento/Webapps/NeoGraph/src/lib/hooks/useForceLayout.ts) | 118 | Múltiplos bugs de sincronização |
| [MockGraphService.ts](file:///e:/Andamento/Webapps/NeoGraph/src/lib/services/MockGraphService.ts) | 69 | Funcional, mas não utilizado |
| [graphSettingsStore.ts](file:///e:/Andamento/Webapps/NeoGraph/src/lib/store/graphSettingsStore.ts) | 26 | Ok, parcialmente conectado |

---

**Próximo Passo Recomendado:** Aprovar este relatório e decidir se queremos:
1. **Refatorar incrementalmente** (menor risco, mais lento)
2. **Reconstruir a integração D3+RF** (mais limpo, risco médio)

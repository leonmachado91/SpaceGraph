# Adicionar Controles de Física Avançada ao UI

## Objetivo
Adicionar controles deslizantes (sliders) no painel de configurações (`SettingsPanel.tsx`) para permitir ajuste em tempo real de todas as variáveis físicas que foram tunadas recentemente.

## Variáveis a Adicionar
1.  `centerStrength` (Gravidade Central)
2.  `axisStrength` (Gravidade dos Eixos)
3.  `densityGenericFactor` (Fator de Crescimento de Tamanho)
4.  `densityChargeFactor` (Fator de Crescimento de Repulsão)
5.  `densityMaxSize` (Tamanho Máximo do Nó)

## Alterações Necessárias

### 1. `src/lib/store/graphStore.ts`
- **Interfaces**: Atualizar `GraphState` e `GraphActions` com os novos campos e setters.
- **Valores Iniciais**: Inicializar usando as constantes de `src/lib/constants/index.ts`.
- **Selectors**: Criar hooks seletores para performance (`useCenterStrength`, etc).

### 2. `src/lib/simulation/D3SimulationManager.ts`
- **UpdateConfig**: Garantir que o método `updateConfig` aceite e aplique TUDO. Atualmente ele só olha para repulsão e colisão.
- **Reatividade**: As forças `center`, `x` e `y` precisam ser reconfiguradas quando os valores mudarem.

### 3. `src/components/graph/SettingsPanel.tsx`
- **UI**: Adicionar os novos sliders.
- **Handlers**: Conectar aos setters do store e disparar o update.

### 4. `src/components/graph/GraphNode.tsx` e `GraphEdge.tsx`
- **Reatividade Visual**: O tamanho do nó (`densityGenericFactor`) precisa ser reativo. Atualmente eles leem direto de `PHYSICS`. Precisam ler do `store`.

## Plano de Execução
1.  Atualizar `GraphStore` (Adicionar estados e ações).
2.  Atualizar `D3SimulationManager` (Melhorar `updateConfig`).
3.  Atualizar `SettingsPanel` (Adicionar UI).
4.  Refatorar `GraphNode`/`GraphEdge` para ler do Store em vez de constantes fixas (para permitir ajuste em tempo real).

## Verificação
- Abrir settings, mover sliders e ver:
    - O grafo "respirar" diferentemente (física).
    - Os nós mudarem de tamanho instantaneamente (visual).
    - O grafo se centralizar mais ou menos.

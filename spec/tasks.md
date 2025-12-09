# Tasks: Correção de Performance e Seleção

## Fase 1: Quick Win - GraphEdge

- [x] 1.1 Remover `useNodes()` do `GraphEdge.tsx`
- [x] 1.2 Calcular coordenadas do centro a partir das props `sourceX/Y` e `targetX/Y`
- [x] 1.3 Ajustar offset baseado na posição dos handles (Left/Right)
- [ ] 1.4 Testar que geometria das edges está correta
- [ ] 1.5 Testar que seleção funciona imediatamente após carregar

## Fase 2: Desacoplar D3 do Zustand

- [x] 2.1 Modificar `useD3Simulation` para receber instância do React Flow
- [x] 2.2 Substituir `syncPositionsToStore` por `reactFlowInstance.setNodes()`
- [x] 2.3 Adicionar debounce (1s) para persistir posições no Zustand
- [x] 2.4 Garantir sync no `releaseNode` (fim do drag)
- [x] 2.5 Adicionar callback `onSimulationEnd` para sync final
- [ ] 2.6 Testar animação fluida durante drag
- [ ] 2.7 Testar persistência após reload

## Fase 3: Limpeza e Ajustes

- [ ] 3.1 Remover CSS overrides desnecessários de pointer-events
- [ ] 3.2 Remover `groupRef` não utilizado do `GraphEdge.tsx`
- [ ] 3.3 Validar todos os cenários de interação (criar, editar, deletar edge)

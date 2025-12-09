# Lista de Tarefas: Refatoração e Limpeza (Fase 2)

- [x] **Correção de Lógica React (GraphCanvas)**
    - [x] Substituir o estado local `selectedNodeId` e `selectedEdgeId` pelo uso direto de variáveis da store (`selectedNodeIds`, etc) ou manter sincronização de forma mais limpa.
    - [x] *Objetivo:* Eliminar o `useEffect` da linha 98 que causa o aviso de lint e simplificar o componente.
    - [x] Corrigir sintaxe Tailwind na linha 355 (remover `_`).

- [x] **Limpeza de Arquivos Mortos**
    - [x] Apagar `src/components/graph/TheDock.tsx` (arquivo legado).

- [x] **Revisão Final**
    - [x] Verificar se aplicação roda sem erros.
    - [x] Assumir que estilos inline restantes são intencionais.

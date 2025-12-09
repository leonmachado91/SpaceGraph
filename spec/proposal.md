# Proposta de Refinamento e Limpeza Final

## 1. Diagnóstico e Soluções (Rodada 2)

### 1.1. Erros de React (`setState` síncrono em `useEffect`)
**Problema:** O linter alerta sobre atualizações de estado dentro de `useEffect`, que podem causar renders em cascata.
1.  **`setMounted(true)` (L54):** Padrão comum em Next.js para evitar erros de hidratação.
    -   *Solução:* Manter como está, pois é necessário para a corretude da UI (evitar flash de conteúdo não hidratado). Adicionaremos um comentário explicativo se necessário, mas o código está correto.
2.  **`setSelectedNodeId(nodeId)` (L98):** Sincronização de estado local com a store global.
    -   *Solução:* Refatorar para **remover o estado local duplicado**. Em vez de copiar o ID da store para um state local `selectedNodeId`, podemos derivar a UI diretamente da store `useGraphStore`. Isso elimina o `useEffect` problemático e simplifica o código (Less State is Better State).

### 1.2. Sintaxe Tailwind (Otimização)
**Problema:** Sugestão de remoção de underscores na classe do gradiente.
-   *Solução:* Remover os underscores `_` da classe arbitrária `bg-[radial-gradient(...)]` conforme sugerido pelo linter.

### 1.3. Acessibilidade (`TheDock.tsx`)
**Problema:** Botão sem título.
-   *Solução:* Localizar o arquivo (se estiver fora de `src/components/graph`, faremos uma busca mais ampla) e adicionar `title`.

### 1.4. CSS Inline Remanescente
**Problema:** Avisos sobre estilos em props dinâmicas (`transform`, `backgroundColor` baseada em props do nó).
-   *Solução:* **Não alterar**. Estilos que dependem de variáveis em tempo de execução (como posição X/Y de um nó arrastável ou cor definida pelo usuário) *devem* ser inline para performance. Classes CSS são estáticas. Tentar forçar isso via CSS-in-JS ou muitas classes geradas dinamicamente é pior. Consideraremos esses avisos como "Falsos Positivos da Ferramenta" para este contexto de visualização de dados (D3/ReactFlow).

## 2. Tarefas
- Refatorar `GraphCanvas.tsx` para usar seleção direta da Store (eliminar `selectedNodeId` local e o `useEffect` associado).
- Corrigir sintaxe do gradiente em `GraphCanvas.tsx`.
- Procurar e corrigir `TheDock.tsx`.

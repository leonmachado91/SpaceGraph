# NeoGraph-FRONT: Engenharia do Grafo, Física e Performance

**Versão:** 1.0
**Contexto:** Especificações técnicas de Frontend e renderização gráfica.

---

## **1. Stack de Tecnologias (Frontend Core)**

- **Framework Principal:** Next.js (App Router).
- **Canvas Engine:** `React Flow` (Versão 12+).
    - *Função:* Gerencia a viewport (Zoom/Pan), eventos de clique, seleção, minimap e a renderização DOM dos nós.
- **Physics Engine:** `d3-force` (módulo separado da biblioteca D3.js).
    - *Função:* Algoritmo matemático puro. Recebe lista de nós/arestas, calcula colisões/atrações e devolve coordenadas `x,y`. Não renderiza nada visualmente.
- **State Sync:** `TanStack Query` (React Query) + `Zustand`.
- **Estilização:** Tailwind CSS.

---

## **2. O Motor Híbrido: Integrando React Flow e D3**

O maior desafio técnico do NeoGraph é fazer o React Flow (que espera posições estáticas) funcionar com o D3 (que gera posições dinâmicas a 60fps).

### **2.1. O Ciclo de Vida da Simulação**

Não tentaremos atualizar o estado do React (`useState`) a cada frame da física, pois isso travaria a aplicação. Usaremos uma abordagem de "Mutação Direta Controlada".

1. **Inicialização (Topologia):**
    - Buscamos a lista leve de Nós e Arestas.
    - Passamos esses objetos para a instância do `d3.forceSimulation`.
2. **O "Tick" da Física:**
    - O D3 executa seu loop interno (Tick).
    - **Truque de Performance:** Em vez de chamar `setNodes` do React Flow (que re-renderiza tudo), nós atualizamos diretamente a posição dos nós observados se necessário, ou usamos um `requestAnimationFrame` que sincroniza o estado visual apenas quando há movimento significativo.
    - *Sugestão:* Usar o hook `useNodesState` do React Flow mas com debounce visual ou atualização em batches se a rede for muito grande (>1000 nós). Para redes médias (<500), atualização em tempo real (30-60fps) é viável.

### **2.2. Forças Aplicadas**

A receita da física do NeoGraph será composta por:

```jsx
const simulation = d3.forceSimulation(nodes)
  .force("charge", d3.forceManyBody().strength(-300)) // Repulsão (Evita amontoar)
  .force("link", d3.forceLink(links).id(d => d.id).distance(150)) // Mola (Conexões)
  .force("center", d3.forceCenter(width / 2, height / 2)) // Gravidade central
  .force("collide", d3.forceCollide().radius(d => d.size + 10)); // Evita sobreposição física

```

*Ajuste Fino:* A força `strength` da carga negativa e a distância do link devem ser ajustáveis nas configurações do sistema pelo usuário (slider de "Espaçamento").

---

## **3. Estratégia "Light Graph" & Lazy Loading**

Implementação do carregamento segmentado para garantir "Time-to-Interactive" instantâneo.

### **3.1. Fetch Nível 1: Topologia (Eager Loading)**

Ao abrir o sistema, chamamos `useQuery(['graph-topology', systemId])`.

- **O que vem:** JSON Array simples contendo apenas `{ id, x, y, label, icon, color, size }` para nós e `{ source, target }` para links.
- **Visualização:** O React Flow renderiza todos os nós imediatamente usando um "Custom Node Component".
- **Conteúdo:** Dentro desse componente, não há texto longo, apenas o visual.

### **3.2. Fetch Nível 2: Detalhes (On-Demand / Sidebar)**

O conteúdo Rich Text e propriedades pesadas **não vivem no Nó visual**.

- Quando o usuário clica num nó:
    1. O nó ganha status `selected: true`.
    2. Um componente lateral (**Panel de Propriedades/Edição**) desliza para dentro.
    3. Este Panel dispara `useQuery(['node-details', nodeId])`.
    4. Exibe skeleton loading por ~200ms e carrega o Tiptap Editor.
- *Benefício:* Você pode ter 10.000 notas, mas só consome memória/banda para 1 (a que está sendo lida/editada).

---

## **4. Level of Detail (LOD) Semântico**

Para que o Canva fique legível tanto de longe quanto de perto, usaremos Renderização Condicional baseada no Zoom.

**Hook:** `const { zoom } = useViewport();` dentro do Custom Node.

1. **Nível Macro (Zoom < 0.5): "Galaxy View"**
    - Renderiza: Apenas um `div` circular com a `background-color` definida.
    - Oculta: Texto, ícones, botões de conexão (+).
    - CSS: `box-shadow` e `border` removidos para performance.
2. **Nível Médio (Zoom 0.5 a 1.2): "Overview"**
    - Renderiza: Ícone + Título (com text-overflow ellipsis).
3. **Nível Micro (Zoom > 1.2): "Detail View"**
    - Renderiza: Título Completo + Tags (Badges coloridos) + Botão de "Quick Add" (+).
    - Interatividade completa habilitada.

---

## **5. Manipulação de Estado (Stores)**

Utilizaremos **Zustand** para o estado global do app (fora do cache do servidor).

### **`graphSettingsStore`**

Controla as variáveis globais da física e visualização.

```tsx
interface GraphSettings {
  physicsEnabled: boolean; // Toggle Play/Pause da gravidade
  repulsionStrength: number; // Slider de repulsão
  linkDistance: number; // Comprimento das arestas
  showGrid: boolean; // Background
  togglePhysics: () => void;
}

```

### **`interactionStore`**

Controla o que o usuário está fazendo (Máquina de Estado de UI).

```tsx
type Mode = 'view' | 'select' | 'pan'; // Principalmente para Mobile
interface InteractionState {
  currentMode: Mode;
  selectedNodeId: string | null; // Abre o painel lateral
  setSelection: (id: string | null) => void;
}

```

---

## **6. Fluxo de Criação de Nós (Frontend UX)**

### **6.1. Clique Duplo (Double Click)**

1. Listener `onPaneClick` detecta duplo clique no fundo.
2. Captura coordenada `project(x,y)` (convertendo pixel de tela para coordenada do React Flow).
3. Chama mutation `createNode`.
4. Insere nó temporário no React Flow (Optimistic Update).

### **6.2. Quick Add (Botão +)**

1. Hover no Nó A exibe botão `+` na direita.
2. **Clique:** Cria Nó B posicionado a `x + 100` do Nó A, e cria Aresta A->B. A física automaticamente empurrará o Nó B para uma posição confortável.
3. **Drag (Arrastar):**
    - Inicia a criação de uma `connectionLine` (linha fantasma).
    - Se soltar no vazio: Abre mini-modal para criar nó ali.
    - Se soltar em outro Nó C: Cria Aresta A->C.

---

## **7. Responsividade e Gestos (Mobile Implementation)**

No mobile, o React Flow precisa ser configurado diferentemente.

- **Touch Action:** Configurar CSS `touch-action: none;` no container para evitar que o browser dê refresh/back.
- **Proximity Connect:** No desktop, conectar linhas exige precisão. No mobile, aumentaremos a "zona de acerto" (Hitbox) das handles (bolinhas de conexão) para 20px ou 30px transparentes, facilitando o toque.
- **Gestos:** Mapear a lógica decidida no PRD (1 dedo = seleção/box, 2 dedos = pan) utilizando a prop `panOnDrag` e `selectionOnDrag` controlada por lógica de quantos toques estão ativos (event listeners de `touchstart`).
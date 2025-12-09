# NeoGraph-EDITOR: Rich Text, WikiLinks e Interatividade

**Versão:** 1.0
**Contexto:** Especificações da experiência de escrita e interação detalhada com o grafo (Mobile/Desktop).

---

## **1. O Editor Rich Text (Tiptap Implementation)**

Utilizaremos o **Tiptap** (headless wrapper do Prosemirror) como motor de edição. Ele oferece total controle sobre o HTML renderizado e o comportamento de componentes customizados.

### **1.1. Configuração de Extensões**

- **Essenciais:** `StarterKit` (Bold, Italic, Lists, Heading), `Placeholder`, `Image` (upload via Supabase).
- **Customizada:** `NeoNodeMention` (Sistema de WikiLinks).

### **1.2. A Lógica do WikiLink Inteligente (`[[...]]`)**

O sistema de links não é apenas texto clicável (azul e sublinhado). Ele é um **Componente React vivo** inserido no texto.

**Fluxo de Interação:**

1. **Gatilho:** O usuário digita `[[` no editor.
2. **Menu Flutuante (Suggestion Plugin):** Uma lista popup aparece (renderizada via `tippy.js`) mostrando os títulos dos nós existentes no sistema. A busca é fuzzy (aproximada) via Supabase.
3. **Seleção:** Ao escolher um nó, o texto `[[Busca]]` é substituído por um nó (átomo) do ProseMirror.
4. **Armazenamento (JSON/HTML):** No banco, o conteúdo é salvo de forma semântica, contendo o UUID do nó alvo, **não** o título hardcoded.
    
    ```json
    {
      "type": "nodeMention",
      "attrs": { "id": "uuid-do-no-alvo-123" }
    }
    
    ```
    

**Renderização e Sincronização Automática:**
Quando o Tiptap lê esse JSON para renderizar na tela (Read Mode ou Edit Mode):

- Ele renderiza um Componente React customizado: `<NodeMentionComponent id="uuid..." />`.
- Este componente faz um *hook* com o React Query: `useNodeTitle(id)`.
- **Resultado:** Se o Nó A for renomeado de "Teoria" para "Hipótese", o link dentro do Nó B mudará automaticamente para "Hipótese", pois ele sempre renderiza o valor atual do banco, ignorando texto estático.

---

## **2. Interatividade do Grafo (Gestão de Conexões/Edges)**

As linhas não são estáticas. Elas permitem manipulação fluida para reordenar o raciocínio.

### **2.1. Criação de Conexões (Desktop/Mouse)**

- **Handles (Alças):** Cada Nó possui 4 "portas" (cima, baixo, esquerda, direita) invisíveis que aparecem ao passar o mouse.
- **Ação:** Clicar numa handle e arrastar cria uma "linha flutuante". Soltar em outro nó cria a aresta.
- **Snapping:** A linha flutuante sente a gravidade magnética (snap) quando está perto de uma handle de outro nó.

### **2.2. Arestas Reconectáveis (Re-connectable Edges)**

Feature nativa do React Flow habilitada para alta produtividade.

- **Comportamento:** Ao passar o mouse sobre uma Linha existente, alças aparecem nas extremidades (onde ela toca os nós).
- **Edição:** O usuário pode pegar a ponta da linha que está conectada no Nó A e arrastá-la para conectar no Nó C.
- **Utilidade:** Fundamental para refatorar ideias ("Não, essa prova não se conecta ao suspeito X, conecta ao suspeito Y").

---

## **3. UX Avançada Mobile & Gestos**

Implementar interatividade complexa em telas de toque exige driblar os comportamentos padrão do navegador.

### **3.1. Diferenciação de Toque (Touch Handling Logic)**

Como definido, teremos uma distinção clara baseada na quantidade de dedos. Para isso, criaremos um *Wrapper Component* em torno do React Flow que intercepta eventos `touchstart` e `touchmove`.

**Lógica de Interceptação:**

```jsx
// Pseudo-código da lógica de gestos
const onTouchStart = (e) => {
  const touches = e.touches.length;

  if (touches === 2) {
    // 2 Dedos: Habilita modo PAN do React Flow
    setPanOnDrag(true);
    setSelectionOnDrag(false);
  } else if (touches === 1) {
    // 1 Dedo: Verifica o alvo
    if (e.target.isNode) {
       // Se tocou num nó: Move o nó (comportamento padrão)
    } else {
       // Se tocou no vazio: Habilita caixa de seleção
       setPanOnDrag(false);
       setSelectionOnDrag(true);
    }
  }
}

```

### **3.2. Hitboxes Otimizadas (Fat Fingers)**

O dedo humano é impreciso. Elementos clicáveis precisam ser maiores do que parecem.

- **Conexões:** As linhas visíveis têm 2px de espessura, mas terão um "tubo transparente" invisível de 20px ao redor delas para capturar cliques/toques.
- **Handles (Portas de conexão):** Em mobile, não podemos depender de "hover".
    - *Solução:* Ao selecionar (tocar) um nó, as handles se tornam visíveis e grandes bolinhas semitransparentes ao redor do nó, fáceis de serem arrastadas para criar links.

---

## **4. O Sistema de Sidebar (Propriedades)**

Para não poluir o Canva, a edição de dados ocorre lateralmente.

### **4.1. Anatomia do Painel**

Quando um nó é selecionado (click), uma `Sheet` (do Shadcn/UI) desliza da direita para a esquerda (desktop) ou de baixo para cima (mobile).

- **Cabeçalho:** Ícone, Título Editável (Input Grande), Cor (Color Picker Popover).
- **Corpo (Tabs):**
    - **Tab "Texto":** Editor Tiptap (Conteúdo).
    - **Tab "Propriedades":**
        - Lista de SuperTags aplicadas (Badges removíveis).
        - Botão "Adicionar Tag" (Search com Autocomplete).
        - Campos das Tags (Input Numérico para idade, DatePicker para datas).
- **Rodapé:** Botão "Deletar", "Converter Tipo".

### **4.2. Persistência de Dados**

- **Debounce:** As alterações no editor de texto e propriedades não salvam a cada letra (`keyup`). Utilizamos um `debounce` de 1000ms. Se o usuário parar de digitar por 1 segundo, salvamos no Supabase (Autosave).
- **Indicador:** Um pequeno ícone de "nuvem" no rodapé da Sidebar mostra status: "Salvando...", "Salvo", "Erro".

---

## **5. Media Integration (Imagens)**

- **Drag & Drop:** O usuário pode arrastar uma imagem do desktop diretamente para cima de um Nó ou para a Sidebar.
- **Paste:** `Ctrl+V` dentro do Tiptap cola a imagem.
- **Pipeline:**
    1. Frontend gera um blob local (preview instantâneo).
    2. Upload assíncrono para Supabase Storage.
    3. Recebe URL pública.
    4. Substitui blob local pela URL do Supabase no Tiptap JSON.
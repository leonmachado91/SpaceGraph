# NeoGraph-PRD: Documento de Requisitos do Produto

**Versão:** 1.0
**Status:** Aprovado para Arquitetura
**Escopo:** Mínimo Produto Viável (MVP)

---

## **1. Visão do Produto**

O **NeoGraph** é um Ambiente de Conhecimento Espacial. Diferente de wikis tradicionais (listas de links) ou quadros brancos puros (apenas visuais), o NeoGraph combina **Estrutura de Dados Rica** (como Notion/Obsidian) com **Visualização em Grafos Baseada em Física** (como D3/Neo4j visual).

**Princípio Central:** A organização do conhecimento emerge organicamente. Notas mais conectadas (mais densas) atraem naturalmente notas relacionadas, criando aglomerados (clusters) de tópicos sem a necessidade de pastas manuais.

---

## **2. Entidades Principais (Core Entities)**

O sistema é composto por três blocos de construção fundamentais.

### **2.1. Nós (Nodes)**

São as unidades atômicas de informação (equivalente a uma Página ou Nota).

- **Comportamento Físico:** O "peso" e o "tamanho" visual do nó no Canva são determinados pelo número de conexões (densidade). Nós importantes crescem e atraem vizinhos; nós isolados orbitam ou se afastam.
- **Estrutura de Dados:**
    - **Identidade:** UUID, Título (Unique ID), Autor, Data de Criação/Atualização.
    - **Conteúdo:** Documento Rich Text (Tiptap) interno.
    - **Visual:** Ícone, Cor (Pickeable), Forma (Círculo, Quadrado, Hexágono).
    - **Metadados (Tags/SuperTags):** Lista de atributos dinâmicos.

### **2.2. Arestas (Edges / Conexões)**

Diferente de outros apps, as conexões são "cidadãos de primeira classe". Elas possuem seus próprios metadados e semântica.

- **Visualização:** Podem ser Linhas Retas, Curvas (Bezier) ou Step (Ortogonais).
- **Direcionalidade:** Unidirecional (A -> B), Bidirecional (A <-> B) ou Não-Direcional (A - B).
- **Interatividade (Re-connectable):** O usuário pode clicar na extremidade de uma conexão existente e "plugá-la" em outro nó.
- **Dados:** Podem conter Título/Label (ex: "é pai de", "refuta", "cita") e SuperTags próprias.

### **2.3. SuperTags (Etiquetas com Herança)**

O sistema de tipagem dinâmica. Uma Tag no NeoGraph não é apenas um texto colorido; é um modelo (template) de dados.

- **Lógica de Herança:** Ao aplicar a tag `#Livro` a um Nó, o sistema injeta automaticamente os campos: "ISBN", "Autor", "Ano".
- **Multi-Tagging:** Um nó pode ter tags `#Pessoa` e `#Professor`. Os campos de ambas são somados na barra de propriedades do Nó.

---

## **3. Mecânicas do Canva e Física (Space Mechanics)**

### **3.1. Motor de Física (D3 Force Simulation)**

- **Atração (Gravity):** Conexões agem como "molas". Nós conectados tentam se aproximar.
- **Repulsão (Charge):** Todos os nós possuem uma carga negativa para evitar sobreposição (bater e ficar um em cima do outro). Eles precisam de "espaço vital".
- **Centralização:** O sistema inteiro tende a flutuar para o centro do Canva se não houver interação.

### **3.2. Controle Híbrido (Auto vs. Manual)**

O usuário não deve lutar contra a física, mas pode dominá-la.

- **Interação Livre:** Quando a física está ligada, arrastar um nó o move, e ao soltar, a física retoma e ele "flutua" até uma posição de equilíbrio.
- **Pinning (Fixar):** Deve haver uma opção (menu de contexto ou atalho) para "Fixar Posição". Um nó fixado ignora a gravidade e serve como uma âncora visual para organizar o layout.

### **3.3. Lazy Loading Estratégico ("Light Graph")**

Para performance em redes massivas:

- O sistema carrega inicialmente a **topologia completa** (coordenadas e IDs de tudo) para calcular a física correta.
- O conteúdo pesado (textos longos, imagens, metadados detalhados) só é carregado sob demanda (quando o usuário clica ou dá zoom-in profundo).

---

## **4. Interface e Navegação (UX)**

### **4.1. Controles Desktop (Mouse/Teclado)**

- **Scroll:** Zoom In/Out (focado na posição do cursor).
- **Scroll Click (Roda) + Arrastar:** Pan (Mover o Canva).
- **Duplo Clique (Vazio):** Criar Novo Nó rápido na posição do mouse.
- **Clique + Arrastar (Vazio):** Selection Box (Retângulo de Seleção Azul).

### **4.2. Controles Mobile (Gestos)**

Uma experiência de design real no toque.

- **1 Dedo (Toque + Arrastar na área vazia):** Inicia o Retângulo de Seleção.
- **1 Dedo (Toque em Nó/Linha + Arrastar):** Move o elemento específico.
- **2 Dedos (Arrastar):** Pan (Mover o Canva).
- **Pinça (Pinch):** Zoom.

### **4.3. Nível de Detalhe (LOD - Level of Detail)**

O visual dos nós simplifica conforme o zoom.

- **Zoom Alto (Perto):** Vê título completo, ícone, resumo das tags, talvez prévia do conteúdo.
- **Zoom Médio:** Vê Ícone e Título truncado.
- **Zoom Baixo (Longe):** Vê apenas pontos coloridos e linhas (visão de galáxia).

### **4.4. O Fluxo de "Criação Rápida" (Quick Add)**

Ao passar o mouse sobre um nó, um botão `+` aparece nas bordas.

- **Clicar no +:** Cria um nó filho instantaneamente com uma conexão padrão.
- **Arrastar do +:** Puxa uma "linha fantasma" para conectar a um nó existente distante ou soltar no vazio para criar um novo lá.

---

## **5. Modos de Edição e Visualização**

### **5.1. Modo Canva (Principal)**

Foco na estrutura. A barra lateral (sidebar) exibe as propriedades do Nó Selecionado para edição rápida sem perder o contexto espacial.

### **5.2. Modo Leitura (Read Mode)**

Transforma a experiência em "Documento".

- O Canva desaparece (ou fica minimizado).
- O conteúdo do Nó selecionado ocupa a tela central.
- Foco em escrita longa (Long-form writing).

### **5.3. Editor Rich Text (Conteúdo)**

Dentro de cada nó, há um editor completo (baseado em Tiptap/Markdown).

- **WikiLinks Rígidos:** Digitar `[[` abre busca de nós. Ao selecionar, insere uma menção.
    - *Regra de Integridade:* O link interno não é apenas texto azul. Ele armazena o ID do nó alvo. Se o nó alvo for renomeado de "Processo A" para "Processo B", o texto dentro do link se atualiza automaticamente em todo o sistema.

---

## **6. Funcionalidades Auxiliares**

### **6.1. Histórico e Tempo (Snapshots)**

- **Tipo:** Manual.
- **Ação:** Usuário clica em "Criar Snapshot". O sistema salva o estado completo (posições, textos e conexões).
- **Visualização:** Uma régua de tempo permite "viajar" para estados passados apenas para leitura/referência (inicialmente).

### **6.2. Busca e Filtros (Highlighters)**

- A busca localiza nós por Título ou Conteúdo.
- **Efeito de "Spotlight":** Ao filtrar (ex: buscar tag `#Crime`), todos os nós irrelevantes ficam transparentes (opacidade 10%) e os nós relevantes + suas conexões diretas permanecem acesos e podem aumentar levemente de tamanho.

---

## **7. Arquivos e Dados (Sistemas)**

- **Workspace:** O app organiza grafos em "Sistemas".
- **Isolamento:** Nós de um sistema não interagem com nós de outro (inicialmente).
- **Exportação:** JSON proprietário (backup total).
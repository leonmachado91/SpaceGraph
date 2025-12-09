### **NeoGraph-UI/UX: Especificação de Design & Interface**

**Tema:** "Deep Space Knowledge" (Conhecimento no Espaço Profundo)
**Conceito Chave:** Profundidade, Neon e Transparência. O app deve parecer um painel de controle de uma nave futurista monitorando uma galáxia de dados.

---

## **1. Diretrizes Visuais Gerais (Style Guide)**

### **1.1. Paleta de Cores (Dark Mode Nativo)**
Baseado no contraste alto das referências para destacar a topologia dos grafos.

*   **Background (Canvas/Mundo):** `#09090b` (Zinc-950) ou um gradiente radial extremamente sutil indo para `#18181b`. Não use preto absoluto (`#000`), pois cansa a vista.
*   **Superfícies UI (Panels/Sidebars):** `#000000` com 60% a 80% de opacidade + Blur.
*   **Acentos (Glow/Active):** Cores neon, mas com saturação controlada para leitura.
    *   *Primary (Ação/Links):* `#3b82f6` (Blue-500) indo para Ciano.
    *   *Selection (Foco):* `#8b5cf6` (Violet-500) – Roxo dá um ar de "inteligência/magia".
    *   *Danger/Alert:* `#f43f5e` (Rose-500) – Evitar vermelho sangue puro.
*   **Texto:**
    *   *Principal:* `#f4f4f5` (Zinc-100).
    *   *Secundário:* `#a1a1aa` (Zinc-400).

### **1.2. Glassmorphism & Depth (Vidro e Profundidade)**
Utilizaremos **"High-End Glassmorphism"**.
Em vez de painéis cinzas sólidos cobrindo o grafo, usaremos superfícies translúcidas. O grafo deve estar sempre *levemente visível* por baixo das interfaces, mantendo o usuário conectado ao "todo".
*   **CSS Class Padrão:** `bg-black/60 backdrop-blur-xl border border-white/10`.
*   **Sombras:** Glows internos em vez de drop-shadows pesadas. (`shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]`).

### **1.3. Tipografia**
*   **Font Family:** *Inter* ou *Geist Sans* (San-serif moderna, legibilidade técnica).
*   **Monospace:** *JetBrains Mono* para IDs, metadados de código e JSON.
*   **Hierarquia:** Títulos em peso *SemiBold*, corpo em *Regular*. Tags em caixa alta com espaçamento (tracking) expandido.

---

## **2. Layout e Navegação**

A interface flutua sobre o Canvas (Layer 0).

### **2.1. Navegação Lateral (The Dock)**
*Inspirado na referência vertical com ícones.*
*   **Posição:** Flutuante na esquerda, largura estreita (aprox. 72px), margem de 16px da borda.
*   **Visual:** Pílula vertical arredondada (vidro fosco).
*   **Comportamento:**
    *   *Estado Padrão:* Apenas ícones (Dashboard, Sistemas, Configurações).
    *   *Hover/Expand:* Expande suavemente revelando labels ou tooltips à direita.
    *   *Item Ativo:* Ícone preenchido e iluminado (glow atrás do ícone).

### **2.2. Barra de Controle Flutuante (The HUD)**
*   **Posição:** Bottom Center (Parte inferior central).
*   **Visual:** Uma barra horizontal "Capsule" (arredondada).
*   **Ferramentas:**
    *   Botões de Zoom (-, +, % atual).
    *   Fit View (Ícone de alvo).
    *   Undo/Redo (Setas).
    *   *Slider de Física:* Um pequeno slider para controlar a força de repulsão em tempo real.

### **2.3. Top Bar (Search & Context)**
*   **Posição:** Top Left (Título do Sistema) e Top Center (Busca).
*   **Busca:** Um input que parece inativo (transparente), mas ao clicar, foca e expande com backdrop blur. O resultado da busca usa o efeito "Spotlight" no grafo (escurece tudo, acende os resultados).

---

## **3. Componentes do Grafo (Visualização de Dados)**

Esta é a área mais crítica. O visual deve seguir as referências de "network topology" anexadas.

### **3.1. Nodes (Os Nós)**
Eles não podem parecer botões HTML chatos. Devem parecer "corpos celestes".

*   **Forma:** Círculo perfeito por padrão.
*   **Renderização LOD (Level of Detail):**
    *   *Zoom < 0.3 (Far):* Ponto de luz brilhante (raio 2px), sem texto. Cor varia por tipo de Tag.
    *   *Zoom 0.5 (Mid):* Círculo sólido (raio 8px) + Ícone interno. Título aparece somente no Hover.
    *   *Zoom 1.0+ (Near):* Container completo. Círculo do ícone na esquerda + Texto do Título na direita. Badges de tags pequenas abaixo do título.
*   **Interação (Hover):**
    *   Halo Effect: Um anel de luz aparece ao redor do nó.
    *   Connections Highlight: As linhas conectadas a ele acendem, as outras ficam 30% mais opacas.

### **3.2. Edges (Conexões)**
*   **Estilo:** Linhas finas (1px). Opacidade baixa (20%) em repouso para não poluir ("fios de teia").
*   **Tipos:**
    *   *Reta:* Conexão forte/direta.
    *   *Bezier (Curva):* Conexão suave/indireta.
    *   *Animada:* Se houver um fluxo de dados ativo, pequenas "partículas" viajam pela linha (como na referência Ruxit).
*   **Labels:** O texto da conexão (ex: "é pai de") fica escondido e só aparece ao passar o mouse na linha, com fundo preto fosco pequeno para leitura.

### **3.3. Retângulo de Seleção e Quick Add**
*   **Seleção:** Retângulo azul neon (`border-cyan-500` e fundo `cyan-500/10`).
*   **Quick Add (+):** Ao passar o mouse num nó, surge uma pequena esfera `+` flutuando na órbita. Arrastar essa esfera cria uma "linha elástica" brilhante. Soltar cria um novo nó com explosão sutil de partículas.

---

## **4. Editor e Painéis (Side-Sheets)**

Quando o usuário clica num nó para "abrir", não mudamos de página. Usamos painéis deslizantes (Sheets).

### **4.1. Painel de Propriedades (Direita)**
*Inspirado no Sidebar dos prints (transparente com seções).*
*   **Animação:** Desliza da direita para esquerda (`Spring physics`).
*   **Estrutura Visual:**
    *   *Header:* Imagem de capa (se houver) com fade out, Ícone grande, Título editável enorme.
    *   *Corpo:* Editor Tiptap minimalista. Texto branco sobre fundo transparente.
    *   *Componente de Links ([[ ]]):* Pílulas clicáveis dentro do texto. Cor roxa neon (`text-violet-400 bg-violet-400/10`).
*   **Controles:** Botão de fechar (X) no topo. Botão de "Maximizar" para transformar o painel em Tela Cheia (Modo Leitura).

---

## **5. Efeitos e Micro-interações (The Juice)**

Detalhes que fazem o app parecer "premium" e responsivo.

### **5.1. D3 Physics Damping**
*   Ao abrir o sistema, os nós "explodem" do centro e se acomodam suavemente (como geleia).
*   Não deve ser rígido. Ao arrastar um nó, os vizinhos devem segui-lo com um atraso elástico, transmitindo a sensação de peso.

### **5.2. Partículas & Background**
*   **Grid de Fundo:** Uma grid pontilhada muito sutil (`dot-grid`) que desaparece ao dar zoom-out.
*   **Criação:** Ao criar um nó, uma animação de `scale-in` com bounce.

### **5.3. Sons (Sound Design - Opcional mas Recomendado)**
*   Cliques de conexão e "Snapping" (imã) devem ter um som mecânico sutil (High-tech click).

---

## **6. UX Mobile (Gestual)**

O design deve ser **Thumb-friendly** (amigável ao polegar).

*   **Floating Action Button (FAB):** O botão HUD (barra de controle) sobe um pouco para ficar acima da área segura do iPhone.
*   **Seleção de Texto:** Ao tocar num nó, ele não abre a edição direto (seria intrusivo). Ele seleciona e mostra um menu de contexto flutuante: [ Editar ] [ Conectar ] [ Deletar ].
*   **Editor:** Ao editar, a Sheet ocupa 95% da tela (estilo "Sheet" do iOS), com o topo arredondado indicando que pode ser puxada para baixo para fechar.

---

## **Resumo dos Componentes UI (Design System)**

Se fosse construir no Figma ou Storybook, estes seriam os componentes base:

1.  **`GlassCard`**: Container base translúcido para menus e dialogs.
2.  **`NeonBadge`**: Tag pequena com borda colorida brilhante e fundo gradiente sutil.
3.  **`NodeOrb`**: O componente visual do React Flow. Tem estados `idle`, `hover`, `selected`.
4.  **`HudBar`**: A barra de ferramentas inferior.
5.  **`IconBtn`**: Botões sem texto, com hover state brilhante.
6.  **`WikiLinkChip`**: O componente inline do editor de texto para referências.
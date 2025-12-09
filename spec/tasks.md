- [x] **1. GraphStore**
    - [x] Adicionar novos campos de física ao `GraphState`.
    - [x] Adicionar ações `set...` ao `GraphActions`.
    - [x] Criar hooks seletores (`use...`).

- [x] **2. D3SimulationManager**
    - [x] Atualizar `SimulationConfig` interface.
    - [x] Atualizar `updateConfig` para reaplicar `forceCenter`, `forceX`, `forceY` e atualizar lógica de densidade.
    - [x] Remover dependência direta de `PHYSICS` onde agora é configurável.

- [x] **3. SettingsPanel**
    - [x] Adicionar sliders para as novas variáveis.
    - [x] Agrupar controles por categoria (Física Básica, Densidade, Gravidade).

- [x] **4. Componentes Visuais (Reatividade)**
    - [x] `GraphNode`: Ler fatores de densidade do store.
    - [x] `GraphEdge`: Ler fatores de densidade do store.

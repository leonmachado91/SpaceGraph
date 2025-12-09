- [ ] **1. GraphStore**
    - [ ] Adicionar novos campos de física ao `GraphState`.
    - [ ] Adicionar ações `set...` ao `GraphActions`.
    - [ ] Criar hooks seletores (`use...`).

- [ ] **2. D3SimulationManager**
    - [ ] Atualizar `SimulationConfig` interface.
    - [ ] Atualizar `updateConfig` para reaplicar `forceCenter`, `forceX`, `forceY` e atualizar lógica de densidade.
    - [ ] Remover dependência direta de `PHYSICS` onde agora é configurável.

- [ ] **3. SettingsPanel**
    - [ ] Adicionar sliders para as novas variáveis.
    - [ ] Agrupar controles por categoria (Física Básica, Densidade, Gravidade).

- [ ] **4. Componentes Visuais (Reatividade)**
    - [ ] `GraphNode`: Ler fatores de densidade do store.
    - [ ] `GraphEdge`: Ler fatores de densidade do store.

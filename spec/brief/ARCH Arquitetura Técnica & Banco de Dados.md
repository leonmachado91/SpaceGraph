# NeoGraph-ARCH: Arquitetura Técnica & Banco de Dados

**Versão:** 1.0
**Contexto:** Definição do Backend e Schema SQL

---

## **1. Desenho de Arquitetura de Alto Nível**

A arquitetura do NeoGraph é "Server-Side Authoritative" para integridade de dados, mas "Client-Side Heavy" para renderização gráfica.

- **Frontend (App):** Next.js (React) rodando `ReactFlow` + `D3` na thread do cliente. Gerencia estado visual efêmero (arrastar nós, zoom).
- **Data Fetching Layer:** `TanStack Query`. Gerencia cache, refetching e estados de loading.
- **API Layer (Backend as a Service):** Supabase (PostgreSQL). Interface via `supabase-js` client e REST/PostgREST.
- **Storage:** Supabase Storage para uploads de mídia dentro dos nós (imagens nos documentos).

---

## **2. Schema do Banco de Dados (PostgreSQL/Supabase)**

O design utiliza um padrão híbrido: **Relacional Rigoroso** para a estrutura central (Nodes, Edges) e **Documento (JSONB)** para flexibilidade (conteúdo rico, posições, tags dinâmicas).

### **2.1. Tabela: `systems`**

Os "mundos" ou workspaces isolados.

```sql
create table systems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null, -- Dono (Single Player)
  title text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

```

### **2.2. Tabela: `nodes`**

A unidade atômica.

```sql
create table nodes (
  id uuid primary key default gen_random_uuid(),
  system_id uuid references systems on delete cascade not null,

  -- Core Data
  title text not null, -- Obrigatório para WikiLinks funcionarem
  type text default 'default', -- (ex: 'note', 'group', 'image')

  -- Estética (Otimizado para leitura rápida sem parsear JSON)
  color text default '#ffffff',
  icon text,

  -- Posicionamento Fixo vs. Físico
  -- Se fixed_x/y forem NULL, usa-se a física automática.
  -- Se preenchidos, o nó é fixo (pinned).
  fixed_x float,
  fixed_y float,

  -- Dados Ricos (Flexibilidade)
  -- Armazena o conteúdo do Tiptap (JSON)
  content jsonb default '{}',

  -- Armazena os valores das SuperTags (ex: { "idade": 30, "autor": "King" })
  properties jsonb default '{}',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices vitais
create index idx_nodes_system on nodes(system_id); -- Busca todos nós do sistema
create index idx_nodes_title on nodes(title); -- Autocomplete WikiLinks rápido

```

### **2.3. Tabela: `edges`**

As conexões do grafo.

```sql
create table edges (
  id uuid primary key default gen_random_uuid(),
  system_id uuid references systems on delete cascade not null,

  -- Relação
  source_node_id uuid references nodes(id) on delete cascade not null,
  target_node_id uuid references nodes(id) on delete cascade not null,

  -- Metadados da Linha
  label text, -- Texto visível na linha (opcional)
  connection_type text default 'default', -- ('directed', 'bidirectional')

  properties jsonb default '{}', -- Para tags de edges

  created_at timestamptz default now()
);

-- Garante unicidade: Apenas uma conexão A->B do mesmo tipo (opcional, para evitar duplicatas)
-- create unique index idx_edges_unique on edges(source_node_id, target_node_id, connection_type);

```

### **2.4. Tabela: `tags` (Definição das SuperTags)**

Armazena a "Classe" da tag, não a aplicação dela.

```sql
create table tags (
  id uuid primary key default gen_random_uuid(),
  system_id uuid references systems on delete cascade not null,
  name text not null, -- ex: "Person", "Evidence"
  color text,

  -- Schema das propriedades que essa tag exige
  -- Ex: [ { "key": "age", "type": "number", "label": "Idade" } ]
  schema_definition jsonb default '[]',

  created_at timestamptz default now()
);

```

### **2.5. Tabela: `node_tags` (Relacionamento N:N)**

Quais nós têm quais tags aplicadas.

```sql
create table node_tags (
  node_id uuid references nodes(id) on delete cascade not null,
  tag_id uuid references tags(id) on delete cascade not null,
  primary key (node_id, tag_id)
);

```

---

## **3. Estrutura de Snapshots (Versioning)**

Para manter o banco leve, usamos a estratégia de "Snapshots Full" manuais (não diferencial, por enquanto, pela simplicidade do MVP, dado que é Single Player).

### **3.1. Tabela: `snapshots`**

```sql
create table snapshots (
  id uuid primary key default gen_random_uuid(),
  system_id uuid references systems not null,
  name text not null, -- ex: "Versão antes da mudança"
  created_at timestamptz default now(),

  -- O BLOB GIGANTE.
  -- Salva um JSON contendo o estado completo do grafo naquele momento.
  -- { "nodes": [...], "edges": [...] }
  full_state_dump jsonb not null
);

```

*Nota Técnica:* No futuro, se os sistemas crescerem para >10.000 nós, migraremos isso para Supabase Storage (salvar como arquivo `.json` no bucket) em vez de linha no banco, pois JSONB no Postgres tem limite prático de performance para dumps gigantes. Para o MVP, JSONB na tabela é suficiente e mais fácil de consultar.

---

## **4. Row Level Security (RLS)**

Como é um app **Single Player**, a política de segurança é estrita e simples:

1. **Regra Universal:** `user_id = auth.uid()`
2. Todos os selects/inserts/updates nas tabelas `systems`, `nodes`, `edges` verificam automaticamente se o sistema pertence ao usuário logado. Isso blinda o acesso entre contas.

---

## **5. API Optimization (Graph Fetching)**

Para implementar o "Light Graph", não faremos `SELECT *`. Criaremos uma View ou Stored Procedure (RPC) para buscar o grafo leve.

### **5.1. RPC: `get_light_graph(system_uuid)`**

Função SQL customizada para o front chamar.

- **Retorno:**
    - **Nodes:** Retorna apenas `id, title, color, icon, fixed_x, fixed_y`. (Omite o pesado `content` e `properties`).
    - **Edges:** Retorna todos.
- **Objetivo:** Permitir que o app desenhe o visual e calcule a física baixando apenas ~100KB de dados, mesmo com milhares de nós. O conteúdo pesado (editor) só é baixado num segundo `SELECT` individual quando o usuário clica num nó específico.

---

## **6. Integração do Editor (WikiLinks)**

Para resolver a atualização automática de nomes (`[[Link]]`):

- **Trigger de Banco de Dados (Database Trigger):**
    - Ao atualizar `nodes.title` onde `id = X`:
    - Procura em `nodes.content` todos os objetos JSON onde `attrs.id = X`.
    - Atualiza o campo `label` ou `text` dessas menções.
- *Alternativa (Preferível para MVP/App-level):* Fazer essa lógica no Frontend. O Tiptap apenas guarda o ID. Na hora de renderizar (`read mode`), o componente React busca o título atual daquele ID no cache do TanStack Query. Isso evita escritas pesadas e complexas de "Find & Replace" dentro de JSONs no banco de dados. (Vamos adotar esta segunda abordagem no documento de Frontend).
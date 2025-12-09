-- NeoGraph SQL Schema
-- Baseado em: spec/brief/ARCH Arquitetura Técnica & Banco de Dados.md

-- 1. Tabela: Systems (Workspaces)
create table systems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Tabela: Nodes
create table nodes (
  id uuid primary key default gen_random_uuid(),
  system_id uuid references systems on delete cascade not null,

  -- Core Data
  title text not null,
  type text default 'default', -- 'note', 'group', 'image'

  -- Estética
  color text default '#ffffff',
  icon text,

  -- Posicionamento (Se NULL, usa física)
  fixed_x float,
  fixed_y float,

  -- Conteúdo Rico (JSON do Tiptap)
  content jsonb default '{}',

  -- Propriedades (SuperTags)
  properties jsonb default '{}',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_nodes_system on nodes(system_id);
create index idx_nodes_title on nodes(title);

-- 3. Tabela: Edges
create table edges (
  id uuid primary key default gen_random_uuid(),
  system_id uuid references systems on delete cascade not null,

  source_node_id uuid references nodes(id) on delete cascade not null,
  target_node_id uuid references nodes(id) on delete cascade not null,

  label text,
  connection_type text default 'default',
  properties jsonb default '{}',

  created_at timestamptz default now()
);

-- 4. Tabela: Tags (Definições)
create table tags (
  id uuid primary key default gen_random_uuid(),
  system_id uuid references systems on delete cascade not null,
  name text not null,
  color text,
  schema_definition jsonb default '[]',
  created_at timestamptz default now()
);

-- 5. Tabela: Node Tags (Relacionamento)
create table node_tags (
  node_id uuid references nodes(id) on delete cascade not null,
  tag_id uuid references tags(id) on delete cascade not null,
  primary key (node_id, tag_id)
);

-- 6. Tabela: Snapshots
create table snapshots (
  id uuid primary key default gen_random_uuid(),
  system_id uuid references systems not null,
  name text not null,
  created_at timestamptz default now(),
  full_state_dump jsonb not null
);

-- 7. Row Level Security (RLS)
alter table systems enable row level security;
alter table nodes enable row level security;
alter table edges enable row level security;
alter table tags enable row level security;
alter table node_tags enable row level security;
alter table snapshots enable row level security;

-- Políticas Genéricas (Single Player)
create policy "Users can only see their own systems"
  on systems for all
  using (auth.uid() = user_id);

create policy "Users can see nodes of their systems"
  on nodes for all
  using (exists (select 1 from systems where id = nodes.system_id and user_id = auth.uid()));

create policy "Users can see edges of their systems"
  on edges for all
  using (exists (select 1 from systems where id = edges.system_id and user_id = auth.uid()));

-- 8. RPC: Light Graph Fetching
-- Retorna apenas o necessário para desenhar o grafo, economizando banda.
create or replace function get_light_graph(sys_id uuid)
returns json
language plpgsql
as $$
declare
  result json;
begin
  select json_build_object(
    'nodes', (
      select json_agg(json_build_object(
        'id', id,
        'title', title,
        'color', color,
        'icon', icon,
        'fixed_x', fixed_x,
        'fixed_y', fixed_y
      ))
      from nodes
      where system_id = sys_id
    ),
    'edges', (
      select json_agg(json_build_object(
        'id', id,
        'source', source_node_id,
        'target', target_node_id,
        'label', label
      ))
      from edges
      where system_id = sys_id
    )
  ) into result;

  return result;
end;
$$;

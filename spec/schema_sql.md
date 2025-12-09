-- ============================================================================
-- SNAPSHOTS - Histórico de versões do sistema
-- ============================================================================
-- Referência: ARCH spec § 3.1
-- Esta tabela armazena estados completos do grafo para restauração futura.
-- ============================================================================

-- Criar tabela de snapshots
CREATE TABLE IF NOT EXISTS snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_id UUID REFERENCES systems(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- ex: "Versão antes da mudança"
    description TEXT, -- Descrição opcional do snapshot
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- O estado completo do grafo naquele momento
    -- Contém: { "nodes": [...], "edges": [...], "superTags": [...] }
    full_state_dump JSONB NOT NULL
);

-- Índice para buscar snapshots de um sistema
CREATE INDEX IF NOT EXISTS idx_snapshots_system ON snapshots(system_id);

-- Índice para ordenar por data
CREATE INDEX IF NOT EXISTS idx_snapshots_created ON snapshots(created_at DESC);

-- ============================================================================
-- RLS - Row Level Security
-- ============================================================================
-- Garante que usuários só vejam snapshots de seus próprios sistemas

ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver snapshots de sistemas que ele possui
CREATE POLICY "Users can view own snapshots" ON snapshots
    FOR SELECT
    USING (
        system_id IN (
            SELECT id FROM systems WHERE user_id = auth.uid()
        )
    );

-- Policy: Usuário pode criar snapshots em seus próprios sistemas
CREATE POLICY "Users can create snapshots" ON snapshots
    FOR INSERT
    WITH CHECK (
        system_id IN (
            SELECT id FROM systems WHERE user_id = auth.uid()
        )
    );

-- Policy: Usuário pode deletar snapshots de seus próprios sistemas
CREATE POLICY "Users can delete own snapshots" ON snapshots
    FOR DELETE
    USING (
        system_id IN (
            SELECT id FROM systems WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- SUPABASE STORAGE - Bucket para imagens
-- ============================================================================
-- Execute este comando no dashboard do Supabase (Storage > Create Bucket)
-- Nome: node-images
-- Public: true (para URLs públicas)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- Ou via SQL (requer permissões de admin):
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'node-images',
--     'node-images',
--     true,
--     5242880, -- 5MB
--     ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
-- );

-- ============================================================================
-- NOTAS
-- ============================================================================
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. A tabela `systems` deve existir antes de criar `snapshots`
-- 3. O bucket de storage deve ser criado manualmente no dashboard
-- 4. Futuro: Migrar snapshots grandes para Storage (arquivo .json)

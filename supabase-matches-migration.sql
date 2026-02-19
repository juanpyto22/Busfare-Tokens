-- ===========================================
-- MIGRACIÓN COMPLETA PARA SISTEMA DE MATCHES
-- Ejecutar TODO este script en Supabase SQL Editor
-- ===========================================

-- 1. Añadir columnas faltantes a la tabla matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'EU';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT '1v1';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player1_ready BOOLEAN DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player2_ready BOOLEAN DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team1_id UUID;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team2_id UUID;

-- 2. Crear tabla de teams si no existe
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de miembros de teams si no existe
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- 4. Políticas RLS para matches (eliminar existentes primero)
DROP POLICY IF EXISTS "Anyone can view matches" ON matches;
DROP POLICY IF EXISTS "Authenticated users can create matches" ON matches;
DROP POLICY IF EXISTS "Authenticated users can update matches" ON matches;
DROP POLICY IF EXISTS "Users can view matches" ON matches;
DROP POLICY IF EXISTS "Users can create matches" ON matches;
DROP POLICY IF EXISTS "Users can update matches" ON matches;

-- Crear nuevas políticas
CREATE POLICY "Anyone can view matches" ON matches
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create matches" ON matches
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update matches" ON matches
    FOR UPDATE USING (true);

-- 5. Políticas RLS para teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view teams" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Owners can update teams" ON teams;

CREATE POLICY "Anyone can view teams" ON teams
    FOR SELECT USING (true);

CREATE POLICY "Users can create teams" ON teams
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can update teams" ON teams
    FOR UPDATE USING (auth.uid() = creator_id);

-- 6. Políticas RLS para team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view team members" ON team_members;
DROP POLICY IF EXISTS "Users can join teams" ON team_members;

CREATE POLICY "Anyone can view team members" ON team_members
    FOR SELECT USING (true);

CREATE POLICY "Users can join teams" ON team_members
    FOR INSERT WITH CHECK (true);

-- 7. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_player1 ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_created ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- 8. Permisos
GRANT SELECT, INSERT, UPDATE ON matches TO authenticated;
GRANT SELECT ON matches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON teams TO authenticated;
GRANT SELECT, INSERT, DELETE ON team_members TO authenticated;

-- Verificar que todo está correcto
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'matches' ORDER BY ordinal_position;

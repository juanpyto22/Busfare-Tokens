-- Actualización del Schema - Campos adicionales necesarios
-- Ejecuta esto DESPUÉS de supabase-schema.sql si ya creaste las tablas

-- Añadir campos faltantes a matches
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS player1_ready BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS player2_ready BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dispute_resolution TEXT,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- Crear índices adicionales para mejorar performance
CREATE INDEX IF NOT EXISTS idx_users_banned ON users(banned_until) WHERE banned_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_tokens ON users(tokens DESC);
CREATE INDEX IF NOT EXISTS idx_users_wins ON users(wins DESC);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);
CREATE INDEX IF NOT EXISTS idx_matches_moderator ON matches(moderator_id);
CREATE INDEX IF NOT EXISTS idx_matches_winner ON matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_reviewed_by ON withdrawals(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_reports_reviewed_by ON reports(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);

-- Políticas RLS adicionales para moderadores y admins

-- Moderadores pueden ver todos los matches
CREATE POLICY "Moderators can view all matches" ON matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('moderator', 'admin')
        )
    );

-- Moderadores pueden actualizar matches
CREATE POLICY "Moderators can update matches" ON matches
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('moderator', 'admin')
        )
    );

-- Admins pueden ver todos los usuarios
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Admins pueden actualizar cualquier usuario
CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Admins pueden eliminar usuarios
CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Moderadores pueden ver todos los reportes
CREATE POLICY "Moderators can view reports" ON reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('moderator', 'admin')
        )
    );

-- Moderadores pueden actualizar reportes
CREATE POLICY "Moderators can update reports" ON reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('moderator', 'admin')
        )
    );

-- Admins pueden ver todos los retiros
CREATE POLICY "Admins can view all withdrawals" ON withdrawals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admins pueden actualizar retiros
CREATE POLICY "Admins can update withdrawals" ON withdrawals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Moderadores pueden eliminar mensajes de chat
CREATE POLICY "Moderators can delete chat messages" ON chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('moderator', 'admin')
        )
    );

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

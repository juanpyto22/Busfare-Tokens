-- =====================================================
-- TABLA DE NOTIFICACIONES
-- Esta tabla almacena todas las notificaciones de usuarios
-- =====================================================

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'team_invitation', 'match_invitation', 'tip_received', 'match_started', etc.
    title VARCHAR(255),
    message TEXT,
    
    -- Datos adicionales según el tipo de notificación
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team_name VARCHAR(100),
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    from_username VARCHAR(100),
    amount DECIMAL(10, 2), -- Para tips
    
    -- Estado
    read BOOLEAN DEFAULT FALSE,
    accepted BOOLEAN, -- NULL = pendiente, TRUE = aceptada, FALSE = rechazada
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(user_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notificaciones
-- Los usuarios solo pueden ver sus propias notificaciones
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()
    ));

-- Los usuarios pueden marcar sus notificaciones como leídas
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()
    ));

-- Los usuarios pueden borrar sus propias notificaciones
CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()
    ));

-- Cualquier usuario autenticado puede crear notificaciones (para invitaciones, tips, etc.)
CREATE POLICY "Authenticated users can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()
    ));

-- =====================================================
-- TABLA DE TRANSACCIONES DE TOKENS
-- Para tracking de todas las transacciones
-- =====================================================

CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'tip', 'match_bet', 'match_win', 'purchase', 'withdrawal'
    description TEXT,
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_transactions_from_user ON token_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_user ON token_transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_match ON token_transactions(match_id);

ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
    ON token_transactions FOR SELECT
    USING (from_user_id = auth.uid() OR to_user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Authenticated users can create transactions"
    ON token_transactions FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()
    ));

-- =====================================================
-- ACTUALIZAR TABLA USERS PARA AVATAR PERSONALIZADO
-- =====================================================

-- Agregar columna para configuración de avatar si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_config'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar_config JSONB DEFAULT '{}';
    END IF;
END $$;

-- =====================================================
-- FUNCIONES HELPER PARA NOTIFICACIONES
-- =====================================================

-- Función para limpiar notificaciones viejas (más de 30 días)
CREATE OR REPLACE FUNCTION clean_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days' 
    AND read = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE notifications IS 'Almacena todas las notificaciones de usuarios incluyendo invitaciones a equipos, matches, y tips recibidos';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificación: team_invitation, match_invitation, tip_received, match_started, match_ended';
COMMENT ON COLUMN notifications.accepted IS 'NULL = pendiente, TRUE = aceptada, FALSE = rechazada (solo para invitaciones)';

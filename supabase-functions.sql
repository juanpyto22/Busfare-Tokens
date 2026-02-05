-- Funciones RPC para Supabase
-- Ejecuta esto DESPUÉS de supabase-schema.sql y ANTES de insert-admin-users.sql

-- Función para incrementar estadísticas de usuario de forma atómica
CREATE OR REPLACE FUNCTION increment_user_stats(
    p_user_id UUID,
    p_tokens INTEGER DEFAULT 0,
    p_wins INTEGER DEFAULT 0,
    p_losses INTEGER DEFAULT 0,
    p_total_played INTEGER DEFAULT 0,
    p_earnings DECIMAL DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users
    SET 
        tokens = GREATEST(0, tokens + p_tokens),
        wins = wins + p_wins,
        losses = losses + p_losses,
        total_played = total_played + p_total_played,
        earnings = earnings + p_earnings,
        total_earned = total_earned + GREATEST(0, p_earnings)
    WHERE id = p_user_id;
END;
$$;

-- Función para actualizar rachas de victoria
CREATE OR REPLACE FUNCTION update_user_streak(
    p_user_id UUID,
    p_won BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_streak INTEGER;
    v_best_streak INTEGER;
BEGIN
    SELECT current_streak, best_streak INTO v_current_streak, v_best_streak
    FROM users
    WHERE id = p_user_id;
    
    IF p_won THEN
        v_current_streak := v_current_streak + 1;
        v_best_streak := GREATEST(v_best_streak, v_current_streak);
    ELSE
        v_current_streak := 0;
    END IF;
    
    UPDATE users
    SET 
        current_streak = v_current_streak,
        best_streak = v_best_streak
    WHERE id = p_user_id;
END;
$$;

-- Función para obtener leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(
    p_metric TEXT DEFAULT 'wins',
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    username TEXT,
    email TEXT,
    role TEXT,
    tokens INTEGER,
    wins INTEGER,
    losses INTEGER,
    total_earned DECIMAL,
    win_rate DECIMAL,
    level INTEGER,
    reputation INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.tokens,
        u.wins,
        u.losses,
        u.total_earned,
        CASE 
            WHEN u.total_played > 0 THEN (u.wins::DECIMAL / u.total_played::DECIMAL) * 100
            ELSE 0
        END as win_rate,
        u.level,
        u.reputation
    FROM users u
    WHERE u.banned_until IS NULL OR u.banned_until < NOW()
    ORDER BY
        CASE 
            WHEN p_metric = 'wins' THEN u.wins
            WHEN p_metric = 'earnings' THEN u.total_earned::INTEGER
            WHEN p_metric = 'tokens' THEN u.tokens
            WHEN p_metric = 'level' THEN u.level
            ELSE u.wins
        END DESC
    LIMIT p_limit;
END;
$$;

-- Función para verificar si un usuario está baneado
CREATE OR REPLACE FUNCTION is_user_banned(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_banned_until TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT banned_until INTO v_banned_until
    FROM users
    WHERE id = p_user_id;
    
    RETURN v_banned_until IS NOT NULL AND v_banned_until > NOW();
END;
$$;

-- Función para limpiar bans expirados (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_bans()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE users
    SET banned_until = NULL
    WHERE banned_until IS NOT NULL AND banned_until < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Función para obtener estadísticas globales rápido
CREATE OR REPLACE FUNCTION get_global_statistics()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM users),
        'total_matches', (SELECT COUNT(*) FROM matches),
        'active_matches', (SELECT COUNT(*) FROM matches WHERE status IN ('pending', 'in_progress')),
        'total_transactions', (SELECT COUNT(*) FROM transactions),
        'total_withdrawals', (SELECT COUNT(*) FROM withdrawals),
        'pending_withdrawals', (SELECT COUNT(*) FROM withdrawals WHERE status = 'pending'),
        'total_reports', (SELECT COUNT(*) FROM reports),
        'pending_reports', (SELECT COUNT(*) FROM reports WHERE status = 'pending'),
        'total_volume', (SELECT COALESCE(SUM(amount), 0) FROM transactions)
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$$;

-- Trigger para actualizar last_login automáticamente
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.last_login := NOW();
    RETURN NEW;
END;
$$;

-- Aplicar trigger (opcional, ya que lo hacemos manualmente en el código)
-- CREATE TRIGGER trigger_update_last_login
-- BEFORE UPDATE ON users
-- FOR EACH ROW
-- EXECUTE FUNCTION update_last_login();

-- Función para calcular nivel basado en experiencia
CREATE OR REPLACE FUNCTION calculate_level(p_experience INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN FLOOR(SQRT(p_experience / 100.0)) + 1;
END;
$$;

-- Función para añadir experiencia y actualizar nivel
CREATE OR REPLACE FUNCTION add_experience(
    p_user_id UUID,
    p_exp_amount INTEGER
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_exp INTEGER;
    v_new_level INTEGER;
BEGIN
    UPDATE users
    SET experience = experience + p_exp_amount
    WHERE id = p_user_id
    RETURNING experience INTO v_new_exp;
    
    v_new_level := calculate_level(v_new_exp);
    
    UPDATE users
    SET level = v_new_level
    WHERE id = p_user_id;
END;
$$;

-- Función para crear transacción de match
CREATE OR REPLACE FUNCTION create_match_transaction(
    p_user_id UUID,
    p_match_id UUID,
    p_amount INTEGER,
    p_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_tx_id UUID;
BEGIN
    INSERT INTO transactions (user_id, type, amount, description, metadata)
    VALUES (
        p_user_id,
        p_type,
        p_amount,
        CASE 
            WHEN p_type = 'bet_win' THEN 'Ganancia de match'
            WHEN p_type = 'bet_loss' THEN 'Pérdida de match'
            ELSE 'Transacción de match'
        END,
        json_build_object('match_id', p_match_id)
    )
    RETURNING id INTO v_tx_id;
    
    RETURN v_tx_id;
END;
$$;

-- Función para completar un match y distribuir premios
CREATE OR REPLACE FUNCTION complete_match(
    p_match_id UUID,
    p_winner_id UUID,
    p_moderator_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_match RECORD;
    v_loser_id UUID;
    v_prize INTEGER;
BEGIN
    -- Obtener datos del match
    SELECT * INTO v_match
    FROM matches
    WHERE id = p_match_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Match no encontrado';
    END IF;
    
    -- Determinar perdedor
    v_loser_id := CASE 
        WHEN v_match.player1_id = p_winner_id THEN v_match.player2_id
        ELSE v_match.player1_id
    END;
    
    v_prize := v_match.bet_amount;
    
    -- Actualizar match
    UPDATE matches
    SET 
        winner_id = p_winner_id,
        status = 'completed',
        completed_at = NOW(),
        moderator_id = COALESCE(p_moderator_id, moderator_id)
    WHERE id = p_match_id;
    
    -- Actualizar estadísticas del ganador
    PERFORM increment_user_stats(
        p_winner_id,
        v_prize, -- tokens ganados
        1,       -- wins
        0,       -- losses
        1,       -- total_played
        v_prize  -- earnings
    );
    
    PERFORM update_user_streak(p_winner_id, TRUE);
    PERFORM add_experience(p_winner_id, 50); -- 50 XP por ganar
    
    -- Actualizar estadísticas del perdedor
    PERFORM increment_user_stats(
        v_loser_id,
        0,  -- tokens
        0,  -- wins
        1,  -- losses
        1,  -- total_played
        -v_prize  -- earnings (negativo)
    );
    
    PERFORM update_user_streak(v_loser_id, FALSE);
    PERFORM add_experience(v_loser_id, 10); -- 10 XP por participar
    
    -- Crear transacciones
    PERFORM create_match_transaction(p_winner_id, p_match_id, v_prize, 'bet_win');
    PERFORM create_match_transaction(v_loser_id, p_match_id, -v_prize, 'bet_loss');
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION increment_user_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_user_streak TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_user_banned TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_bans TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_global_statistics TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_level TO anon, authenticated;
GRANT EXECUTE ON FUNCTION add_experience TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_match_transaction TO anon, authenticated;
GRANT EXECUTE ON FUNCTION complete_match TO anon, authenticated;

-- Verificar que las funciones se crearon correctamente
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'increment_user_stats',
    'update_user_streak',
    'get_leaderboard',
    'is_user_banned',
    'cleanup_expired_bans',
    'get_global_statistics',
    'calculate_level',
    'add_experience',
    'create_match_transaction',
    'complete_match'
);

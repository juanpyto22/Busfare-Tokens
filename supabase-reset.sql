-- Script para RESETEAR la base de datos
-- ADVERTENCIA: Esto ELIMINARÁ TODAS las tablas y datos
-- Solo usar si quieres empezar desde cero

-- Desactivar RLS temporalmente para poder eliminar
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports DISABLE ROW LEVEL SECURITY;

-- Eliminar funciones RPC si existen
DROP FUNCTION IF EXISTS increment_user_stats CASCADE;
DROP FUNCTION IF EXISTS update_user_streak CASCADE;
DROP FUNCTION IF EXISTS get_leaderboard CASCADE;
DROP FUNCTION IF EXISTS is_user_banned CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_bans CASCADE;
DROP FUNCTION IF EXISTS get_global_statistics CASCADE;
DROP FUNCTION IF EXISTS calculate_level CASCADE;
DROP FUNCTION IF EXISTS add_experience CASCADE;
DROP FUNCTION IF EXISTS create_match_transaction CASCADE;
DROP FUNCTION IF EXISTS complete_match CASCADE;
DROP FUNCTION IF EXISTS update_last_login CASCADE;

-- Eliminar tablas en orden (por dependencias)
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Base de datos limpiada correctamente';
    RAISE NOTICE '📋 Ahora ejecuta: supabase-schema.sql';
END $$;

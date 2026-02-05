-- VERIFICACION: Script para probar que el registro funciona
-- Ejecutar después de fix-rls-policies.sql

-- 1. Verificar estructura de tabla users
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('users', 'matches', 'withdrawals')
ORDER BY tablename, policyname;

-- 3. Verificar triggers
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' OR trigger_name = 'on_auth_user_created';

-- 4. Verificar función handle_new_user
SELECT routine_name, security_type, routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- 5. Probar inserción manual (para debug)
-- UNCOMMENT para probar:
/*
-- Insertar usuario de prueba
INSERT INTO auth.users (
  id, 
  email, 
  raw_user_meta_data, 
  created_at, 
  updated_at,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  '{"username": "testuser"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
);
*/

-- 6. Verificar usuarios existentes
SELECT user_id, email, username, role, tokens, created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Status final
SELECT 
  'Database ready for user registration!' as message,
  COUNT(*) as total_users
FROM users;
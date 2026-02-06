-- =============================================
-- VERIFICACIÓN RÁPIDA DE LA BASE DE DATOS
-- Copia este script y ejecútalo en Supabase
-- =============================================

-- 1. Ver si existe la tabla users
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'users'
) as tabla_users_existe;

-- 2. Ver estructura de la tabla users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Ver usuarios en auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 4. Ver usuarios en public.users
SELECT id, email, username, role, tokens 
FROM public.users 
ORDER BY created_at DESC;

-- 5. Ver políticas RLS en users
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';

-- 6. Verificar que RLS esté habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

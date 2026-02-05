-- =============================================
-- SCRIPT COMPLETO PARA ARREGLAR TODOS LOS ERRORES
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- PASO 1: ELIMINAR USUARIOS EXISTENTES
-- =============================================
DELETE FROM public.users WHERE email = 'admin@busfare.com';
DELETE FROM public.users WHERE email LIKE 'arbitro%@busfare.com';
DELETE FROM auth.users WHERE email = 'admin@busfare.com';
DELETE FROM auth.users WHERE email LIKE 'arbitro%@busfare.com';

-- =============================================
-- PASO 2: CREAR FUNCIONES RPC FALTANTES
-- =============================================

-- Función para actualizar usuarios online
CREATE OR REPLACE FUNCTION update_online_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Actualizar last_seen del usuario actual
  UPDATE public.users
  SET last_seen = now()
  WHERE id = auth.uid();
END;
$$;

-- Función para obtener usuarios online
CREATE OR REPLACE FUNCTION get_online_users()
RETURNS TABLE (
  id UUID,
  username TEXT,
  avatar TEXT,
  last_seen TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.avatar, u.last_seen
  FROM public.users u
  WHERE u.last_seen > now() - interval '5 minutes'
  ORDER BY u.last_seen DESC;
END;
$$;

-- Función para obtener estadísticas globales
CREATE OR REPLACE FUNCTION get_global_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM public.users),
    'onlineUsers', (SELECT COUNT(*) FROM public.users WHERE last_seen > now() - interval '5 minutes'),
    'totalMatches', (SELECT COUNT(*) FROM matches),
    'activeMatches', (SELECT COUNT(*) FROM matches WHERE status = 'active'),
    'totalTransactions', (SELECT COUNT(*) FROM transactions),
    'totalTokensCirculating', (SELECT COALESCE(SUM(tokens), 0) FROM public.users)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- =============================================
-- PASO 3: ASEGURAR QUE LAST_SEEN EXISTE
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_seen'
  ) THEN
    ALTER TABLE public.users ADD COLUMN last_seen TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- =============================================
-- PASO 4: ACTUALIZAR POLÍTICAS RLS
-- =============================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert their profile" ON public.users;

-- Crear políticas correctas
CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "System can insert profiles"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- =============================================
-- PASO 5: CREAR ADMIN Y ÁRBITROS
-- =============================================

-- Crear 1 ADMIN
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Crear usuario admin en auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        confirmation_token,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@busfare.com',
        crypt('Admin123!', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"username":"admin"}'::jsonb,
        false,
        '',
        '',
        ''
    ) RETURNING id INTO admin_id;

    -- Esperar a que el trigger cree el perfil
    PERFORM pg_sleep(1);

    -- Actualizar perfil del admin
    UPDATE public.users 
    SET role = 'admin', 
        tokens = 99999, 
        level = 99, 
        reputation = 100, 
        trust_score = 100, 
        email_verified = true,
        username = 'admin'
    WHERE id = admin_id;

    RAISE NOTICE 'Admin creado: admin@busfare.com / Admin123!';
END $$;

-- Crear 10 ÁRBITROS
DO $$
DECLARE
    arbitro_id UUID;
    i INTEGER;
BEGIN
    FOR i IN 1..10 LOOP
        -- Crear usuario árbitro en auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'arbitro' || i || '@busfare.com',
            crypt('Arbitro123!', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            ('{"username":"arbitro' || i || '"}')::jsonb,
            false,
            '',
            '',
            ''
        ) RETURNING id INTO arbitro_id;

        -- Esperar a que el trigger cree el perfil
        PERFORM pg_sleep(1);

        -- Actualizar perfil del árbitro
        UPDATE public.users 
        SET role = 'moderator', 
            tokens = 5000, 
            level = 50, 
            reputation = 100, 
            trust_score = 100, 
            email_verified = true,
            username = 'arbitro' || i
        WHERE id = arbitro_id;

        RAISE NOTICE 'Árbitro % creado: arbitro%@busfare.com / Arbitro123!', i, i;
    END LOOP;
END $$;

-- =============================================
-- PASO 6: VERIFICAR TODO
-- =============================================

-- Ver usuarios creados
SELECT email, username, role, tokens, email_verified 
FROM public.users 
WHERE role IN ('admin', 'moderator') 
ORDER BY role DESC, username;

-- Ver funciones creadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_online_users', 'get_online_users', 'get_global_stats');

-- =============================================
-- CREDENCIALES:
-- =============================================
-- Admin: admin@busfare.com / Admin123!
-- Árbitros: arbitro1-10@busfare.com / Arbitro123!
-- =============================================

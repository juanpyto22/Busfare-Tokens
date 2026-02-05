-- =============================================
-- SOLUCIÓN DEFINITIVA - EJECUTAR EN SUPABASE SQL EDITOR
-- Este script arregla TODOS los problemas
-- =============================================

-- ============================================= 
-- PASO 1: DESHABILITAR RLS TEMPORALMENTE
-- =============================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ============================================= 
-- PASO 2: AGREGAR COLUMNAS FALTANTES
-- =============================================
DO $$
BEGIN
  -- Columna last_seen para usuarios online
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_seen'
  ) THEN
    ALTER TABLE public.users ADD COLUMN last_seen TIMESTAMPTZ DEFAULT now();
    RAISE NOTICE 'Columna last_seen agregada';
  END IF;
  
  -- Columna last_login
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE public.users ADD COLUMN last_login TIMESTAMPTZ;
    RAISE NOTICE 'Columna last_login agregada';
  END IF;
  
  -- Columna avatar si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE public.users ADD COLUMN avatar TEXT;
    RAISE NOTICE 'Columna avatar agregada';
  END IF;
END $$;

-- ============================================= 
-- PASO 3: ELIMINAR USUARIOS EXISTENTES
-- =============================================
DELETE FROM public.users WHERE email IN ('admin@busfare.com') OR email LIKE 'arbitro%@busfare.com';
DELETE FROM auth.users WHERE email IN ('admin@busfare.com') OR email LIKE 'arbitro%@busfare.com';
RAISE NOTICE 'Usuarios admin/árbitros eliminados';

-- ============================================= 
-- PASO 4: CREAR FUNCIONES RPC
-- =============================================

-- Función: Actualizar estado online del usuario actual
CREATE OR REPLACE FUNCTION update_online_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users 
  SET last_seen = now() 
  WHERE id = auth.uid();
END;
$$;

-- Función: Obtener lista de usuarios online (últimos 5 minutos)
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

-- Función: Obtener estadísticas globales
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
    'totalMatches', COALESCE((SELECT COUNT(*) FROM matches), 0),
    'activeMatches', COALESCE((SELECT COUNT(*) FROM matches WHERE status = 'active'), 0),
    'totalTransactions', COALESCE((SELECT COUNT(*) FROM transactions), 0),
    'totalTokensCirculating', COALESCE((SELECT SUM(tokens) FROM public.users), 0)
  ) INTO result;
  
  RETURN result;
END;
$$;

RAISE NOTICE 'Funciones RPC creadas correctamente';

-- ============================================= 
-- PASO 5: CREAR USUARIO ADMIN
-- =============================================
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
BEGIN
    -- Insertar en auth.users
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
        admin_uuid,
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
    );

    -- Esperar a que el trigger actúe (si existe)
    PERFORM pg_sleep(1);

    -- Verificar si el trigger creó el perfil
    IF EXISTS (SELECT 1 FROM public.users WHERE id = admin_uuid) THEN
        -- El trigger funcionó, solo actualizar
        UPDATE public.users 
        SET username = 'admin',
            role = 'admin',
            tokens = 99999,
            level = 99,
            reputation = 100,
            trust_score = 100,
            email_verified = true,
            last_seen = now()
        WHERE id = admin_uuid;
    ELSE
        -- El trigger no funcionó, crear manualmente
        INSERT INTO public.users (
            id, email, username, role, tokens,
            level, reputation, trust_score, email_verified,
            created_at, updated_at, last_seen
        ) VALUES (
            admin_uuid, 'admin@busfare.com', 'admin', 'admin', 99999,
            99, 100, 100, true,
            now(), now(), now()
        );
    END IF;

    RAISE NOTICE '✅ Admin creado: admin@busfare.com / Admin123!';
END $$;

-- ============================================= 
-- PASO 6: CREAR 10 ÁRBITROS
-- =============================================
DO $$
DECLARE
    arbitro_uuid UUID;
    i INTEGER;
    arbitro_email TEXT;
    arbitro_username TEXT;
BEGIN
    FOR i IN 1..10 LOOP
        arbitro_uuid := gen_random_uuid();
        arbitro_email := 'arbitro' || i || '@busfare.com';
        arbitro_username := 'arbitro' || i;
        
        -- Insertar en auth.users
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
            arbitro_uuid,
            'authenticated',
            'authenticated',
            arbitro_email,
            crypt('Arbitro123!', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            ('{"username":"' || arbitro_username || '"}')::jsonb,
            false,
            '',
            '',
            ''
        );

        -- Esperar medio segundo
        PERFORM pg_sleep(0.5);

        -- Verificar si el trigger creó el perfil
        IF EXISTS (SELECT 1 FROM public.users WHERE id = arbitro_uuid) THEN
            -- Actualizar perfil existente
            UPDATE public.users 
            SET username = arbitro_username,
                role = 'moderator',
                tokens = 5000,
                level = 50,
                reputation = 100,
                trust_score = 100,
                email_verified = true,
                last_seen = now()
            WHERE id = arbitro_uuid;
        ELSE
            -- Crear perfil manualmente
            INSERT INTO public.users (
                id, email, username, role, tokens,
                level, reputation, trust_score, email_verified,
                created_at, updated_at, last_seen
            ) VALUES (
                arbitro_uuid, arbitro_email, arbitro_username, 'moderator', 5000,
                50, 100, 100, true,
                now(), now(), now()
            );
        END IF;
        
        RAISE NOTICE '✅ Árbitro % creado: % / Arbitro123!', i, arbitro_email;
    END LOOP;
END $$;

-- ============================================= 
-- PASO 7: REACTIVAR RLS CON POLÍTICAS CORRECTAS
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas antiguas
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.users';
    END LOOP;
END $$;

-- Crear políticas nuevas y simples
CREATE POLICY "allow_read_all_users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert_own_user"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_update_own_user"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_delete_by_admin"
  ON public.users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

RAISE NOTICE 'Políticas RLS configuradas correctamente';

-- ============================================= 
-- PASO 8: VERIFICAR TODO ESTÁ OK
-- =============================================

-- Mostrar usuarios creados
SELECT 
    '=== USUARIOS CREADOS ===' as status,
    email, 
    username, 
    role, 
    tokens,
    email_verified
FROM public.users 
WHERE role IN ('admin', 'moderator') 
ORDER BY role DESC, username;

-- Mostrar funciones RPC
SELECT 
    '=== FUNCIONES RPC ===' as status,
    routine_name as funcion
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_online_users', 'get_online_users', 'get_global_stats');

-- =============================================
-- ✅ RESULTADO ESPERADO:
-- =============================================
-- 1 admin:     admin@busfare.com / Admin123!
-- 10 árbitros: arbitro1-10@busfare.com / Arbitro123!
-- 3 funciones: update_online_users, get_online_users, get_global_stats
-- =============================================

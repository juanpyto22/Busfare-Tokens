-- =============================================
-- SOLUCIÓN FINAL - SCRIPT QUE ARREGLA TODO
-- =============================================

-- PASO 1: DESHABILITAR RLS TEMPORALMENTE
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- PASO 2: AGREGAR COLUMNAS FALTANTES SI NO EXISTEN
DO $$
BEGIN
  -- Agregar last_seen si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_seen') THEN
    ALTER TABLE public.users ADD COLUMN last_seen TIMESTAMPTZ DEFAULT now();
  END IF;
  
  -- Agregar last_login si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login') THEN
    ALTER TABLE public.users ADD COLUMN last_login TIMESTAMPTZ;
  END IF;
END $$;

-- PASO 3: ELIMINAR USUARIOS ADMIN/ÁRBITROS EXISTENTES
DELETE FROM public.users WHERE email = 'admin@busfare.com' OR email LIKE 'arbitro%@busfare.com';
DELETE FROM auth.users WHERE email = 'admin@busfare.com' OR email LIKE 'arbitro%@busfare.com';

-- PASO 4: CREAR FUNCIONES RPC
CREATE OR REPLACE FUNCTION update_online_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users SET last_seen = now() WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION get_online_users()
RETURNS TABLE (id UUID, username TEXT, avatar TEXT, last_seen TIMESTAMPTZ)
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

-- PASO 5: CREAR ADMIN
DO $$
DECLARE
    new_id UUID := gen_random_uuid();
BEGIN
    -- Insertar en auth.users
    INSERT INTO auth.users (
        instance_id, id, aud, role, email,
        encrypted_password, email_confirmed_at,
        created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin, confirmation_token,
        email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_id, 'authenticated', 'authenticated',
        'admin@busfare.com',
        crypt('Admin123!', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"username":"admin"}'::jsonb,
        false, '', '', ''
    );

    -- Esperar 1 segundo para el trigger
    PERFORM pg_sleep(1);

    -- Verificar si el trigger creó el usuario
    IF EXISTS (SELECT 1 FROM public.users WHERE id = new_id) THEN
        -- Actualizar el usuario existente
        UPDATE public.users 
        SET username = 'admin',
            role = 'admin',
            tokens = 99999,
            level = 99,
            reputation = 100,
            trust_score = 100,
            email_verified = true
        WHERE id = new_id;
    ELSE
        -- Crear manualmente si el trigger no funcionó
        INSERT INTO public.users (
            id, email, username, role, tokens,
            level, reputation, trust_score, email_verified,
            created_at, updated_at
        ) VALUES (
            new_id, 'admin@busfare.com', 'admin', 'admin', 99999,
            99, 100, 100, true,
            now(), now()
        );
    END IF;

    RAISE NOTICE 'Admin creado: admin@busfare.com';
END $$;

-- PASO 6: CREAR 10 ÁRBITROS
DO $$
DECLARE
    new_id UUID;
    i INTEGER;
BEGIN
    FOR i IN 1..10 LOOP
        new_id := gen_random_uuid();
        
        -- Insertar en auth.users
        INSERT INTO auth.users (
            instance_id, id, aud, role, email,
            encrypted_password, email_confirmed_at,
            created_at, updated_at,
            raw_app_meta_data, raw_user_meta_data,
            is_super_admin, confirmation_token,
            email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_id, 'authenticated', 'authenticated',
            'arbitro' || i || '@busfare.com',
            crypt('Arbitro123!', gen_salt('bf')),
            now(), now(), now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            ('{"username":"arbitro' || i || '"}')::jsonb,
            false, '', '', ''
        );

        PERFORM pg_sleep(0.5);

        -- Verificar si el trigger creó el usuario
        IF EXISTS (SELECT 1 FROM public.users WHERE id = new_id) THEN
            UPDATE public.users 
            SET username = 'arbitro' || i,
                role = 'moderator',
                tokens = 5000,
                level = 50,
                reputation = 100,
                trust_score = 100,
                email_verified = true
            WHERE id = new_id;
        ELSE
            INSERT INTO public.users (
                id, email, username, role, tokens,
                level, reputation, trust_score, email_verified,
                created_at, updated_at
            ) VALUES (
                new_id, 'arbitro' || i || '@busfare.com', 'arbitro' || i,
                'moderator', 5000, 50, 100, 100, true,
                now(), now()
            );
        END IF;
        
        RAISE NOTICE 'Árbitro % creado', i;
    END LOOP;
END $$;

-- PASO 7: REACTIVAR RLS CON POLÍTICAS CORRECTAS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert their profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "System can insert profiles" ON public.users;

-- Crear políticas nuevas
CREATE POLICY "Enable read for all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for users based on id"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- PASO 8: VERIFICAR TODO
SELECT 
    email, 
    username, 
    role, 
    tokens,
    email_verified,
    created_at
FROM public.users 
WHERE role IN ('admin', 'moderator') 
ORDER BY role DESC, username;

-- Ver funciones
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_online_users', 'get_online_users', 'get_global_stats');

-- =============================================
-- RESULTADO ESPERADO:
-- - 1 admin: admin@busfare.com / Admin123!
-- - 10 árbitros: arbitro1-10@busfare.com / Arbitro123!
-- - 3 funciones RPC creadas
-- =============================================

-- CREAR ADMIN Y ÁRBITROS - CON LIMPIEZA PREVIA
-- Ejecutar en Supabase SQL Editor

-- =============================================
-- PASO 1: ELIMINAR USUARIOS EXISTENTES
-- =============================================

-- Eliminar perfiles de public.users
DELETE FROM public.users WHERE email = 'admin@busfare.com';
DELETE FROM public.users WHERE email LIKE 'arbitro%@busfare.com';

-- Eliminar de auth.users
DELETE FROM auth.users WHERE email = 'admin@busfare.com';
DELETE FROM auth.users WHERE email LIKE 'arbitro%@busfare.com';

-- =============================================
-- PASO 2: CREAR 1 ADMIN
-- =============================================

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
        '{"provider":"email","providers":["email"]}',
        '{"username":"admin"}',
        false,
        '',
        '',
        ''
    ) RETURNING id INTO admin_id;

    -- Esperar a que el trigger cree el perfil
    PERFORM pg_sleep(0.5);

    -- Actualizar perfil del admin en users (el trigger ya lo creó)
    UPDATE public.users 
    SET role = 'admin', 
        tokens = 99999, 
        level = 99, 
        reputation = 100, 
        trust_score = 100, 
        email_verified = true
    WHERE id = admin_id;

    RAISE NOTICE 'Admin creado: admin@busfare.com / Admin123!';
END $$;

-- =============================================
-- PASO 3: CREAR 10 ÁRBITROS
-- =============================================

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
            '{"provider":"email","providers":["email"]}',
            '{"username":"arbitro' || i || '"}',
            false,
            '',
            '',
            ''
        ) RETURNING id INTO arbitro_id;

        -- Esperar a que el trigger cree el perfil
        PERFORM pg_sleep(0.5);

        -- Actualizar perfil del árbitro en users (el trigger ya lo creó)
        UPDATE public.users 
        SET role = 'moderator', 
            tokens = 5000, 
            level = 50, 
            reputation = 100, 
            trust_score = 100, 
            email_verified = true
        WHERE id = arbitro_id;

        RAISE NOTICE 'Árbitro % creado: arbitro%@busfare.com / Arbitro123!', i, i;
    END LOOP;
END $$;

-- =============================================
-- PASO 4: VERIFICAR USUARIOS CREADOS
-- =============================================

SELECT email, username, role, tokens FROM public.users WHERE role IN ('admin', 'moderator') ORDER BY role DESC, username;

-- =============================================
-- CREDENCIALES CREADAS:
-- =============================================
-- Admin:
--   Email: admin@busfare.com
--   Contraseña: Admin123!
--
-- Árbitros (10):
--   Email: arbitro1@busfare.com hasta arbitro10@busfare.com
--   Contraseña: Arbitro123! (todas usan la misma)
-- =============================================

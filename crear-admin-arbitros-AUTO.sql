-- CREAR ADMIN Y ÁRBITROS - SCRIPT SIMPLIFICADO
-- Ejecutar en Supabase SQL Editor

-- =============================================
-- IMPORTANTE: Este script crea usuarios directamente
-- NO necesitas crear usuarios manualmente en Authentication
-- =============================================

-- 1. CREAR 1 ADMIN
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

    -- Crear perfil del admin en users
    INSERT INTO public.users (id, email, username, role, tokens, level, reputation, trust_score, email_verified)
    VALUES (admin_id, 'admin@busfare.com', 'admin', 'admin', 99999, 99, 100, 100, true);

    RAISE NOTICE 'Admin creado: admin@busfare.com / Admin123!';
END $$;

-- 2. CREAR 10 ÁRBITROS
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

        -- Crear perfil del árbitro en users
        INSERT INTO public.users (id, email, username, role, tokens, level, reputation, trust_score, email_verified)
        VALUES (arbitro_id, 'arbitro' || i || '@busfare.com', 'arbitro' || i, 'moderator', 5000, 50, 100, 100, true);

        RAISE NOTICE 'Árbitro % creado: arbitro%@busfare.com / Arbitro123!', i, i;
    END LOOP;
END $$;

-- 3. VERIFICAR USUARIOS CREADOS
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
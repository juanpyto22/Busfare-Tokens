-- Script para insertar 1 Admin + 10 Árbitros
-- Ejecuta esto DESPUÉS de ejecutar supabase-schema.sql

-- IMPORTANTE: Primero debes crear estos usuarios en Supabase Authentication
-- Ve a: Dashboard → Authentication → Users → Add User
-- Crea cada usuario con su email y contraseña
-- Luego copia el UUID que Supabase genera y actualiza este script

-- Eliminar usuarios de ejemplo si existen
DELETE FROM users WHERE email IN ('admin@busfare.com', 'arbitro@busfare.com');

-- ========================================
-- 1 USUARIO ADMIN
-- ========================================
-- Email: admin@busfare.com
-- Contraseña: AdminBusfare2026!
INSERT INTO users (
    id,
    email, 
    username, 
    role, 
    tokens, 
    snipes, 
    level, 
    experience, 
    email_verified,
    reputation,
    trust_score
) VALUES (
    '00000000-0000-0000-0000-000000000001', -- Reemplazar con UUID real de Supabase Auth
    'admin@busfare.com',
    'admin',
    'admin',
    99999,
    999,
    99,
    99000,
    true,
    100,
    100
);

-- ========================================
-- 10 USUARIOS ÁRBITRO (MODERADORES)
-- ========================================

-- Árbitro 1
-- Email: arbitro1@busfare.com
-- Contraseña: Arbitro2026!
INSERT INTO users (
    id,
    email, 
    username, 
    role, 
    tokens, 
    snipes, 
    level, 
    experience, 
    email_verified,
    reputation,
    trust_score
) VALUES (
    '00000000-0000-0000-0000-000000000011', -- Reemplazar con UUID real
    'arbitro1@busfare.com',
    'arbitro1',
    'moderator',
    5000,
    100,
    50,
    50000,
    true,
    100,
    100
);

-- Árbitro 2
INSERT INTO users (
    id, email, username, role, tokens, snipes, level, experience, email_verified, reputation, trust_score
) VALUES (
    '00000000-0000-0000-0000-000000000012',
    'arbitro2@busfare.com',
    'arbitro2',
    'moderator',
    5000, 100, 50, 50000, true, 100, 100
);

-- Árbitro 3
INSERT INTO users (
    id, email, username, role, tokens, snipes, level, experience, email_verified, reputation, trust_score
) VALUES (
    '00000000-0000-0000-0000-000000000013',
    'arbitro3@busfare.com',
    'arbitro3',
    'moderator',
    5000, 100, 50, 50000, true, 100, 100
);

-- Árbitro 4
INSERT INTO users (
    id, email, username, role, tokens, snipes, level, experience, email_verified, reputation, trust_score
) VALUES (
    '00000000-0000-0000-0000-000000000014',
    'arbitro4@busfare.com',
    'arbitro4',
    'moderator',
    5000, 100, 50, 50000, true, 100, 100
);

-- Árbitro 5
INSERT INTO users (
    id, email, username, role, tokens, snipes, level, experience, email_verified, reputation, trust_score
) VALUES (
    '00000000-0000-0000-0000-000000000015',
    'arbitro5@busfare.com',
    'arbitro5',
    'moderator',
    5000, 100, 50, 50000, true, 100, 100
);

-- Árbitro 6
INSERT INTO users (
    id, email, username, role, tokens, snipes, level, experience, email_verified, reputation, trust_score
) VALUES (
    '00000000-0000-0000-0000-000000000016',
    'arbitro6@busfare.com',
    'arbitro6',
    'moderator',
    5000, 100, 50, 50000, true, 100, 100
);

-- Árbitro 7
INSERT INTO users (
    id, email, username, role, tokens, snipes, level, experience, email_verified, reputation, trust_score
) VALUES (
    '00000000-0000-0000-0000-000000000017',
    'arbitro7@busfare.com',
    'arbitro7',
    'moderator',
    5000, 100, 50, 50000, true, 100, 100
);

-- Árbitro 8
INSERT INTO users (
    id, email, username, role, tokens, snipes, level, experience, email_verified, reputation, trust_score
) VALUES (
    '00000000-0000-0000-0000-000000000018',
    'arbitro8@busfare.com',
    'arbitro8',
    'moderator',
    5000, 100, 50, 50000, true, 100, 100
);

-- Árbitro 9
INSERT INTO users (
    id, email, username, role, tokens, snipes, level, experience, email_verified, reputation, trust_score
) VALUES (
    '00000000-0000-0000-0000-000000000019',
    'arbitro9@busfare.com',
    'arbitro9',
    'moderator',
    5000, 100, 50, 50000, true, 100, 100
);

-- Árbitro 10
INSERT INTO users (
    id, email, username, role, tokens, snipes, level, experience, email_verified, reputation, trust_score
) VALUES (
    '00000000-0000-0000-0000-000000000020',
    'arbitro10@busfare.com',
    'arbitro10',
    'moderator',
    5000, 100, 50, 50000, true, 100, 100
);

-- Verificar usuarios creados
SELECT id, email, username, role, tokens 
FROM users 
ORDER BY role DESC, username;

-- =============================================
-- CREAR ADMIN Y ARBITRO EN SUPABASE
-- =============================================
-- IMPORTANTE: Ejecuta esto en SQL Editor de Supabase
-- =============================================

-- 1. CREAR ADMIN
-- Primero, crear en auth.users (si no existe)
-- Esto debe hacerse manualmente desde Supabase Auth o usando la CLI
-- Pero aquí creamos el registro en public.users

-- Opción A: Si el admin@busfare.com YA existe en auth.users
INSERT INTO public.users (
  id, 
  email, 
  username, 
  role, 
  tokens, 
  level, 
  wins, 
  losses, 
  total_played,
  earnings,
  total_earned,
  reputation, 
  trust_score, 
  current_streak,
  best_streak,
  email_verified,
  avatar,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  'admin_user',
  'admin',
  99999,
  99,
  1000,
  10,
  1010,
  99999,
  99999,
  100,
  100,
  0,
  100,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'admin@busfare.com'
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE id = auth.users.id
);

-- Si no existe en auth.users, actualizar si existe
UPDATE public.users 
SET 
  role = 'admin',
  tokens = 99999,
  level = 99,
  wins = 1000,
  losses = 10,
  reputation = 100,
  trust_score = 100,
  best_streak = 100,
  email_verified = true
WHERE email = 'admin@busfare.com';

-- 2. CREAR ARBITRO
INSERT INTO public.users (
  id, 
  email, 
  username, 
  role, 
  tokens, 
  level, 
  wins, 
  losses, 
  total_played,
  earnings,
  total_earned,
  reputation, 
  trust_score, 
  current_streak,
  best_streak,
  email_verified,
  avatar,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  'arbitro_user',
  'moderator',
  50000,
  50,
  500,
  20,
  520,
  50000,
  50000,
  100,
  100,
  0,
  50,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=arbitro',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'arbitro@busfare.com'
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE id = auth.users.id
);

UPDATE public.users 
SET 
  role = 'moderator',
  tokens = 50000,
  level = 50,
  wins = 500,
  losses = 20,
  reputation = 100,
  trust_score = 100,
  best_streak = 50,
  email_verified = true
WHERE email = 'arbitro@busfare.com';

-- 3. VERIFICAR LOS USUARIOS CREADOS
SELECT 'USUARIOS ACTUALES' as info;
SELECT 
  id, 
  email, 
  username, 
  role, 
  tokens,
  level,
  reputation,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

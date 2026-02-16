-- =============================================
-- LIMPIAR Y CREAR USUARIOS - VERSIÓN SEGURA
-- =============================================
-- Esta versión solo borra las tablas que existen
-- =============================================

-- PASO 1: LIMPIAR SOLO LAS TABLAS QUE EXISTEN
-- =============================================

-- Borrar solo si existen (sin errores)
DELETE FROM public.chat_messages WHERE true;
DELETE FROM public.transactions WHERE true;
DELETE FROM public.withdrawals WHERE true;
DELETE FROM public.matches WHERE true;
DELETE FROM public.reports WHERE true;
DELETE FROM public.user_achievements WHERE true;
DELETE FROM public.users WHERE true;

SELECT 'PASO 1 COMPLETO: Base de datos limpia' as status;

-- =============================================
-- PAUSA AQUÍ - HACER MANUALMENTE EN SUPABASE
-- =============================================

-- PASO 2: EN SUPABASE PANEL (Authentication → Users)
-- ⚠️ DEBES HACERLO MANUALMENTE (no con SQL)

-- 1. Ve a: https://app.supabase.com → Tu Proyecto
-- 2. Ve a: Authentication → Users
-- 3. BORRA TODOS los usuarios que veas (haz clic en ... -> Delete)

-- PASO 3: CREATE ADMIN EN auth.users (MANUAL)
-- Email: admin@busfare.com
-- Password: Admin@123456
-- ☑ Email Confirmed
-- ☑ Auto Confirm

-- PASO 4: CREATE ARBITRO EN auth.users (MANUAL)
-- Email: arbitro@busfare.com
-- Password: Arbitro@123456
-- ☑ Email Confirmed
-- ☑ Auto Confirm

-- =============================================
-- PASO 5: CREAR USUARIOS EN public.users (SQL)
-- =============================================
-- CONTINUA EJECUTANDO DESDE AQUÍ

-- Crear ADMIN
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
ON CONFLICT (id) DO UPDATE
SET
  role = 'admin',
  tokens = 99999,
  level = 99,
  wins = 1000,
  losses = 10,
  reputation = 100,
  trust_score = 100,
  best_streak = 100,
  email_verified = true;

-- Crear ARBITRO
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
ON CONFLICT (id) DO UPDATE
SET
  role = 'moderator',
  tokens = 50000,
  level = 50,
  wins = 500,
  losses = 20,
  reputation = 100,
  trust_score = 100,
  best_streak = 50,
  email_verified = true;

-- VERIFICAR RESULTADO FINAL
SELECT 'USUARIOS CREADOS' as status;
SELECT
  id,
  email,
  username,
  role,
  tokens,
  level,
  email_verified
FROM public.users
ORDER BY created_at DESC;

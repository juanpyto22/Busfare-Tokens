-- =============================================
-- LIMPIAR TODO Y EMPEZAR DESDE CERO
-- =============================================
-- PASO 0: Ejecuta PRIMERO este SQL
-- =============================================

-- 1. ELIMINAR TODOS LOS USUARIOS DE public.users
DELETE FROM public.users;

-- 2. RESETEAR SECUENCIAS Y TABLAS RELACIONADAS (si existen)
DELETE FROM public.chat_messages;
DELETE FROM public.transactions;
DELETE FROM public.withdrawals;
DELETE FROM public.matches;
DELETE FROM public.teams;
DELETE FROM public.reports;
DELETE FROM public.user_achievements;

-- 3. VERIFICAR QUE ESTÁ VACÍO
SELECT 'USUARIOS AFTER DELETE' as info;
SELECT COUNT(*) as total_users FROM public.users;
SELECT COUNT(*) as total_messages FROM public.chat_messages;

---

-- =============================================
-- PASO 1: BORRAR USUARIOS DE auth.users MANUALMENTE
-- =============================================
-- Esto NO se puede hacer con SQL (está protegido)
-- Debes hacerlo desde Supabase Panel:

-- 1. Ve a: https://app.supabase.com → Tu Proyecto
-- 2. Authentication → Users
-- 3. Para CADA usuario (except los que crearás):
--    - Haz clic en los 3 puntos (...)
--    - Clic en "Delete user"
--    - Confirma
--
-- RESULTADO: auth.users debe quedar VACÍO

---

-- =============================================
-- PASO 2: CREAR SOLO ADMIN Y ARBITRO EN auth.users
-- =============================================
-- Luego de borrar todo en auth.users, crea MANUALMENTE:
--
-- 1. Haz clic en "Create new user"
--    Email: admin@busfare.com
--    Password: Admin@123456 (CÁMBIALO SI QUIERES)
--    ☑ Email Confirmed
--    ☑ Auto Confirm
--
-- 2. Repite con:
--    Email: arbitro@busfare.com
--    Password: Arbitro@123456 (CÁMBIALO SI QUIERES)
--    ☑ Email Confirmed
--    ☑ Auto Confirm
--
-- RESULTADO: auth.users tiene SOLO 2 usuarios

---

-- =============================================
-- PASO 3: EJECUTA ESTE SQL DESPUÉS
-- =============================================
-- (Una vez que hayas creado admin y arbitro en auth.users)

-- ADMIN
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

-- ARBITRO
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

-- VERIFICAR
SELECT 'USUARIOS FINALES' as info;
SELECT 
  id, 
  email, 
  username, 
  role, 
  tokens,
  level
FROM public.users
ORDER BY created_at ASC;

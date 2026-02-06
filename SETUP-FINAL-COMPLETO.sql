-- =============================================
-- SOLUCIÓN COMPLETA: LIMPIAR, CREAR Y ARREGLAR
-- =============================================
-- EJECUTA ESTE SQL COMPLETAMENTE EN ORDEN
-- =============================================

-- PASO 1: LIMPIAR TODO (PARTE 1 - SQL)
-- =============================================
DELETE FROM public.chat_messages;
DELETE FROM public.transactions;
DELETE FROM public.withdrawals;
DELETE FROM public.matches;
DELETE FROM public.teams;
DELETE FROM public.reports;
DELETE FROM public.user_achievements;
DELETE FROM public.users;

SELECT 'PASO 1 COMPLETO: Base de datos limpia' as status;

-- PASO 2: LIMPIAR auth.users (PARTE 2 - MANUAL EN SUPABASE)
-- =============================================
-- ⚠️ ESTO LO HACES EN SUPABASE PANEL (no con SQL)
-- ⚠️ IMPORTANTE: Debe ejecutarse ANTES de continuar

-- 1. Ve a: https://app.supabase.com → Tu Proyecto
-- 2. Ve a: Authentication → Users
-- 3. Para CADA usuario que veas:
--    - Haz clic en los 3 puntos (...)
--    - Clic en: "Delete user"
--    - Confirma: "Delete"
-- 
-- RESULTADO: auth.users debe estar COMPLETAMENTE VACÍO

-- PASO 3: CREAR ADMIN EN auth.users (PARTE 3 - MANUAL)
-- =============================================
-- También lo haces en Supabase Panel:

-- 1. Ve a: Authentication → Users
-- 2. Haz clic en: "Create new user"
-- 3. Rellena exactamente así:
--
--    Email address: admin@busfare.com
--    Password:      Admin@123456
--
--    Marca estas casillas:
--    ☑ Email Confirmed (DEBE estar marcada)
--    ☑ Auto Confirm (DEBE estar marcada)
--
-- 4. Haz clic en: "Create user"

-- PASO 4: CREAR ARBITRO EN auth.users (PARTE 4 - MANUAL)
-- =============================================
-- 1. Ve a: Authentication → Users
-- 2. Haz clic en: "Create new user"
-- 3. Rellena exactamente así:
--
--    Email address: arbitro@busfare.com
--    Password:      Arbitro@123456
--
--    Marca estas casillas:
--    ☑ Email Confirmed (DEBE estar marcada)
--    ☑ Auto Confirm (DEBE estar marcada)
--
-- 4. Haz clic en: "Create user"

-- VERIFICAR QUE EXISTAN EN auth.users:
-- Ve a Authentication → Users
-- Deberías ver EXACTAMENTE:
--   1. admin@busfare.com ✓
--   2. arbitro@busfare.com ✓

-- PASO 5: CREAR USUARIOS EN public.users (PARTE 5 - SQL)
-- =============================================
-- AHORA continúa ejecutando este SQL desde aquí hacia abajo

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

SELECT 'PASO 5 COMPLETO: Usuarios admin y arbitro creados' as status;

-- PASO 6: VERIFICAR RESULTADO
-- =============================================
SELECT 'RESULTADO FINAL' as info;
SELECT
  id,
  email,
  username,
  role,
  tokens,
  level,
  email_verified,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- PASO 7: VERIFICAR EN auth.users
-- =============================================
-- Ve a Authentication → Users en Supabase Panel
-- Deberías ver EXACTAMENTE 2 usuarios:
--   1. admin@busfare.com
--   2. arbitro@busfare.com

-- PASO 8: PROBRAR LOGIN Y REGISTRO
-- =============================================
-- 1. Abre tu página en http://localhost:3000
--
-- 2. PRUEBA LOGIN:
--    Email: admin@busfare.com
--    Password: Admin@123456
--    ✓ Debe entrar sin errores
--    ✓ Debe redirigir a home
--    ✓ Navbar debe mostrar "admin_user"
--
-- 3. PRUEBA LOGOUT y LOGIN con:
--    Email: arbitro@busfare.com
--    Password: Arbitro@123456
--    ✓ Debe entrar sin errores
--    ✓ Debe redirigir a home
--    ✓ Navbar debe mostrar "arbitro_user"
--
-- 4. PRUEBA REGISTER:
--    Username: TestUser123
--    Email: test@gmail.com
--    Password: Test@123456
--    ✓ Debe crear usuario automáticamente
--    ✓ Debe entrar sin errores
--    ✓ Debe redirigir a /verify-email
--    ✓ Debe aparecer en public.users con role = "user"

SELECT 'TODO CONFIGURADO ✓' as final_status;

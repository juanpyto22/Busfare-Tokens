-- =============================================
-- LIMPIAR COMPLETAMENTE - VERSIÓN SIMPLE
-- =============================================
-- Limpia public.users (auth.users debe borrarse manualmente desde panel)

-- PASO 1: Limpiar todas las tablas de public
DELETE FROM public.chat_messages WHERE true;
DELETE FROM public.transactions WHERE true;
DELETE FROM public.withdrawals WHERE true;
DELETE FROM public.matches WHERE true;
DELETE FROM public.reports WHERE true;
DELETE FROM public.user_achievements WHERE true;
DELETE FROM public.users WHERE true;

SELECT '✅ Paso 1: public.users completamente limpiado' as status;

-- PASO 2: Verificar
SELECT COUNT(*) as usuarios_en_public FROM public.users;
SELECT COUNT(*) as usuarios_en_auth FROM auth.users;

SELECT '✅ AHORA DEBES:' as instruccion;
SELECT '1. Ve a Supabase → Authentication → Users' as paso;
SELECT '2. Elimina TODOS los usuarios (botón ... → Delete)' as paso;
SELECT '3. Crea admin@busfare.com (Admin@123456) con Email Confirmed' as paso;
SELECT '4. Crea arbitro@busfare.com (Arbitro@123456) con Email Confirmed' as paso;
SELECT '5. Ejecuta SETUP-FINAL-SEGURO.sql para crear en public.users' as paso;

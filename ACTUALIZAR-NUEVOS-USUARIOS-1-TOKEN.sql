-- =============================================
-- ACTUALIZAR NUEVOS USUARIOS A 1 TOKEN
-- =============================================
-- Cambiar todos los usuarios con 100 tokens a 1 token

UPDATE public.users
SET tokens = 1
WHERE tokens = 100
AND created_at > NOW() - INTERVAL '1 day';

SELECT 'Usuarios recién registrados actualizados a 1 token' as status;
SELECT COUNT(*) as count FROM public.users WHERE tokens = 1;

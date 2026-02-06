-- Marcar todos los usuarios con email_verified = true
UPDATE public.users
SET email_verified = true
WHERE email_verified IS NOT TRUE;

SELECT 'Todos los usuarios ahora tienen email verificado' as status;
SELECT COUNT(*) as usuarios_verificados FROM public.users WHERE email_verified = true;

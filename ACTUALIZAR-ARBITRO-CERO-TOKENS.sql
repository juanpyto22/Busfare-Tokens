-- Cambiar arbitro a 0 tokens
UPDATE public.users
SET tokens = 0
WHERE email = 'arbitro@busfare.com';

SELECT 'Arbitro actualizado a 0 tokens' as status;
SELECT email, username, role, tokens FROM public.users WHERE email = 'arbitro@busfare.com';

-- =============================================
-- CREAR ADMIN Y ARBITRO MANUALMENTE
-- =============================================

-- ADMIN
INSERT INTO public.users (id, email, username, role, tokens, level, reputation, trust_score, email_verified)
SELECT 
  id,
  email,
  'admin',
  'admin',
  99999,
  99,
  100,
  100,
  true
FROM auth.users 
WHERE email = 'admin@busfare.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', tokens = 99999, level = 99, reputation = 100, trust_score = 100, email_verified = true;

-- ARBITRO
INSERT INTO public.users (id, email, username, role, tokens, level, reputation, trust_score, email_verified)
SELECT 
  id,
  email,
  'arbitro',
  'moderator',
  50000,
  50,
  100,
  100,
  true
FROM auth.users 
WHERE email = 'arbitro@busfare.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'moderator', tokens = 50000, level = 50, reputation = 100, trust_score = 100, email_verified = true;

-- Verificar
SELECT 'USUARIOS FINALES:' as info;
SELECT id, email, username, role, tokens FROM public.users;

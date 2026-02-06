-- =============================================
-- VERIFICAR ESTADO DE USUARIOS Y TRIGGER
-- =============================================

-- 1. VER TODOS LOS USUARIOS CON SUS TOKENS
SELECT 
  id,
  email,
  username,
  tokens,
  level,
  created_at,
  updated_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. VER SI EXISTEN USUARIOS EN auth.users QUE NO ESTÁN EN public.users
SELECT 
  a.id,
  a.email,
  COALESCE(p.username, 'NO EXISTE EN public.users') as username_status
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE p.id IS NULL;

-- 3. VER ÚLTIMA ACTUACIÓN DEL TRIGGER
SELECT 'VERIFICACIÓN DE USUARIOS COMPLETADA' as status;

-- =============================================
-- SOLUCIÓN FINAL - LIMPIAR Y SINCRONIZAR
-- =============================================

-- PASO 1: Eliminar todos los usuarios EXCEPTO admin y arbitro
DELETE FROM public.users 
WHERE email NOT IN ('admin@busfare.com', 'arbitro@busfare.com');

-- PASO 2: Arreglar el trigger con usernames únicos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, tokens, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substring(NEW.id::text, 1, 8)),
    1,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- PASO 3: Dar permisos a la función
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

-- PASO 4: Configurar admin y moderator
UPDATE public.users 
SET role = 'admin',
    tokens = 99999,
    level = 99,
    reputation = 100,
    trust_score = 100,
    email_verified = true
WHERE email = 'admin@busfare.com';

UPDATE public.users 
SET role = 'moderator',
    tokens = 50000,
    level = 50,
    reputation = 100,
    trust_score = 100,
    email_verified = true
WHERE email = 'arbitro@busfare.com';

-- PASO 5: Verificar
SELECT 'USUARIOS EN public.users:' as info;
SELECT id, email, username, role, tokens FROM public.users ORDER BY created_at DESC;

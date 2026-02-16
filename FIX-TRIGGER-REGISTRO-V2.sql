-- =============================================
-- ARREGLAR TRIGGER - VERSIÓN 2
-- =============================================
-- Este es el trigger definitivo que DEBE funcionar

-- 1. Eliminar trigger y función existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 2. Recrear función CON permisos especiales
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_username TEXT;
BEGIN
  -- Usar username del metadata si existe, si no usar parte del email
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- Debug: log
  RAISE LOG 'handle_new_user called for email: %, username: %', NEW.email, v_username;
  
  -- Insertar en public.users
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
  VALUES (
    NEW.id,
    NEW.email,
    v_username,
    'user',
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    50,
    50,
    0,
    0,
    false,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || v_username,
    NOW(),
    NOW()
  );
  
  RAISE LOG 'User inserted successfully: id=%, tokens=1', NEW.id;
  RETURN NEW;

EXCEPTION WHEN others THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  -- No propagar error, solo log
  RETURN NEW;
END;
$$;

-- 3. Dar permisos a la función
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role, authenticated;

-- 4. Recrear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 5. Verificar que el trigger existe
SELECT 'Trigger recreado correctamente' as status;
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

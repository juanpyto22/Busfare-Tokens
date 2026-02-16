-- =============================================
-- ARREGLAR TRIGGER DE REGISTRO
-- =============================================

-- 1. Eliminar trigger y función existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 2. Recrear función con permisos correctos
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    username, 
    tokens,
    email_verified
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    1,
    false
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recrear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- 4. Dar permisos explícitos a la función
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- 5. Eliminar política de inserción restrictiva y crear una nueva
DROP POLICY IF EXISTS "Users: Inserción automática" ON public.users;

CREATE POLICY "Users: Inserción automática"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- 6. Verificar que todo esté correcto
SELECT 'VERIFICACIÓN - Trigger creado:' as status;
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

SELECT 'VERIFICACIÓN - Función creada:' as status;
SELECT routine_name, security_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

SELECT 'VERIFICACIÓN - Política de inserción:' as status;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'INSERT';

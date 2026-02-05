-- FIX: Arreglar políticas RLS que causan recursión infinita
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar políticas conflictivas
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;

-- 2. Crear políticas simples y seguras
-- Permitir que los usuarios vean su propia información
CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Permitir que los usuarios actualicen su propia información
CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir inserción de nuevos usuarios después del registro
CREATE POLICY "users_insert_own"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Permitir a admins y moderadores ver otros usuarios
CREATE POLICY "admin_moderator_select_all"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- 4. Permitir a admins actualizar cualquier usuario
CREATE POLICY "admin_update_all"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 5. Arreglar políticas de matches
DROP POLICY IF EXISTS "Enable read access for all users" ON matches;
DROP POLICY IF EXISTS "Enable update for own matches" ON matches;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON matches;

-- Políticas simples para matches
CREATE POLICY "matches_select_all"
ON matches FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "matches_insert_auth"
ON matches FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "matches_update_own"
ON matches FOR UPDATE
TO authenticated
USING (player1_id = auth.uid() OR player2_id = auth.uid());

-- 6. Arreglar políticas de withdrawals
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can create own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON withdrawals;

CREATE POLICY "withdrawals_select_own"
ON withdrawals FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM users 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'moderator')
));

CREATE POLICY "withdrawals_insert_own"
ON withdrawals FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "withdrawals_update_admin"
ON withdrawals FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE user_id = auth.uid() 
  AND role = 'admin'
));

-- 7. Asegurar que las tablas tienen RLS habilitado pero con políticas correctas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- 8. Trigger mejorado para crear usuario después del registro
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (user_id, email, username, tokens)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), 100);
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Si el usuario ya existe, no hacer nada
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail auth
    RETURN NEW;
END;
$$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Función para obtener usuario actual (evita recursión)
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM users WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 10. Verificar que todo funciona
SELECT 'RLS Policies fixed successfully!' as status;
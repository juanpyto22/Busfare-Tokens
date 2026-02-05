-- Cambiar tokens iniciales a 1 token solamente
-- Ejecutar en Supabase SQL Editor

-- 1. Actualizar el trigger para dar 1 token en lugar de 100
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, tokens)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), 1);
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

-- 2. Opcional: actualizar usuarios existentes para que tengan 1 token
-- DESCOMENTA LA SIGUIENTE LÍNEA SI QUIERES CAMBIAR USUARIOS EXISTENTES:
-- UPDATE users SET tokens = 1 WHERE role = 'user';

SELECT 'Tokens iniciales cambiados a 1!' as status;
# 🚀 GUÍA PASO A PASO - CONFIGURAR SUPABASE DESDE CERO

## 📌 PASO 1: CREAR TABLA DE USUARIOS

1. Ve a Supabase Dashboard: https://supabase.com/dashboard
2. Click en tu proyecto: **busfare-tokens**
3. Click en **"Table Editor"** (menú lateral izquierdo)
4. Click en **"Create a new table"**
5. Rellena:
   - **Name:** `users`
   - **Description:** Tabla de usuarios
   - Click en **"Save"**

6. **Agregar columnas** (click en "+ New Column" para cada una):

   ```
   Columna: id
   Type: uuid
   Default value: auth.uid()
   Primary: ✓ (checked)
   ```

   ```
   Columna: email
   Type: text
   ```

   ```
   Columna: username
   Type: text
   ```

   ```
   Columna: role
   Type: text
   Default value: 'user'
   ```

   ```
   Columna: tokens
   Type: int8 (integer)
   Default value: 1
   ```

   ```
   Columna: level
   Type: int8
   Default value: 1
   ```

   ```
   Columna: wins
   Type: int8
   Default value: 0
   ```

   ```
   Columna: losses
   Type: int8
   Default value: 0
   ```

   ```
   Columna: total_played
   Type: int8
   Default value: 0
   ```

   ```
   Columna: earnings
   Type: int8
   Default value: 0
   ```

   ```
   Columna: total_earned
   Type: int8
   Default value: 0
   ```

   ```
   Columna: reputation
   Type: int8
   Default value: 50
   ```

   ```
   Columna: trust_score
   Type: int8
   Default value: 50
   ```

   ```
   Columna: email_verified
   Type: bool
   Default value: false
   ```

   ```
   Columna: avatar
   Type: text
   ```

   ```
   Columna: last_seen
   Type: timestamptz
   Default value: now()
   ```

   ```
   Columna: last_login
   Type: timestamptz
   ```

   ```
   Columna: created_at
   Type: timestamptz
   Default value: now()
   ```

   ```
   Columna: updated_at
   Type: timestamptz
   Default value: now()
   ```

   ```
   Columna: banned_until
   Type: timestamptz
   ```

7. Click en **"Save"**

---

## 📌 PASO 2: CREAR TRIGGER AUTOMÁTICO

1. Ve a **SQL Editor** (menú lateral)
2. Click en **"New query"**
3. Pega este código y haz click en **"Run"**:

```sql
-- Función que crea un usuario en public.users cuando alguien se registra
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, tokens)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que ejecuta la función cuando se crea un usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 📌 PASO 3: CONFIGURAR POLÍTICAS RLS

1. Mismo SQL Editor, nueva query
2. Pega y ejecuta:

```sql
-- Habilitar RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer perfiles
CREATE POLICY "Permitir lectura a todos"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Permitir actualización propia"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: Sistema puede insertar perfiles
CREATE POLICY "Permitir inserción"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

---

## 📌 PASO 4: CREAR FUNCIONES RPC

1. Nueva query en SQL Editor
2. Pega y ejecuta:

```sql
-- Función: Actualizar estado online
CREATE OR REPLACE FUNCTION update_online_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users 
  SET last_seen = now() 
  WHERE id = auth.uid();
END;
$$;

-- Función: Obtener usuarios online
CREATE OR REPLACE FUNCTION get_online_users()
RETURNS TABLE (
  id UUID,
  username TEXT,
  avatar TEXT,
  last_seen TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.avatar, u.last_seen
  FROM public.users u
  WHERE u.last_seen > now() - interval '5 minutes'
  ORDER BY u.last_seen DESC;
END;
$$;

-- Función: Estadísticas globales
CREATE OR REPLACE FUNCTION get_global_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM public.users),
    'onlineUsers', (SELECT COUNT(*) FROM public.users WHERE last_seen > now() - interval '5 minutes')
  ) INTO result;
  
  RETURN result;
END;
$$;
```

---

## 📌 PASO 5: CREAR USUARIO ADMIN

1. Ve a **Authentication** → **Users** (menú lateral)
2. Click en **"Add user"** → **"Create new user"**
3. Rellena:
   - **Email:** `admin@busfare.com`
   - **Password:** `Admin123!`
   - **Auto Confirm User:** ✓ (checked)
4. Click en **"Create user"**

5. Ahora actualiza ese usuario a admin:
   - Ve a **Table Editor** → **users**
   - Busca el usuario admin@busfare.com
   - Click en la fila
   - Cambia:
     - **role:** `admin`
     - **tokens:** `99999`
     - **level:** `99`
     - **email_verified:** `true`
   - Click en **"Save"**

---

## 📌 PASO 6: CREAR ÁRBITROS (OPCIONAL)

Repite el paso 5 para crear árbitros:
- **Email:** arbitro1@busfare.com, arbitro2@busfare.com, etc.
- **Password:** Arbitro123!
- Cambiar **role** a `moderator`
- **tokens:** 5000
- **level:** 50

---

## ✅ VERIFICACIÓN

1. Ve a **Table Editor** → **users**
2. Deberías ver tu usuario admin
3. Ve a **SQL Editor** y ejecuta:
   ```sql
   SELECT * FROM public.users WHERE role = 'admin';
   ```
4. Debe aparecer admin@busfare.com

---

## 🎯 PROBAR LOGIN

1. Abre: https://busfaretokens.vercel.app
2. Login con:
   - **Email:** admin@busfare.com
   - **Contraseña:** Admin123!

---

## 📞 SIGUIENTE PASO

Cuando hayas completado todos estos pasos, dime **"listo"** y continuamos con la configuración del código.

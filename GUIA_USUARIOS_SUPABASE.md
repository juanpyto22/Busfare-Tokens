# 🚀 Guía para Configurar Usuarios en Supabase

## 📋 IMPORTANTE: Sigue estos pasos EN ORDEN

### PASO 1: Ejecutar el Schema en Supabase

1. Ve a tu proyecto Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto: `houbfearbinulqnacuhq`
3. Ve a **SQL Editor** (icono de base de datos)
4. Copia y pega TODO el contenido de `supabase-schema.sql`
5. Haz clic en **RUN** para crear las tablas

### PASO 2: Crear Usuarios en Supabase Authentication

Ahora debes crear los usuarios manualmente en Authentication para obtener sus UUIDs:

1. Ve a **Authentication** → **Users**
2. Haz clic en **Add User** → **Create new user**

#### 👨‍💼 Usuario Admin:
- **Email**: `admin@busfare.com`
- **Password**: `AdminBusfare2026!`
- **Email confirm**: ✅ (marca como verificado)
- Haz clic en **Create user**
- **COPIA el UUID (ID) que se genera** - lo necesitarás en el paso 3

#### 👮 Usuarios Árbitros (Repite 10 veces):

**Árbitro 1:**
- **Email**: `arbitro1@busfare.com`
- **Password**: `Arbitro2026!`
- **Email confirm**: ✅
- **COPIA el UUID**

**Árbitro 2:**
- **Email**: `arbitro2@busfare.com`
- **Password**: `Arbitro2026!`
- **Email confirm**: ✅
- **COPIA el UUID**

... (repetir para arbitro3 hasta arbitro10)

### PASO 3: Actualizar el Script SQL con los UUIDs Reales

1. Abre el archivo `insert-admin-users.sql`
2. **Reemplaza los UUIDs ficticios con los UUIDs REALES** que copiaste de Supabase:

```sql
-- Encuentra esta línea:
'00000000-0000-0000-0000-000000000001', -- Admin

-- Reemplázala con el UUID real, ejemplo:
'a1b2c3d4-e5f6-7890-abcd-ef1234567890', -- Admin UUID real de Supabase
```

3. Haz lo mismo para **TODOS los 10 árbitros**

### PASO 4: Ejecutar el Script de Inserción

1. Ve a **SQL Editor** en Supabase
2. Copia y pega el contenido ACTUALIZADO de `insert-admin-users.sql`
3. Haz clic en **RUN**
4. Deberías ver: "11 rows affected" (1 admin + 10 árbitros)

### PASO 5: Verificar que Todo Funciona

1. Recarga tu aplicación frontend (`http://localhost:3000`)
2. Ve a la página de Login
3. Prueba iniciar sesión con:
   - **Email**: `admin@busfare.com`
   - **Password**: `AdminBusfare2026!`

Si todo está correcto, deberías poder iniciar sesión correctamente.

---

## 📝 Lista de Usuarios Creados

### 👨‍💼 Admin (1):
| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@busfare.com | AdminBusfare2026! | admin |

### 👮 Árbitros (10):
| Email | Contraseña | Rol |
|-------|-----------|-----|
| arbitro1@busfare.com | Arbitro2026! | moderator |
| arbitro2@busfare.com | Arbitro2026! | moderator |
| arbitro3@busfare.com | Arbitro2026! | moderator |
| arbitro4@busfare.com | Arbitro2026! | moderator |
| arbitro5@busfare.com | Arbitro2026! | moderator |
| arbitro6@busfare.com | Arbitro2026! | moderator |
| arbitro7@busfare.com | Arbitro2026! | moderator |
| arbitro8@busfare.com | Arbitro2026! | moderator |
| arbitro9@busfare.com | Arbitro2026! | moderator |
| arbitro10@busfare.com | Arbitro2026! | moderator |

---

## 🔄 Cambio de Contraseñas

Para cambiar las contraseñas de admin o árbitros:

1. Ve a **Supabase Dashboard** → **Authentication** → **Users**
2. Busca el usuario por email
3. Haz clic en el usuario
4. Haz clic en **Reset Password** o edita directamente
5. Guarda los cambios

NO necesitas tocar la base de datos para cambiar contraseñas, Supabase lo gestiona automáticamente.

---

## ⚠️ IMPORTANTE: Usuarios Normales

Los **usuarios normales** (role: 'user') NO se crean manualmente.

Se crean automáticamente cuando:
- Un usuario se registra desde la página `/register`
- El sistema crea el usuario en Supabase Auth
- Y automáticamente lo inserta en la tabla `users` con role = 'user'

**NO habrá usuarios normales pre-creados, solo se crean cuando alguien se registre.**

---

## 🔒 Seguridad

- ✅ Las contraseñas se guardan encriptadas en Supabase Auth
- ✅ Los UUIDs son generados automáticamente por Supabase
- ✅ Row Level Security (RLS) está activado
- ✅ Los usuarios solo pueden ver su propia información

---

## 🆘 Problemas Comunes

### "Error: duplicate key value violates unique constraint"
- Ya existe un usuario con ese email
- Ve a Authentication → Users y elimina el usuario duplicado

### "Error: insert or update on table violates foreign key constraint"
- El UUID que pusiste en el SQL no coincide con el de Authentication
- Verifica que copiaste los UUIDs correctos

### "Cannot read properties of null"
- Supabase no está conectado correctamente
- Verifica el archivo `.env` tiene las credenciales correctas

---

## ✅ Verificación Final

Ejecuta esta query en SQL Editor para ver todos los usuarios:

```sql
SELECT id, email, username, role, tokens, email_verified 
FROM users 
ORDER BY 
  CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'moderator' THEN 2 
    WHEN 'user' THEN 3 
  END,
  username;
```

Deberías ver:
- 1 admin
- 10 moderadores
- 0 usuarios normales (hasta que alguien se registre)

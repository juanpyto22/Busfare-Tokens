# 🔄 Solución al Error "relation already exists"

## ❌ Error que tienes:
```
ERROR: 42P07: relation "users" already exists
```

## ✅ Solución:

### Opción 1: RESETEAR TODO (Recomendado si estás empezando)

**Ejecuta estos scripts EN ORDEN en Supabase SQL Editor:**

1. **supabase-reset.sql** (Elimina todo)
   - Esto borrará TODAS las tablas y datos
   - Solo hazlo si no tienes datos importantes

2. **supabase-schema.sql** (Crea las tablas)

3. **supabase-functions.sql** (Crea las funciones RPC)

4. **supabase-update-schema.sql** (Añade campos adicionales)

5. Crea usuarios en Authentication (admin + 10 árbitros)

6. **insert-admin-users.sql** (Inserta los usuarios en la tabla)

---

### Opción 2: Solo actualizar lo que falta (Si ya tienes usuarios)

Si ya tienes la tabla `users` con usuarios creados, ejecuta SOLO:

1. **supabase-functions.sql** (Añade las funciones si no existen)

2. **supabase-update-schema.sql** (Añade campos faltantes sin eliminar datos)

---

## 🚀 Pasos Rápidos (Opción 1 - Reset Completo):

1. Ve a **Supabase Dashboard** → **SQL Editor**

2. Copia y pega el contenido de **supabase-reset.sql**
   ```sql
   -- Esto eliminará todas las tablas
   ```
   Haz clic en **RUN**

3. Copia y pega el contenido de **supabase-schema.sql**
   ```sql
   -- Esto creará todas las tablas nuevas
   ```
   Haz clic en **RUN**

4. Copia y pega el contenido de **supabase-functions.sql**
   ```sql
   -- Esto creará las funciones RPC
   ```
   Haz clic en **RUN**

5. Copia y pega el contenido de **supabase-update-schema.sql**
   ```sql
   -- Esto añadirá campos adicionales
   ```
   Haz clic en **RUN**

6. Ve a **Authentication** → **Users** → Crea:
   - 1 admin: `admin@busfare.com` / `AdminBusfare2026!`
   - 10 árbitros: `arbitro1@busfare.com` hasta `arbitro10@busfare.com` / `Arbitro2026!`
   - **Copia los UUIDs de cada uno**

7. Actualiza **insert-admin-users.sql** con los UUIDs reales

8. Ejecuta **insert-admin-users.sql** en SQL Editor

---

## ⚠️ IMPORTANTE:

- **Opción 1 (Reset)** = Pierdes todos los datos pero empiezas limpio
- **Opción 2 (Update)** = Conservas datos pero puede haber conflictos

---

## ✅ Verificar que funcionó:

Ejecuta en SQL Editor:

```sql
-- Ver tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Ver usuarios
SELECT id, email, username, role 
FROM users
ORDER BY role DESC;
```

Deberías ver:
- 7 tablas
- 11 usuarios (1 admin + 10 moderadores)

---

## 📞 ¿Qué opción elegir?

- **¿Acabas de empezar?** → Opción 1 (Reset)
- **¿Ya tienes usuarios/datos importantes?** → Opción 2 (Update)
- **¿Tienes problemas con datos corruptos?** → Opción 1 (Reset)

---

**Lee esto primero:** [INSTALACION_COMPLETA.md](INSTALACION_COMPLETA.md)

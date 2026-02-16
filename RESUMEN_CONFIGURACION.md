# ✅ RESUMEN: Qué se ha configurado

## 🎯 Lo que se ha hecho:

1. ✅ **Configurado Supabase** en el proyecto (archivo `.env`)
2. ✅ **Restaurado db.js** para usar Supabase en lugar de localStorage
3. ✅ **Creado schema SQL** (`supabase-schema.sql`) con todas las tablas
4. ✅ **Creado script de usuarios** (`insert-admin-users.sql`) para 1 admin + 10 árbitros
5. ✅ **Eliminados usuarios de ejemplo** automáticos
6. ✅ **Creada guía completa** (`GUIA_USUARIOS_SUPABASE.md`)

---

## 📖 QUÉ HACER AHORA (Paso a Paso):

### 1️⃣ Abre la Guía Completa
```
GUIA_USUARIOS_SUPABASE.md
```
Ese archivo tiene TODOS los pasos detallados.

### 2️⃣ Resumen Rápido:

**A. Ir a Supabase Dashboard:**
- https://supabase.com/dashboard
- Selecciona tu proyecto

**B. Crear las tablas (SQL Editor):**
- Copia todo el contenido de `supabase-schema.sql`
- Pégalo en SQL Editor
- Haz clic en RUN

**C. Crear usuarios en Authentication:**
- Ve a Authentication → Users
- Crea 11 usuarios:
  - 1 admin: `admin@busfare.com` / `AdminBusfare2026!`
  - 10 árbitros: `arbitro1@busfare.com` hasta `arbitro10@busfare.com` / `Arbitro2026!`
- **IMPORTANTE**: Copia el UUID (ID) de cada usuario

**D. Actualizar el script SQL:**
- Abre `insert-admin-users.sql`
- Reemplaza los UUIDs falsos con los UUIDs reales que copiaste
- Guarda el archivo

**E. Ejecutar el script (SQL Editor):**
- Copia el contenido actualizado de `insert-admin-users.sql`
- Pégalo en SQL Editor
- Haz clic en RUN

**F. Probar el login:**
- Recarga tu app: http://localhost:3000
- Intenta login con `admin@busfare.com` / `AdminBusfare2026!`

---

## 📋 Usuarios que vas a tener:

### 👨‍💼 Admin (1):
- **Email**: admin@busfare.com
- **Contraseña**: AdminBusfare2026!
- **Rol**: admin
- **Tokens**: 99,999
- **Acceso**: Panel de administración completo

### 👮 Árbitros/Moderadores (10):
- arbitro1@busfare.com - arbitro10@busfare.com
- **Contraseña**: Arbitro2026!
- **Rol**: moderator
- **Tokens**: 5,000 cada uno
- **Acceso**: Panel de moderador

### 👤 Usuarios Normales (0 pre-creados):
- Se crean automáticamente cuando alguien se registra
- **Rol**: user
- **Tokens iniciales**: 0
- Solo pueden jugar, apostar, comprar tokens

---

## 🔐 Gestión de Contraseñas

**TODAS** las contraseñas se gestionan desde Supabase:
- Dashboard → Authentication → Users
- Click en el usuario → Reset Password
- No necesitas tocar la base de datos

---

## ⚠️ Importante:

- ✅ Ya NO hay usuarios creados automáticamente en el código
- ✅ Ya NO se usa localStorage para usuarios (solo Supabase)
- ✅ El registro de usuarios nuevos funciona automáticamente con Supabase
- ✅ Los usuarios normales SOLO se crean cuando se registran desde `/register`

---

## 🎮 Para probar después de configurar:

1. **Login como Admin:**
   - Email: admin@busfare.com
   - Password: AdminBusfare2026!
   - Deberías ver el panel de administración

2. **Login como Árbitro:**
   - Email: arbitro1@busfare.com
   - Password: Arbitro2026!
   - Deberías ver el panel de moderador

3. **Registrar usuario normal:**
   - Ve a /register
   - Crea un usuario nuevo
   - Debería guardarse en Supabase automáticamente

---

## 📁 Archivos Importantes:

| Archivo | Descripción |
|---------|-------------|
| `GUIA_USUARIOS_SUPABASE.md` | Guía completa paso a paso |
| `supabase-schema.sql` | Schema de la base de datos |
| `insert-admin-users.sql` | Script para insertar admin + árbitros |
| `.env` | Credenciales de Supabase |
| `src/lib/db.js` | Código que usa Supabase |
| `src/lib/supabase.js` | Configuración de Supabase |

---

## 🆘 ¿Necesitas ayuda?

Si tienes problemas:
1. Lee la sección "Problemas Comunes" en `GUIA_USUARIOS_SUPABASE.md`
2. Verifica que los UUIDs sean correctos
3. Verifica que las credenciales en `.env` sean correctas
4. Abre la consola del navegador para ver errores

---

## ✅ Checklist Final:

- [ ] Ejecuté `supabase-schema.sql` en Supabase
- [ ] Creé 11 usuarios en Authentication (1 admin + 10 árbitros)
- [ ] Copié los UUIDs de cada usuario
- [ ] Actualicé `insert-admin-users.sql` con los UUIDs reales
- [ ] Ejecuté `insert-admin-users.sql` en Supabase
- [ ] Probé login con admin@busfare.com
- [ ] Funciona correctamente ✨

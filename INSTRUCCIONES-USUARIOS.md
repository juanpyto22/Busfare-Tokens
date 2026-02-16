# 📋 GUÍA: Crear Usuarios Admin y Arbitro

## ⚠️ IMPORTANTE: Pasos requeridos para que funcione correctamente

### Paso 1: Crear usuarios en Supabase Auth
1. Ve a tu proyecto Supabase: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **Authentication → Users**
4. Haz clic en **"Create new user"** y crea estos dos usuarios:

#### Usuario Admin:
- Email: `admin@busfare.com`
- Password: (genera una contraseña segura, ej: `Admin@123456`)
- Marca: ✓ Email Confirmed
- Auto Confirm: ✓

#### Usuario Arbitro:
- Email: `arbitro@busfare.com`
- Password: (genera una contraseña segura, ej: `Arbitro@123456`)
- Marca: ✓ Email Confirmed
- Auto Confirm: ✓

### Paso 2: Configurar los usuarios en la base de datos
1. Ve a **SQL Editor** en Supabase
2. Copia y ejecuta el contenido del archivo: `CREAR-USUARIOS-ADMIN-ARBITRO.sql`
3. Verifica que los usuarios se crearon correctamente (la query al final mostrará los usuarios)

### Paso 3: Verificar que todo funciona
1. Inicia sesión con `admin@busfare.com` en tu aplicación
2. Verifica que puedas acceder a `/admin`
3. Inicia sesión con `arbitro@busfare.com`
4. Verifica que puedas acceder a `/moderator`

## 🔐 Variables de Entorno Requeridas

Asegúrate de que tienes estas variables en tu archivo `.env` (frontend):

```
VITE_SUPABASE_URL=tu_url_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

Y en el backend (si usas):
```
STRIPE_SECRET_KEY=tu_stripe_secret_key
DATABASE_URL=tu_database_url
SUPABASE_URL=tu_url_supabase
SUPABASE_KEY=tu_service_key
```

## ✅ Checklist Final

- [ ] Usuarios creados en Supabase Auth
- [ ] Usuarios configurados en la BD con SQL
- [ ] Roles asignados correctamente (admin, moderator)
- [ ] Variables de entorno configuradas
- [ ] Login/Register funcionando
- [ ] Acceso a panels de admin/moderador
- [ ] Cambios pusheados a GitHub
- [ ] Deployment en Vercel actualizado

## 🚀 Deploy en Vercel

1. Conecta tu repositorio GitHub en Vercel
2. Configura las variables de entorno en Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Vercel construirá automáticamente con `npm run build`
4. Tu sitio estará disponible en: `https://tu-proyecto.vercel.app`

## 📧 Credenciales de Prueba

**Admin:**
- Email: admin@busfare.com
- Password: (la que configuraste)

**Arbitro:**
- Email: arbitro@busfare.com  
- Password: (la que configuraste)

## 🔗 Enlaces Útiles

- Dashboard Admin: `/admin`
- Panel Moderador: `/moderator`
- Perfil: `/profile`
- Configuración: `/settings`

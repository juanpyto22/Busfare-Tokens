# 🚀 GUÍA COMPLETA: Configuración y Deploy en Vercel

## ✅ ¿Qué se ha hecho?

1. ✅ **Logo mejorado**: El SVG del bus se muestra correctamente en el Navbar
2. ✅ **Archivos SQL creados**: `CREAR-USUARIOS-ADMIN-ARBITRO.sql` para crear los usuarios
3. ✅ **Instrucciones detalladas**: Archivo `INSTRUCCIONES-USUARIOS.md` con pasos a seguir
4. ✅ **Push a GitHub**: Todos los cambios están en tu repositorio: `juanpyto22/Busfare-Tokens`

---

## 📋 PASOS SIGUIENTES - ORDEN CORRECTO

### 1️⃣ CREAR USUARIOS EN SUPABASE (PRIMERO)

**Esto es OBLIGATORIO antes de hacer login/register:**

1. Ve a: https://app.supabase.com → Tu Proyecto
2. **Authentication → Users**
3. Crea estos dos usuarios:
   - **Admin**: `admin@busfare.com` (contraseña: `Admin@123456`)
   - **Arbitro**: `arbitro@busfare.com` (contraseña: `Arbitro@123456`)
   - ✅ MARCA: "Email Confirmed"
   - ✅ AUTO CONFIRM: Si

4. Ve a **SQL Editor** → Ejecuta el contenido de `CREAR-USUARIOS-ADMIN-ARBITRO.sql`

### 2️⃣ CREAR CUENTA .ENV EN LOCAL

Copia `.env.example` a `.env` en la raíz del proyecto:

```env
# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_tu_clave

# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# Backend API URL
VITE_API_URL=http://localhost:3001
```

### 3️⃣ PRUEBA LOCAL

```bash
npm install
npm run dev
```

Abre: `http://localhost:3000`

Prueba:
- ✅ Login con `admin@busfare.com`
- ✅ Acceso a `/admin`
- ✅ Register de nuevo usuario
- ✅ Verificación de email

### 4️⃣ DEPLOY EN VERCEL

#### Opción A: Conectar desde GitHub (RECOMENDADO)

1. Ve a: https://vercel.com
2. **"New Project"** → Importar tu repositorio
3. Selecciona: `juanpyto22/Busfare-Tokens`
4. Configura variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLIC_KEY` (si lo necesitas)
5. Vercel detectará automáticamente:
   - Framework: React + Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Haz click en **"Deploy"**

#### Opción B: Desde línea de comandos

```bash
npm install -g vercel
cd c:\Users\Juanpyto\Desktop\Busfare-Tokens-master
vercel
```

Sigue los prompts y configura las variables de entorno cuando te lo pida.

---

## 🔑 CREDENCIALES PARA PRUEBAS

**Tu sitio estará en:** `https://tu-proyecto.vercel.app` (Vercel te dará la URL exacta)

### Logins disponibles:

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| Admin | admin@busfare.com | Admin@123456 | admin |
| Arbitro | arbitro@busfare.com | Arbitro@123456 | moderator |

### Acceder a:
- Admin Panel: `/admin`
- Moderator Panel: `/moderator`
- Home: `/`
- Perfil: `/profile`

---

## 🐛 TROUBLESHOOTING

### ❌ Error: "User not found" en login
**Solución:** Verifica que creaste los usuarios en Supabase Auth Y ejecutaste el SQL

### ❌ Error: Variables de entorno no definidas
**Solución:** Configura en Vercel:
- Settings → Environment Variables
- Agrega todas las variables antes de deployar

### ❌ El logo no se muestra
**Solución:** Ya está arreglado ✅. El SVG se carga correctamente.

### ❌ Build falla en Vercel
**Solución:**
```bash
# Test local
npm run build
npm run preview

# Si funciona local, el problema es en variables de entorno en Vercel
```

---

## 📦 ESTRUCTURA PARA VERCEL

```
root/
├── src/           (React app)
├── backend/       (Server Node.js)
├── package.json   (Dependencies frontend)
├── vercel.json    (Config Vercel)
└── vite.config.js (Config build)
```

Vercel automáticamente:
1. Ejecuta: `npm install`
2. Ejecuta: `npm run build`
3. Sirve la carpeta `dist/` en: `https://tu-proyecto.vercel.app`

---

## ✨ FUNCIONALIDADES LISTAS

- ✅ Login/Register con Supabase Auth
- ✅ Roles de usuario (admin, moderator, user)
- ✅ Dashboard de admin
- ✅ Panel de moderador
- ✅ Perfil de usuario
- ✅ Transacciones y "Tokens"
- ✅ Competencias (Matches)
- ✅ Chat global
- ✅ Verificación de email
- ✅ Logo del bus mejorado

---

## 🎯 PRÓXIMOS PASOS

1. Crea los usuarios en Supabase ← **PRIMERO ESTO**
2. Prueba en local con `npm run dev`
3. Configura Vercel
4. Deploy
5. ¡Disfruta tu plataforma en producción! 🎉

---

## 📞 AYUDA

Si algo no funciona:
1. Verifica el archivo `INSTRUCCIONES-USUARIOS.md`
2. Revisa los logs de Vercel en: https://vercel.com/dashboard
3. Asegúrate de que las variables de entorno están configuradas

# ✅ Lista de Verificación para Despliegue

## 📦 Lo que YA TIENES
- ✅ Frontend con React + Vite
- ✅ Backend con Express + Stripe
- ✅ Sistema de autenticación (localStorage)
- ✅ Integración de pagos con Stripe
- ✅ UI completa con componentes
- ✅ Sistema de matches y apuestas
- ✅ Panel de administración
- ✅ Chat global

## 🚨 CRÍTICO - Lo que FALTA para producción

### 1️⃣ BASE DE DATOS REAL (OBLIGATORIO)
**Problema:** Actualmente usas `localStorage` - se pierde al limpiar el navegador
**Solución:** Necesitas una base de datos real

**Opciones recomendadas:**
- **Supabase** (PostgreSQL gratis, perfecto para tu proyecto)
- **MongoDB Atlas** (NoSQL, también gratis)
- **PlanetScale** (MySQL serverless)

**Lo que debes migrar:**
- Usuarios y autenticación
- Matches y apuestas
- Transacciones
- Historial de pagos
- Chat messages (si quieres persistencia)

### 2️⃣ AUTENTICACIÓN SEGURA (OBLIGATORIO)
**Problema:** Guardas contraseñas en texto plano en localStorage
**Solución:** Implementar autenticación real

**Opciones:**
- **Supabase Auth** (la más fácil, incluye emails, OAuth, etc.)
- **JWT tokens** con backend
- **NextAuth.js** si migras a Next.js
- **Firebase Auth**

### 3️⃣ BACKEND EN LA NUBE (OBLIGATORIO)
**Problema:** Tu backend solo funciona en localhost:3001
**Solución:** Desplegar el backend

**Mejores opciones:**
- **Railway** - $5/mes, muy fácil, incluye variables de entorno
- **Render** - Plan gratis disponible
- **Fly.io** - Gratis para proyectos pequeños
- **DigitalOcean App Platform** - $5/mes

**Pasos:**
1. Crear cuenta en Railway/Render
2. Conectar tu repositorio GitHub
3. Configurar variables de entorno (STRIPE_SECRET_KEY, DATABASE_URL)
4. Desplegar

### 4️⃣ FRONTEND EN LA NUBE (OBLIGATORIO)
**Opciones para frontend:**
- **Vercel** - GRATIS, perfecto para Vite/React
- **Netlify** - GRATIS, alternativa a Vercel
- **Cloudflare Pages** - GRATIS, muy rápido

**Pasos:**
1. Conectar GitHub repo
2. Configurar build command: `npm run build`
3. Configurar output directory: `dist`
4. Añadir variables de entorno (VITE_STRIPE_PUBLIC_KEY)

### 5️⃣ VARIABLES DE ENTORNO (CRÍTICO)
Debes crear archivos `.env` locales (NO SUBIRLOS A GIT):

**Frontend (.env en raíz):**
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_tu_clave
VITE_API_URL=https://tu-backend.railway.app
```

**Backend (.env en /backend):**
```env
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta
DATABASE_URL=postgresql://...
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tu-app.vercel.app
```

### 6️⃣ CORS Y SEGURIDAD (CRÍTICO)
Actualizar `backend/server.js` para aceptar solo tu dominio:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### 7️⃣ WEBHOOKS DE STRIPE (MUY RECOMENDADO)
Configurar webhooks para recibir eventos de pagos:
1. Ir a Stripe Dashboard → Developers → Webhooks
2. Añadir endpoint: `https://tu-backend.railway.app/webhook`
3. Seleccionar eventos: `payment_intent.succeeded`, `subscription.updated`
4. Copiar signing secret y añadir a `.env` como `STRIPE_WEBHOOK_SECRET`

---

## 📋 ARCHIVOS QUE NECESITAS CREAR

### 1. README.md completo
```bash
# Ver estructura abajo
```

### 2. Configuración de Railway/Render
`railway.json` o similar

### 3. Configuración de Vercel
`vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 4. Script de migración de datos
Para mover localStorage → Base de datos real

### 5. Tests básicos
Para verificar funcionalidad crítica

---

## 🔐 SEGURIDAD

### Checklist de seguridad:
- [ ] ✅ .env en .gitignore (ya lo tienes)
- [ ] ⚠️ Encriptar contraseñas (bcrypt/argon2)
- [ ] ⚠️ Validación de inputs en backend
- [ ] ⚠️ Rate limiting para evitar spam
- [ ] ⚠️ HTTPS obligatorio en producción
- [ ] ⚠️ CORS configurado correctamente
- [ ] ⚠️ Sanitizar datos de usuarios
- [ ] ⚠️ Proteger rutas de admin
- [ ] ⚠️ Stripe en modo producción (cuando estés listo)

---

## 💰 COSTOS ESTIMADOS

### Opción GRATIS (para empezar):
- Frontend: Vercel/Netlify (GRATIS)
- Backend: Render free tier (GRATIS pero duerme)
- Base de datos: Supabase free tier (500MB)
- Total: **$0/mes** ⚠️ Con limitaciones

### Opción RECOMENDADA:
- Frontend: Vercel (GRATIS)
- Backend: Railway ($5/mes)
- Base de datos: Supabase free tier o Railway ($5/mes)
- Total: **$5-10/mes**

### Opción PRO:
- Frontend: Vercel Pro ($20/mes)
- Backend: Railway ($10-20/mes)
- Base de datos: Railway/Supabase Pro ($25/mes)
- Total: **$55-65/mes**

---

## 🚀 PLAN DE ACCIÓN PASO A PASO

### Fase 1: Preparación (1-2 días)
1. [ ] Crear cuenta en GitHub
2. [ ] Subir proyecto a repositorio GitHub
3. [ ] Crear cuenta en Supabase
4. [ ] Crear cuenta en Railway/Render
5. [ ] Crear cuenta en Vercel

### Fase 2: Base de Datos (2-3 días)
1. [ ] Diseñar esquema de base de datos
2. [ ] Crear tablas en Supabase
3. [ ] Migrar lógica de db.js a Supabase SDK
4. [ ] Probar autenticación
5. [ ] Migrar datos de prueba

### Fase 3: Backend (1-2 días)
1. [ ] Actualizar server.js para usar base de datos real
2. [ ] Configurar variables de entorno
3. [ ] Desplegar en Railway/Render
4. [ ] Probar endpoints

### Fase 4: Frontend (1 día)
1. [ ] Actualizar URLs de API
2. [ ] Configurar variables de entorno
3. [ ] Desplegar en Vercel
4. [ ] Probar flujo completo

### Fase 5: Testing (1-2 días)
1. [ ] Probar registro/login
2. [ ] Probar compra de tokens
3. [ ] Probar creación de matches
4. [ ] Probar panel admin
5. [ ] Probar en móvil

### Fase 6: Producción (1 día)
1. [ ] Configurar dominio personalizado (opcional)
2. [ ] Activar Stripe modo producción
3. [ ] Configurar webhooks
4. [ ] Monitoreo de errores
5. [ ] Backup de base de datos

**TIEMPO TOTAL: 7-11 días**

---

## 📚 TUTORIALES Y RECURSOS

### Supabase
- [Guía oficial de Supabase](https://supabase.com/docs)
- [Tutorial: React + Supabase Auth](https://supabase.com/docs/guides/auth/quickstarts/react)

### Railway
- [Deploy Node.js app](https://docs.railway.app/guides/nodejs)
- [Environment variables](https://docs.railway.app/develop/variables)

### Vercel
- [Deploy Vite app](https://vercel.com/guides/deploying-vite-with-vercel)

### Stripe
- [Webhooks guide](https://stripe.com/docs/webhooks)
- [Testing guide](https://stripe.com/docs/testing)

---

## 🆘 PROBLEMAS COMUNES

### "Cannot connect to database"
- Verifica la URL de conexión
- Revisa las credenciales
- Asegúrate de que el puerto esté abierto

### "CORS error"
- Configura el origin correcto en backend
- Usa HTTPS en producción

### "Stripe webhook failed"
- Verifica el signing secret
- Usa el endpoint correcto
- Revisa los logs de Stripe

### "App is slow"
- Activa Railway "always on" ($5/mes)
- Usa CDN para assets estáticos
- Optimiza imágenes

---

## ✨ MEJORAS FUTURAS (OPCIONAL)

- [ ] Email service (SendGrid/Resend)
- [ ] Upload de imágenes (Cloudinary)
- [ ] Analytics (Google Analytics/Plausible)
- [ ] Error tracking (Sentry)
- [ ] CDN para assets (Cloudflare)
- [ ] Redis para caché
- [ ] WebSockets para chat real-time
- [ ] Sistema de notificaciones
- [ ] Backups automáticos
- [ ] CI/CD con GitHub Actions

---

## 📞 SIGUIENTE PASO

**¿Por dónde empezar?**
1. Crea una cuenta en Supabase (base de datos)
2. Crea una cuenta en Railway (backend)
3. Crea una cuenta en Vercel (frontend)
4. Después puedo ayudarte con la migración paso a paso

¿Quieres que te ayude con alguna de estas tareas primero?

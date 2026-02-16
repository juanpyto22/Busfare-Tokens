# 🎮 Fortnite Token Platform

Plataforma de apuestas de tokens para partidas de Fortnite con sistema de pagos integrado.

## 🚀 Características

- 🎯 Sistema de apuestas 1v1 con tokens
- 💳 Integración completa con Stripe para compras
- 👥 Panel de administración y moderación
- 📊 Estadísticas y leaderboard
- 💬 Chat global en tiempo real
- 🏆 Sistema de niveles y reputación
- 📱 Diseño responsive

## 🛠️ Tecnologías

### Frontend
- React 18 + Vite
- TailwindCSS + Radix UI
- React Router v6
- Framer Motion
- Stripe React SDK

### Backend
- Node.js + Express
- Stripe API
- CORS habilitado

### Base de Datos
- ✅ **Supabase:** PostgreSQL + Auth + Real-time
- ✅ **Autenticación:** Supabase Auth (email/password)
- ✅ **En Producción:** Listo para Vercel + Supabase

## 📦 Instalación Local

### 1. Clonar repositorio
```bash
git clone https://github.com/juanpyto22/Busfare-Tokens.git
cd Busfare-Tokens
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Supabase (.env)
```bash
# Copiar el archivo de ejemplo
copy .env.example .env

# Editar .env con tus credenciales de Supabase:
# Obtén estos valores de: https://app.supabase.com → Tu Proyecto → Settings → API
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# Stripe (opcional para desarrollo local)
VITE_STRIPE_PUBLIC_KEY=pk_test_tu_clave
```

### 4. Crear usuarios en Supabase
1. Ve a: https://app.supabase.com → Tu Proyecto
2. **Authentication → Users** → Create New User
3. Crea: `admin@busfare.com` y `arbitro@busfare.com`
4. Ejecuta el SQL: `CREAR-USUARIOS-ADMIN-ARBITRO.sql`

### 5. Iniciar servidor de desarrollo
```bash
npm run dev
```

Abre: http://localhost:3000

## 🧪 Usuarios de Prueba

### Administrador
- Email: `admin@busfare.com`
- Password: `Admin@123456` (o la que configuraste)
- Rol: `admin`
- Acceso a: `/admin`

### Moderador/Árbitro
- Email: `arbitro@busfare.com`
- Password: `Arbitro@123456` (o la que configuraste)
- Rol: `moderator`
- Acceso a: `/moderator`

### Crear nuevos usuarios
Usa el formulario de registro en `/register`. Los nuevos usuarios tendrán rol `user` por defecto.

## 💳 Tarjetas de Prueba Stripe

| Tarjeta | Resultado |
|---------|-----------|
| `4242 4242 4242 4242` | ✅ Pago exitoso |
| `4000 0000 0000 9995` | ❌ Fondos insuficientes |
| `4000 0000 0000 0002` | ❌ Tarjeta rechazada |

**Fecha:** Cualquier fecha futura (ej: 12/30)  
**CVC:** Cualquier 3 dígitos (ej: 123)

## 🚀 Despliegue en Vercel

### Pasos Rápidos

1. **Conectar GitHub a Vercel:**
   - Ve a: https://vercel.com
   - Conecta tu repositorio: `juanpyto22/Busfare-Tokens`

2. **Configurar variables de entorno en Vercel:**
   - Settings → Environment Variables
   - Agrega:
     ```
     VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
     VITE_SUPABASE_ANON_KEY=tu-anon-key
     VITE_STRIPE_PUBLIC_KEY=pk_test_tu_clave (opcional)
     ```

3. **Deploy:** Vercel se encargará automáticamente

Tu sitio estará en: `https://tu-proyecto.vercel.app`

**📖 Ver documentación completa:** [GUIA-DEPLOYMENT-VERCEL.md](./GUIA-DEPLOYMENT-VERCEL.md)

## 📁 Estructura del Proyecto

```
tokens/
├── src/
│   ├── components/    # Componentes React
│   ├── pages/         # Páginas principales
│   ├── contexts/      # React Context (Chat, Language)
│   ├── lib/           # Utilidades (db.js, utils.js)
│   └── hooks/         # Custom hooks
├── backend/
│   ├── server.js      # Servidor Express + Stripe
│   └── package.json   # Dependencias backend
├── public/            # Assets estáticos
└── package.json       # Dependencias frontend
```

## 🔑 Variables de Entorno

### Frontend (.env)
```env
# Supabase - REQUERIDO
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Stripe - Opcional para desarrollo
VITE_STRIPE_PUBLIC_KEY=pk_test_tu_clave

# Backend API - En desarrollo
VITE_API_URL=http://localhost:3001
```

**Obtén estos valores de:**
- **Supabase:** https://app.supabase.com → Tu Proyecto → Settings → API
- **Stripe:** https://dashboard.stripe.com/test/apikeys

## 🐛 Solución de Problemas

### Backend no inicia
```bash
cd backend
npm install
# Verificar que existe .env con STRIPE_SECRET_KEY
```

### Error de CORS
Verificar que el backend tenga CORS habilitado y el frontend apunte a la URL correcta.

### Error de Stripe
- Verificar que las claves API son correctas
- En frontend usar clave pública (pk_test_...)
- En backend usar clave secreta (sk_test_...)

## 📚 Documentación Adicional

- [BACKEND_SETUP.md](./BACKEND_SETUP.md) - Configuración del backend
- [STRIPE_SETUP.md](./STRIPE_SETUP.md) - Configuración de Stripe
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Lista de despliegue

## ⚠️ Nota Importante de Seguridad

🚨 **NUNCA subas archivos .env a Git**
- El .gitignore ya los excluye
- Las claves secretas solo deben estar en tu máquina local o variables de entorno del servidor
- Usa .env.example como plantilla sin datos sensibles

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

## 📞 Soporte

Para problemas o preguntas, crear un issue en el repositorio.

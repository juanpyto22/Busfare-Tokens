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
- 🚨 **Actualmente:** LocalStorage (solo desarrollo)
- ✅ **Para producción:** Se recomienda migrar a Supabase o PostgreSQL

## 📦 Instalación Local

### 1. Clonar repositorio
```bash
git clone <tu-repo>
cd tokens
```

### 2. Instalar dependencias del frontend
```bash
npm install
```

### 3. Configurar variables de entorno del frontend
```bash
# Copiar el archivo de ejemplo
copy .env.example .env

# Editar .env y añadir tu clave pública de Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_tu_clave_aqui
```

### 4. Instalar dependencias del backend
```bash
cd backend
npm install
```

### 5. Configurar variables de entorno del backend
```bash
# En la carpeta backend
copy .env.example .env

# Editar .env y añadir:
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta
PORT=3001
```

### 6. Iniciar servicios

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
# En la raíz del proyecto
npm run dev
```

Abrir en navegador: http://localhost:3000

## 🧪 Usuarios de Prueba

### Administrador
- Email: `admin@busfare.com`
- Password: `admin123`

### Moderador
- Email: `arbitro@busfare.com`
- Password: `arbitro123`

## 💳 Tarjetas de Prueba Stripe

| Tarjeta | Resultado |
|---------|-----------|
| `4242 4242 4242 4242` | ✅ Pago exitoso |
| `4000 0000 0000 9995` | ❌ Fondos insuficientes |
| `4000 0000 0000 0002` | ❌ Tarjeta rechazada |

**Fecha:** Cualquier fecha futura (ej: 12/30)  
**CVC:** Cualquier 3 dígitos (ej: 123)

## 🚀 Despliegue en Producción

Ver [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) para una guía completa.

### Resumen Rápido

1. **Base de Datos:** Migrar a Supabase o PostgreSQL
2. **Backend:** Desplegar en Railway, Render o Fly.io
3. **Frontend:** Desplegar en Vercel o Netlify
4. **Variables de Entorno:** Configurar en cada plataforma
5. **Stripe:** Configurar webhooks y modo producción

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
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_API_URL=http://localhost:3001  # O URL de producción
```

### Backend (backend/.env)
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...     # Opcional
PORT=3001
NODE_ENV=development                # O production
```

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

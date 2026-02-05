# 🚀 Instalación y Configuración del Backend de Stripe

## 📋 Pasos para iniciar el backend:

### 1. Navega a la carpeta del backend
```bash
cd backend
```

### 2. Instala las dependencias
```bash
npm install
```

### 3. Configura las variables de entorno

**Copia el archivo de ejemplo:**
```bash
copy .env.example .env
```

**Edita el archivo `.env` y añade tu clave SECRETA de Stripe:**

```env
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
PORT=3001
```

**⚠️ IMPORTANTE:** 
- Ve a https://dashboard.stripe.com/test/apikeys
- Copia tu **Secret key** (empieza con `sk_test_...`)
- Pégala en el archivo `.env`
- **NUNCA compartas esta clave ni la subas a git**

### 4. Inicia el servidor
```bash
npm start
```

O para desarrollo con auto-reload:
```bash
npm run dev
```

Deberías ver este mensaje:
```
  ╔════════════════════════════════════════════╗
  ║   🚀 Backend de Stripe funcionando        ║
  ║                                            ║
  ║   📍 Puerto: 3001                          ║
  ║   🌐 URL: http://localhost:3001           ║
  ║   ✅ CORS habilitado                       ║
  ╚════════════════════════════════════════════╝
```

### 5. Inicia el frontend en otra terminal

**En la raíz del proyecto (no en /backend):**
```bash
npm run dev
```

---

## ✅ Verificación

1. **Backend corriendo**: http://localhost:3001
2. **Frontend corriendo**: http://localhost:3000
3. Ambos deben estar ejecutándose simultáneamente

---

## 🧪 Probar pagos

Usa estas tarjetas de prueba:

| Tarjeta | Resultado |
|---------|-----------|
| `4242 4242 4242 4242` | ✅ Pago exitoso |
| `4000 0000 0000 9995` | ❌ Fondos insuficientes |
| `4000 0000 0000 0002` | ❌ Tarjeta rechazada |

**Fecha:** Cualquier fecha futura (ej: `12/30`)  
**CVC:** Cualquier 3 dígitos (ej: `123`)

---

## 🔧 Solución de problemas

### Error: "Cannot find module"
```bash
cd backend
npm install
```

### Error: "STRIPE_SECRET_KEY is not defined"
- Verifica que el archivo `.env` existe en `/backend`
- Verifica que tiene la variable `STRIPE_SECRET_KEY=sk_test_...`
- Reinicia el servidor

### Error: "CORS"
- El backend ya tiene CORS configurado
- Verifica que el frontend llama a `http://localhost:3001`

### El pago no funciona
- Verifica que AMBOS servidores están corriendo
- Abre la consola del navegador (F12) para ver errores
- Verifica la consola del backend para ver logs

---

## 📂 Estructura de archivos

```
backend/
├── server.js           # Servidor Express con endpoints de Stripe
├── package.json        # Dependencias
├── .env               # Variables de entorno (TU CLAVE SECRETA AQUÍ)
├── .env.example       # Plantilla de variables
└── .gitignore         # Protege archivos sensibles
```

---

## 🌐 Endpoints disponibles

- `GET /` - Health check
- `POST /create-payment-intent` - Compra de tokens
- `POST /create-subscription` - Suscripción VIP
- `POST /webhook` - Webhooks de Stripe (opcional)

---

## 🔒 Seguridad

✅ **HECHO:**
- `.env` está en `.gitignore`
- CORS configurado
- Validación de datos

⚠️ **IMPORTANTE:**
- NUNCA subas tu clave secreta a git
- NUNCA compartas tu archivo `.env`
- La clave secreta SOLO va en el backend

---

## 📚 Próximos pasos

1. **Producción:** Cambia `sk_test_` por `sk_live_` cuando estés listo
2. **Webhooks:** Configura webhooks en Stripe para eventos en tiempo real
3. **Base de datos:** Conecta a una base de datos real (MongoDB, PostgreSQL, etc.)
4. **Deploy:** Despliega el backend a Heroku, Railway, o similar

---

## ❓ ¿Necesitas ayuda?

- Stripe Docs: https://stripe.com/docs
- Dashboard: https://dashboard.stripe.com
- Testing: https://stripe.com/docs/testing

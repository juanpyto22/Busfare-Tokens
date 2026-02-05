# Configuración de Stripe

## 📝 Pasos para configurar Stripe:

### 1. Crea una cuenta en Stripe
- Ve a [https://stripe.com](https://stripe.com) y regístrate
- O inicia sesión si ya tienes cuenta

### 2. Obtén tus claves API
- Ve al Dashboard de Stripe: [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
- Encontrarás dos claves:
  - **Publishable key** (Clave Pública) - comienza con `pk_test_...`
  - **Secret key** (Clave Secreta) - comienza con `sk_test_...`

### 3. Configura las variables de entorno
1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Abre el archivo `.env` y pega tu clave pública:
   ```env
   VITE_STRIPE_PUBLIC_KEY=pk_test_TU_CLAVE_AQUI
   ```

3. **IMPORTANTE**: Solo usa la clave **pública** (`pk_test_...`) en el frontend
   - ✅ Seguro: `pk_test_...` o `pk_live_...`
   - ❌ NUNCA uses: `sk_test_...` o `sk_live_...` (solo para backend)

### 4. Reinicia el servidor de desarrollo
```bash
npm run dev
```

## 🧪 Tarjetas de prueba

Para probar pagos en modo test, usa estas tarjetas:

| Número de Tarjeta | Resultado |
|------------------|-----------|
| `4242 4242 4242 4242` | ✅ Pago exitoso |
| `4000 0000 0000 9995` | ❌ Fondos insuficientes |
| `4000 0000 0000 0002` | ❌ Tarjeta rechazada |

- **Fecha de expiración**: Cualquier fecha futura (ej: `12/34`)
- **CVC**: Cualquier 3 dígitos (ej: `123`)
- **ZIP**: Cualquier 5 dígitos (ej: `12345`)

## 🚀 Modo Producción

Para usar pagos reales:

1. Activa tu cuenta en Stripe completando la verificación
2. Cambia a claves de producción:
   - Usa `pk_live_...` en lugar de `pk_test_...`
   - Reemplaza en el archivo `.env`:
     ```env
     VITE_STRIPE_PUBLIC_KEY=pk_live_TU_CLAVE_DE_PRODUCCION
     ```

## 🔒 Seguridad

- ✅ El archivo `.env` está en `.gitignore` (no se sube a git)
- ✅ Solo usa claves públicas en el frontend
- ✅ Las claves secretas solo van en el backend
- ✅ Nunca compartas tu clave secreta

## 📚 Más información

- [Documentación de Stripe](https://stripe.com/docs)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Tarjetas de prueba](https://stripe.com/docs/testing)

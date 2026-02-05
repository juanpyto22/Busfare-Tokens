# 🎯 Mejoras Recomendadas para Producción

## 🔒 SEGURIDAD (ALTA PRIORIDAD)

### 1. Encriptación de Contraseñas
```bash
npm install bcrypt
```

```javascript
// En tu nuevo db.js con Supabase
import bcrypt from 'bcrypt';

// Al registrar
const hashedPassword = await bcrypt.hash(password, 10);

// Al hacer login (si no usas Supabase Auth)
const isValid = await bcrypt.compare(password, user.hashedPassword);
```

### 2. Rate Limiting
```bash
cd backend
npm install express-rate-limit
```

```javascript
// En backend/server.js
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Demasiadas peticiones, intenta más tarde'
});

app.use('/create-payment-intent', limiter);
```

### 3. Validación de Inputs
```bash
npm install joi
```

```javascript
import Joi from 'joi';

const paymentSchema = Joi.object({
  amount: Joi.number().min(1).max(10000).required(),
  packageId: Joi.string().required(),
  packageName: Joi.string().max(100)
});

// Usar en endpoint
const { error } = paymentSchema.validate(req.body);
if (error) return res.status(400).json({ error: error.details[0].message });
```

### 4. HTTPS Obligatorio
```javascript
// En backend/server.js para producción
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

### 5. Helmet.js (Headers de seguridad)
```bash
cd backend
npm install helmet
```

```javascript
import helmet from 'helmet';
app.use(helmet());
```

---

## 📧 SISTEMA DE EMAILS

### Opción 1: Resend (Recomendado)
```bash
npm install resend
```

```javascript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// Enviar email de verificación
await resend.emails.send({
  from: 'noreply@tudominio.com',
  to: user.email,
  subject: 'Verifica tu email',
  html: `<p>Código: ${verificationCode}</p>`
});
```

**Precio:** 3,000 emails/mes GRATIS

### Opción 2: SendGrid
```bash
npm install @sendgrid/mail
```

**Precio:** 100 emails/día GRATIS

---

## 📊 ANALYTICS Y MONITOREO

### 1. Error Tracking - Sentry
```bash
npm install @sentry/react @sentry/node
```

**Frontend (src/main.jsx):**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE
});
```

**Backend:**
```javascript
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

**Precio:** 5,000 errores/mes GRATIS

### 2. Analytics - Plausible o Google Analytics
```bash
npm install plausible-tracker
```

```javascript
import Plausible from 'plausible-tracker';
const plausible = Plausible({ domain: 'tudominio.com' });
plausible.trackPageview();
```

---

## 🖼️ SUBIDA DE IMÁGENES

### Cloudinary
```bash
npm install cloudinary
```

```javascript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload
const result = await cloudinary.uploader.upload(file, {
  folder: 'match-screenshots',
  transformation: [{ width: 1920, crop: 'limit' }]
});
```

**Precio:** 25GB almacenamiento GRATIS

---

## 💾 CACHÉ Y OPTIMIZACIÓN

### Redis para Caché
```bash
npm install redis
```

```javascript
import { createClient } from 'redis';
const redis = createClient({ url: process.env.REDIS_URL });

// Cachear leaderboard
const cached = await redis.get('leaderboard');
if (cached) return JSON.parse(cached);

// Si no está en caché, obtener de DB y guardar
const data = await getLeaderboardFromDB();
await redis.setEx('leaderboard', 300, JSON.stringify(data)); // 5 min
```

**Opción:** Upstash Redis (10k requests/día GRATIS)

---

## 🔔 NOTIFICACIONES

### Web Push Notifications
```bash
npm install web-push
```

### Real-time con Supabase Realtime
```javascript
// Suscribirse a cambios en matches
const channel = supabase
  .channel('matches')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'matches',
    filter: `player1_id=eq.${userId}`
  }, (payload) => {
    console.log('Match actualizado!', payload);
  })
  .subscribe();
```

---

## 🧪 TESTING

### 1. Unit Tests - Vitest
```bash
npm install -D vitest @testing-library/react
```

```javascript
// src/lib/__tests__/utils.test.js
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../utils';

describe('formatCurrency', () => {
  it('formats correctly', () => {
    expect(formatCurrency(1000)).toBe('€1,000.00');
  });
});
```

### 2. E2E Tests - Playwright
```bash
npm init playwright@latest
```

```javascript
// tests/purchase.spec.js
import { test, expect } from '@playwright/test';

test('purchase tokens', async ({ page }) => {
  await page.goto('http://localhost:3000/shop');
  await page.click('[data-testid="buy-100-tokens"]');
  await expect(page).toHaveURL(/checkout/);
});
```

---

## 🚀 CI/CD

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 📱 PWA (Progressive Web App)

### Vite PWA Plugin
```bash
npm install -D vite-plugin-pwa
```

```javascript
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Fortnite Tokens',
        short_name: 'FN Tokens',
        theme_color: '#8B5CF6',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

---

## 📈 SEO

### React Helmet Async
```bash
npm install react-helmet-async
```

```jsx
import { Helmet } from 'react-helmet-async';

<Helmet>
  <title>Comprar Tokens - Fortnite Platform</title>
  <meta name="description" content="Compra tokens para apostar en partidas" />
  <meta property="og:image" content="/og-image.jpg" />
</Helmet>
```

### Sitemap
```xml
<!-- public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://tudominio.com/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://tudominio.com/shop</loc>
    <priority>0.8</priority>
  </url>
</urlset>
```

---

## 🔐 2FA (Autenticación de Dos Factores)

```bash
npm install otplib qrcode
```

```javascript
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Generar secret
const secret = authenticator.generateSecret();
const otpauth = authenticator.keyuri(user.email, 'FortniteTokens', secret);

// Generar QR
const qrCode = await QRCode.toDataURL(otpauth);

// Verificar token
const isValid = authenticator.verify({ token, secret });
```

---

## 📦 OPTIMIZACIONES DE BUILD

### 1. Code Splitting
```javascript
// App.jsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Shop = lazy(() => import('@/pages/Shop'));

<Suspense fallback={<Loading />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Suspense>
```

### 2. Image Optimization
```bash
npm install vite-imagetools
```

### 3. Bundle Analysis
```bash
npm install -D rollup-plugin-visualizer
```

---

## 🌐 INTERNACIONALIZACIÓN

```bash
npm install react-i18next i18next
```

```javascript
// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { welcome: 'Welcome' } },
    es: { translation: { welcome: 'Bienvenido' } }
  },
  lng: 'es',
  fallbackLng: 'en'
});
```

---

## 💰 COSTOS TOTALES ESTIMADOS

### Stack Minimalista (GRATIS - $10/mes)
- Frontend: Vercel (GRATIS)
- Backend: Railway ($5/mes) o Render (GRATIS pero limitado)
- Database: Supabase free tier
- Email: Resend free tier
- Error tracking: Sentry free tier
- **Total: $0-5/mes**

### Stack Recomendado ($15-30/mes)
- Frontend: Vercel (GRATIS)
- Backend: Railway ($10/mes)
- Database: Supabase Pro ($25/mes) o Railway incluido
- Redis: Upstash ($10/mes)
- Cloudinary: Free tier
- Email: Resend free tier
- **Total: $20-35/mes**

### Stack Profesional ($50-100/mes)
- Todo lo anterior
- Sentry Pro ($26/mes)
- Plausible Analytics ($9/mes)
- Dominio personalizado ($12/año)
- **Total: $55-100/mes**

---

## ✅ PRIORIDADES

### Fase 1 (CRÍTICO - hacer ANTES de lanzar)
1. ✅ Migrar a base de datos real (Supabase)
2. ✅ Implementar autenticación segura
3. ✅ Desplegar backend y frontend
4. ✅ Configurar HTTPS y CORS
5. ✅ Configurar webhooks de Stripe

### Fase 2 (IMPORTANTE - primera semana)
1. Sistema de emails
2. Error tracking (Sentry)
3. Rate limiting
4. Validación de inputs
5. Backups automáticos

### Fase 3 (MEJORAS - primer mes)
1. Caché con Redis
2. Subida de imágenes
3. Notificaciones real-time
4. Analytics
5. Tests básicos

### Fase 4 (OPTIMIZACIÓN - segundo mes)
1. PWA
2. SEO
3. Code splitting
4. CI/CD
5. 2FA

---

¿En qué fase te gustaría empezar? ¿Necesitas ayuda con alguna implementación específica?

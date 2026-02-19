# 🚀 Guía de Despliegue a Producción - BusFare Tokens

## ✅ Preparación Completa para Dominio Real

Esta guía te llevará paso a paso para desplegar tu aplicación en un dominio real y hacerla funcional para múltiples usuarios.

---

## 📋 PASO 1: Configurar Base de Datos Supabase

### 1.1 Ejecutar Migración de Matches

**Ve a tu proyecto de Supabase → SQL Editor → New Query**

Ejecuta el archivo `supabase-matches-migration.sql`:

```sql
-- Este script agrega las columnas necesarias para el sistema de matches
```

Esto agregará:
- ✅ Columna `metadata` (JSONB) para almacenar configuración del match
- ✅ Columnas `player1_ready` y `player2_ready` para el sistema de "listo"
- ✅ Trigger automático para cambiar status cuando ambos estén listos
- ✅ Índices para mejorar performance

### 1.2 Verificar que las tablas existan

Ejecuta este query para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'matches', 'transactions', 'withdrawals', 'chat_messages');
```

Deberías ver las 5 tablas listadas.

---

## 📋 PASO 2: Configurar Variables de Entorno

### 2.1 Desarrollo Local (.env)

Ya tienes configurado:
```env
VITE_SUPABASE_URL=https://houbfearbinulqnacuhq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_API_URL=http://localhost:3000
```

### 2.2 Producción (Vercel/Netlify/etc)

Al desplegar, configura estas variables de entorno:
```env
VITE_SUPABASE_URL=https://houbfearbinulqnacuhq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLIC_KEY=pk_live_... # ⚠️ USA CLAVES DE PRODUCCIÓN
VITE_API_URL=https://tu-dominio.com
```

---

## 📋 PASO 3: Cambios Realizados para Producción

### ✅ Sistema de Matches Completamente Refactorizado

**ANTES:** 
- ❌ Matches en localStorage (solo visibles para un usuario)
- ❌ Fallback a localStorage causaba inconsistencias
- ❌ No había sincronización entre usuarios

**AHORA:**
- ✅ **Todos los matches se guardan en Supabase**
- ✅ **Visibles para todos los usuarios en tiempo real**
- ✅ **No hay fallback a localStorage para matches**
- ✅ **Sistema de "ready" sincronizado con base de datos**
- ✅ **Trigger automático para auto-start cuando ambos listos**

### ✅ Funciones Actualizadas

1. **`createMatch()`**
   - Crea matches directamente en Supabase
   - Almacena metadata (tipo, rondas, plataforma, etc.)
   - Retorna error claro si falla

2. **`getMatches()`**
   - Obtiene TODOS los matches de Supabase
   - Transforma correctamente el schema
   - Sin fallback a localStorage

3. **`joinMatch()`**
   - Actualiza player2_id en Supabase
   - Verifica que no esté lleno
   - Sincroniza en tiempo real

4. **`updatePlayerReady()`**
   - Actualiza player1_ready/player2_ready en Supabase
   - Descuenta/devuelve tokens automáticamente
   - Trigger DB auto-start el match cuando ambos listos

---

## 📋 PASO 4: Desplegar a Producción

### 4.1 Opción 1: Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en Vercel Dashboard
# Settings → Environment Variables → Agregar las VITE_* variables
```

### 4.2 Opción 2: Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod

# Configurar variables en Netlify Dashboard
# Site settings → Build & deploy → Environment → Agregar variables
```

### 4.3 Opción 3: Manual

```bash
# Build para producción
npm run build

# Sube la carpeta dist/ a tu hosting
# Configura las variables de entorno en tu panel de hosting
```

---

## 📋 PASO 5: Configurar CORS en Supabase

**Ve a Supabase → Settings → API**

Agrega tu dominio a la lista de URLs permitidas:
```
https://tu-dominio.com
https://www.tu-dominio.com
```

---

## 📋 PASO 6: Configurar Row Level Security (RLS)

### Políticas Recomendadas

**Tabla `matches`:**

```sql
-- Permitir que cualquier usuario autenticado vea todos los matches
CREATE POLICY "Anyone can view matches" ON matches
    FOR SELECT
    TO authenticated
    USING (true);

-- Solo el creador puede crear matches
CREATE POLICY "Users can create matches" ON matches
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = player1_id);

-- Solo los jugadores del match pueden actualizarlo
CREATE POLICY "Players can update their matches" ON matches
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = player1_id OR 
        auth.uid() = player2_id OR 
        auth.uid() = moderator_id
    );
```

**Tabla `users`:**

```sql
-- Los usuarios pueden ver perfiles públicos
CREATE POLICY "Public profiles are viewable" ON users
    FOR SELECT
    TO authenticated
    USING (true);

-- Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);
```

---

## 📋 PASO 7: Testing en Producción

### 7.1 Test Multi-Usuario

1. **Usuario A:** Crea un match
2. **Usuario B:** Debería ver el match en "Partidas Disponibles"
3. **Usuario B:** Se une al match
4. **Usuario A:** Ve que Usuario B se unió
5. **Ambos:** Marcan "Listo"
6. **Match:** Auto-start (status → 'in_progress')

### 7.2 Verificar Sincronización

Abre la app en 2 navegadores diferentes (o modo incógnito):
- Crea un match en el navegador 1
- Verifica que aparezca inmediatamente en el navegador 2
- Únete desde el navegador 2
- Verifica actualización en navegador 1

---

## 📋 PASO 8: Monitoreo y Logs

### En Supabase

**Table Editor → matches**
- Verifica que los matches se estén creando
- Revisa los campos metadata, player1_ready, player2_ready

**LogsQuicksight Logs**
- Monitorea errores SQL
- Verifica que los triggers funcionen

### En tu App

Abre DevTools Console (F12) y busca:
```
=== MATCH CREADO EXITOSAMENTE ===
=== OBTENIENDO MATCHES DE SUPABASE ===
Matches obtenidos de Supabase: X
```

---

## 🔧 Troubleshooting

### "Match no aparece en la lista"

**Verificar:**
1. ¿Se creó en Supabase? → Ve a Table Editor → matches
2. ¿El status es 'pending'? → Debe ser 'pending' para aparecer en "Disponibles"
3. ¿Hay player2_id NULL? → Debe ser NULL para tener espacio disponible

**Solución:**
```sql
-- Ver matches recientes
SELECT id, game_mode, status, player1_id, player2_id, created_at 
FROM matches 
ORDER BY created_at DESC 
LIMIT 10;
```

### "Error al crear match"

**Verificar:**
1. ¿Está autenticado? → db.getSession() debe retornar usuario
2. ¿Tiene tokens? → users.tokens >= bet_amount
3. ¿RLS configurado? → Políticas deben permitir INSERT

### "Match no se actualiza al unirse"

**Verificar:**
1. ¿player2_id se actualizó? → Debe tener UUID del segundo jugador
2. ¿RLS permite UPDATE? → Segunda usuario debe poder actualizar
3. ¿En consola aparece el log de unión? → Buscar "Unión exitosa"

---

## 📊 Arquitectura Final

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────┐
│  React App      │
│  (Vite + React) │
└──────┬──────────┘
       │ API Calls
       ▼
┌─────────────────┐
│   Supabase      │
│  - Auth         │
│  - PostgreSQL   │
│  - Realtime     │
│  - Storage      │
└─────────────────┘
```

### Flujo de Datos

1. **Usuario crea match** → INSERT en tabla `matches`
2. **Supabase guarda** → Retorna match con ID
3. **App actualiza UI** → Llama getMatches()
4. **Otros usuarios ven** → SELECT * FROM matches WHERE status='pending'
5. **Usuario se une** → UPDATE matches SET player2_id=X
6. **Ambos marcan listo** → UPDATE player1_ready=true, player2_ready=true
7. **Trigger DB** → AUTO status='in_progress'

---

## ✅ Checklist Final

- [ ] Migración SQL ejecutada en Supabase
- [ ] Variables de entorno configuradas en hosting
- [ ] RLS políticas configuradas
- [ ] CORS configurado con tu dominio
- [ ] App desplegada y accesible
- [ ] Test multi-usuario exitoso
- [ ] Matches visibles para todos los usuarios
- [ ] Sistema de "ready" funcionando
- [ ] Auto-start funcionando
- [ ] Tokens descontándose correctamente

---

## 🎉 ¡Listo para Producción!

Tu aplicación ahora está completamente preparada para un dominio real con múltiples usuarios. 

**Características implementadas:**
- ✅ Sistema de matches multi-usuario
- ✅ Sincronización en tiempo real
- ✅ Base de datos centralizada (Supabase)
- ✅ Sistema de tokens funcional
- ✅ Auto-start de matches
- ✅ Manejo robusto de errores

---

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs de la consola del navegador
2. Revisa los logs de Supabase
3. Verifica que todas las variables de entorno estén configuradas
4. Asegúrate de que la migración SQL se ejecutó correctamente

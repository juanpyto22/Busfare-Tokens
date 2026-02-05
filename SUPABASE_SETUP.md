# 🚀 Configuración Rápida de Supabase - Paso a Paso

## ✅ ARCHIVOS CREADOS

Ya creé estos archivos en tu proyecto:
- ✅ `src/lib/supabase.js` - Cliente de Supabase
- ✅ `src/lib/db-supabase.js` - Nueva capa de base de datos
- ✅ `.env.example` actualizado con variables de Supabase
- ✅ `backend/.env.example` actualizado

## 📝 PASO 1: Crear Cuenta en Supabase (5 minutos)

1. Ve a https://supabase.com
2. Click en "Start your project"
3. Crear cuenta con GitHub, Google o Email
4. ✅ Ya tienes cuenta

## 📝 PASO 2: Crear Proyecto (2 minutos)

1. En el dashboard de Supabase, click "New Project"
2. Completa:
   - **Name:** `fortnite-tokens` (o el nombre que prefieras)
   - **Database Password:** Genera uno seguro (GUÁRDALO)
   - **Region:** Europe West (Frankfurt) - más cercano a ti
   - **Pricing Plan:** Free (suficiente para empezar)
3. Click "Create new project"
4. ⏳ Espera 1-2 minutos mientras se crea

## 📝 PASO 3: Ejecutar SQL Schema (5 minutos)

1. En tu proyecto de Supabase, ve al menú lateral → **SQL Editor**
2. Click en "+ New query"
3. Abre el archivo `supabase-schema.sql` que creé en tu proyecto
4. **Copia TODO el contenido** del archivo
5. Pégalo en el editor SQL de Supabase
6. Click en "Run" (▶️ botón abajo a la derecha)
7. ✅ Deberías ver "Success. No rows returned"

**Verifica que se crearon las tablas:**
- Ve a **Table Editor** en el menú
- Deberías ver: users, matches, transactions, withdrawals, chat_messages, etc.

## 📝 PASO 4: Obtener Credenciales (2 minutos)

1. En tu proyecto de Supabase, ve a **Settings** → **API**
2. Busca estas secciones:

### Project URL
```
https://abcdefghijklmno.supabase.co
```
👆 Copia esta URL

### Project API keys

**anon public** (para el frontend):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
```
👆 Copia esta key

**service_role** (para el backend - ⚠️ SECRETA):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
```
👆 Copia esta key TAMBIÉN (es diferente)

## 📝 PASO 5: Configurar Variables de Entorno (3 minutos)

### Frontend

```bash
# En la raíz del proyecto
copy .env.example .env
```

Abre `.env` y pega tus valores:

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_TU_CLAVE_DE_STRIPE
VITE_SUPABASE_URL=https://abcdefghijklmno.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3001
```

### Backend

```bash
cd backend
copy .env.example .env
```

Abre `backend/.env` y pega:

```env
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_DE_STRIPE
SUPABASE_URL=https://abcdefghijklmno.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

⚠️ **IMPORTANTE:** La `SUPABASE_SERVICE_KEY` es DIFERENTE a la `ANON_KEY`

## 📝 PASO 6: Instalar Dependencias (2 minutos)

```bash
# En la raíz del proyecto
npm install @supabase/supabase-js

# También instalar en backend
cd backend
npm install @supabase/supabase-js
cd ..
```

## 📝 PASO 7: Reemplazar db.js (1 minuto)

Renombra el antiguo:
```bash
mv src/lib/db.js src/lib/db-old-localstorage.js
```

Renombra el nuevo:
```bash
mv src/lib/db-supabase.js src/lib/db.js
```

O simplemente:
1. Abre `src/lib/db.js`
2. Guarda una copia de respaldo
3. Reemplaza todo el contenido con el de `db-supabase.js`

## 📝 PASO 8: Probar (2 minutos)

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend (en otra terminal)
npm run dev
```

Abre http://localhost:3000

**Prueba:**
1. ✅ Registra un nuevo usuario
2. ✅ Inicia sesión
3. ✅ Verifica que se guardó en Supabase:
   - Ve a Supabase → **Table Editor** → **users**
   - Deberías ver tu usuario nuevo

## 🎉 ¡LISTO!

Ahora tu app usa Supabase en lugar de localStorage. Los datos persisten en la nube.

## 🐛 Solución de Problemas

### Error: "Invalid API key"
- Verifica que copiaste las claves correctas
- Revisa que no haya espacios extras al pegar
- Asegúrate de que el proyecto de Supabase esté activo

### Error: "relation does not exist"
- El SQL schema no se ejecutó completamente
- Ve a SQL Editor y ejecuta `supabase-schema.sql` de nuevo

### Error: "Network error"
- Verifica que la URL de Supabase sea correcta
- Revisa tu conexión a internet

### No aparecen los usuarios
- Verifica que el frontend tenga las variables correctas
- Abre la consola del navegador (F12) para ver errores
- Revisa que `src/lib/supabase.js` no muestre errores de configuración

## 📞 Siguiente Paso

Una vez que confirmes que funciona:
- Los datos ahora se guardan en Supabase ✅
- Puedes desplegar frontend y backend ✅
- El localStorage antiguo ya no se usa ✅

¿Todo funcionó? Dime si ves algún error o si necesitas ayuda con algún paso.

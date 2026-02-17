# 🔗 Guía de Configuración OAuth - Redes Sociales

Esta guía completa te enseña cómo obtener las credenciales OAuth para cada plataforma social.

---

## 📋 **Índice**

1. [Epic Games](#-1-epic-games-oauth)
2. [Discord](#-2-discord-oauth)
3. [Twitter (X)](#-3-twitter-x-oauth)
4. [Twitch](#-4-twitch-oauth)
5. [TikTok](#-5-tiktok-oauth)
6. [Configurar el Backend](#-6-configurar-el-backend)
7. [Probar las Conexiones](#-7-probar-las-conexiones)

---

## 🎮 **1. Epic Games OAuth**

### **Paso 1: Crear una Aplicación**
1. Ve a https://dev.epicgames.com/portal
2. Inicia sesión con tu cuenta de Epic Games
3. Haz clic en **"Create New Application"**
4. Completa:
   - **Application Name**: `Busfare Tokens`
   - **Description**: `Sistema de tokens para Fortnite`

### **Paso 2: Configurar OAuth**
1. En el panel lateral, ve a **"Product Settings"** → **"OAuth"**
2. Haz clic en **"Configure OAuth"**
3. Agrega **Redirect URI**:
   ```
   http://localhost:3001/auth/epic/callback
   ```
4. Selecciona **Scopes**:
   - ✅ `basic_profile`

### **Paso 3: Obtener Credenciales**
1. Ve a **"Credentials"**
2. Copia:
   - **Client ID** → Variable `EPIC_CLIENT_ID`
   - **Client Secret** → Variable `EPIC_CLIENT_SECRET`

---

## 💬 **2. Discord OAuth**

### **Paso 1: Crear una Aplicación**
1. Ve a https://discord.com/developers/applications
2. Haz clic en **"New Application"**
3. Nombre: `Busfare Tokens`
4. Acepta los términos

### **Paso 2: Configurar OAuth2**
1. En el panel lateral, haz clic en **"OAuth2"**
2. En **"Redirects"**, agrega:
   ```
   http://localhost:3001/auth/discord/callback
   ```
3. Guarda los cambios

### **Paso 3: Obtener Credenciales**
1. En la misma página de **"OAuth2"**:
   - **Client ID** → Variable `DISCORD_CLIENT_ID`
   - **Client Secret** (haz clic en "Reset Secret" si no lo ves) → Variable `DISCORD_CLIENT_SECRET`

### **Paso 4: Configurar Permisos**
1. Ve a **"OAuth2"** → **"URL Generator"**
2. Selecciona scopes:
   - ✅ `identify`
3. Copia la URL generada (opcional, para probar)

---

## 🐦 **3. Twitter (X) OAuth**

### **Paso 1: Crear una App**
1. Ve a https://developer.twitter.com/en/portal/dashboard
2. Si no tienes cuenta de desarrollador, solicítzala (puede tardar unos días)
3. Haz clic en **"+ Create Project"**
4. Completa:
   - **Project Name**: `Busfare Tokens`
   - **Use Case**: `Making a bot`
   - **Project Description**: `Token system for gaming platform`

### **Paso 2: Crear la App**
1. Después de crear el proyecto, haz clic en **"+ Add App"**
2. Nombre de la App: `Busfare OAuth`
3. Guarda las **API Keys** que te muestra

### **Paso 3: Configurar OAuth 2.0**
1. Ve a tu app → **"Settings"** → **"Authentication settings"**
2. Habilita **"OAuth 2.0"**
3. En **"Callback URI / Redirect URL"**, agrega:
   ```
   http://localhost:3001/auth/twitter/callback
   ```
4. En **"Website URL"**, pon:
   ```
   http://localhost:3002
   ```

### **Paso 4: Obtener Credenciales**
1. Ve a **"Keys and tokens"**
2. En la sección **"OAuth 2.0 Client ID and Client Secret"**:
   - **Client ID** → Variable `TWITTER_CLIENT_ID`
   - **Client Secret** → Variable `TWITTER_CLIENT_SECRET`

---

## 📺 **4. Twitch OAuth**

### **Paso 1: Crear una Aplicación**
1. Ve a https://dev.twitch.tv/console/apps
2. Haz clic en **"Register Your Application"**
3. Completa:
   - **Name**: `Busfare Tokens`
   - **OAuth Redirect URLs**: 
     ```
     http://localhost:3001/auth/twitch/callback
     ```
   - **Category**: `Website Integration`
4. Completa el captcha y haz clic en **"Create"**

### **Paso 2: Obtener Credenciales**
1. En la lista de aplicaciones, haz clic en **"Manage"**
2. Copia:
   - **Client ID** → Variable `TWITCH_CLIENT_ID`
3. Haz clic en **"New Secret"** para generar:
   - **Client Secret** → Variable `TWITCH_CLIENT_SECRET`

⚠️ **IMPORTANTE**: Guarda el Client Secret inmediatamente, no podrás verlo de nuevo.

---

## 🎵 **5. TikTok OAuth**

### **Paso 1: Crear una App de Desarrollador**
1. Ve a https://developers.tiktok.com/
2. Haz clic en **"Get Started"** o **"Register"**
3. Inicia sesión con tu cuenta de TikTok

### **Paso 2: Crear una Aplicación**
1. Ve a **"My Apps"** → **"Create an app"**
2. Completa:
   - **App Name**: `Busfare Tokens`
   - **Category**: `Gaming`
   - **Description**: `Token system for Fortnite players`

### **Paso 3: Configurar OAuth**
1. En tu app, ve a **"Login Kit"**
2. Habilita **"Login Kit"**
3. Agrega **Redirect URI**:
   ```
   http://localhost:3001/auth/tiktok/callback
   ```
4. Selecciona **Scopes**:
   - ✅ `user.info.basic`

### **Paso 4: Obtener Credenciales**
1. Ve a la sección **"Basic Information"** de tu app
2. Copia:
   - **Client Key** → Variable `TIKTOK_CLIENT_KEY`
   - **Client Secret** → Variable `TIKTOK_CLIENT_SECRET`

---

## ⚙️ **6. Configurar el Backend**

### **Paso 1: Editar el archivo .env**

1. Ve a `backend/.env` (si no existe, copia `.env.example` y renómbralo a `.env`)
2. Rellena todas las credenciales OAuth que obtuviste:

```env
# Epic Games OAuth
EPIC_CLIENT_ID=xyz123abc456
EPIC_CLIENT_SECRET=abc789def012

# Discord OAuth
DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz123456

# Twitter (X) OAuth 2.0
TWITTER_CLIENT_ID=VGhpc0lzQW5FeGFtcGxlQ2xpZW50SUQ
TWITTER_CLIENT_SECRET=ThisIsAnExampleTwitterClientSecret123

# Twitch OAuth
TWITCH_CLIENT_ID=abcdefghij1234567890
TWITCH_CLIENT_SECRET=0987654321jihgfedcba

# TikTok OAuth
TIKTOK_CLIENT_KEY=aw1234567890abcdef
TIKTOK_CLIENT_SECRET=1234567890abcdefghijklmnopqrstuv
```

### **Paso 2: Reiniciar el Backend**

1. Detén el servidor si está corriendo (Ctrl+C)
2. Reinicia con:
   ```bash
   cd backend
   npm start
   ```

3. Deberías ver:
   ```
   ╔════════════════════════════════════════════╗
   ║   🚀 Backend de Stripe funcionando        ║
   ║                                            ║
   ║   📍 Puerto: 3001                          ║
   ║   🌐 URL: http://localhost:3001           ║
   ║                                            ║
   ║   🔗 Endpoints de OAuth:                   ║
   ║   • GET /auth/epic                         ║
   ║   • GET /auth/discord                      ║
   ║   • GET /auth/twitter                      ║
   ║   • GET /auth/twitch                       ║
   ║   • GET /auth/tiktok                       ║
   ╚════════════════════════════════════════════╝
   ```

---

## 🧪 **7. Probar las Conexiones**

### **Paso 1: Ejecutar la Base de Datos**
1. Ve a Supabase y ejecuta el archivo `supabase-social-accounts.sql` si aún no lo hiciste

### **Paso 2: Probar Cada Conexión**

1. Abre http://localhost:3002
2. Ve a **Profile** → **Settings**
3. Haz clic en el botón **"Conectar"** de cada plataforma

#### **¿Qué debería pasar?**

✅ **Si todo está bien:**
- Te redirige a la página de autenticación de la plataforma
- Autorizas la aplicación
- Te devuelve a tu perfil
- Aparece tu nombre de usuario conectado
- Puedes ver el botón "Desconectar" y "Ver perfil/canal"

❌ **Si hay un error:**
- Revisa que las credenciales en `.env` sean correctas
- Verifica que las Redirect URIs coincidan exactamente
- Revisa la consola del navegador (F12) y del backend

### **Paso 3: Verificar en Supabase**

1. Ve a tu proyecto de Supabase
2. Table Editor → `users`
3. Busca tu usuario
4. Verifica que se guardaron los campos:
   - `epic_games_name`
   - `discord_username`
   - `twitter_handle`
   - `twitch_username`
   - `tiktok_handle`

---

## 🔒 **Seguridad y Producción**

### **Antes de subir a producción:**

1. **Cambia las Redirect URIs** en cada plataforma a tu dominio real:
   ```
   https://tu-dominio.com/auth/{plataforma}/callback
   ```

2. **Actualiza las URLs en el código**:
   - En `backend/server.js`, cambia todas las URLs `http://localhost:3001` y `http://localhost:3002`

3. **Usa variables de entorno**:
   ```javascript
   const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3002';
   const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
   ```

4. **Revisa los scopes**: Asegúrate de pedir solo los permisos necesarios

5. **Implementa rate limiting** para evitar abuso de los endpoints OAuth

---

## ❓ **Problemas Comunes**

### **Error: "Invalid redirect_uri"**
- Verifica que la Redirect URI en la configuración de la app coincida exactamente con la del código
- No olvides incluir `http://` o `https://`
- No agregues `/` al final

### **Error: "Invalid client_id"**
- Verifica que copiaste el Client ID correctamente en `.env`
- Asegúrate de que no haya espacios antes o después

### **Error: "Insufficient permissions"**
- Revisa que hayas habilitado los scopes correctos en la configuración de la app
- Algunos scopes requieren revisión manual por la plataforma

### **El usuario no se guarda en Supabase**
- Verifica que ejecutaste el SQL migration (`supabase-social-accounts.sql`)
- Revisa que `SUPABASE_SERVICE_KEY` esté configurado correctamente
- Mira los logs del backend para ver errores específicos

---

## 📚 **Recursos Oficiales**

- **Epic Games**: https://dev.epicgames.com/docs/
- **Discord**: https://discord.com/developers/docs/topics/oauth2
- **Twitter**: https://developer.twitter.com/en/docs/authentication/oauth-2-0
- **Twitch**: https://dev.twitch.tv/docs/authentication
- **TikTok**: https://developers.tiktok.com/doc/login-kit-web

---

## ✅ **¡Listo!**

Ahora tienes un sistema completo de autenticación OAuth para:
- 🎮 Epic Games
- 💬 Discord
- 🐦 Twitter
- 📺 Twitch
- 🎵 TikTok

Los usuarios pueden conectar sus cuentas con un solo clic y ver sus perfiles conectados directamente desde tu aplicación. 🚀

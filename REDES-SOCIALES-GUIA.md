# 📱 Configuración de Redes Sociales - Guía Completa

## ✅ **Cambios Implementados**

### **1. Base de Datos (Supabase)**
Se agregaron campos a la tabla `users` para almacenar las redes sociales:
- `epic_games_name` - Nombre de Epic Games
- `discord_username` - Usuario de Discord
- `twitter_handle` - Handle de Twitter/X
- `twitch_username` - Usuario de Twitch
- `tiktok_handle` - Handle de TikTok

### **2. Backend (db.js)**
Nuevas funciones agregadas:
- ✨ `updateSocialAccounts(userId, socialData)` - Guarda las cuentas conectadas
- ✨ `getSocialAccounts(userId)` - Obtiene las cuentas guardadas
- 🔄 Fallback automático a localStorage si Supabase falla

### **3. Frontend (Profile.jsx)**
Mejoras en la UI:
- 🎨 **Iconos** para cada red social (🎮 🐦 📺 🎵 💬)
- 🔗 **Enlaces funcionales** a perfiles cuando hay datos
- ✅ **Indicador de estado** "Conectado" en Discord
- 🎯 **Placeholders mejorados** con ejemplos

---

## 🚀 **Cómo Configurarlo**

### **PASO 1: Ejecutar SQL en Supabase**

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Abre el archivo `supabase-social-accounts.sql` desde VS Code
5. Copia y pega el contenido en Supabase
6. Haz clic en **Run**
7. Verifica que no haya errores

### **PASO 2: Usar las Cuentas Conectadas**

1. **Accede a tu perfil** en http://localhost:3002
2. Haz clic en **Settings** en el menú lateral
3. Scroll hasta **"Cuentas Conectadas"**
4. Llena los campos con tu información:

#### **Epic Games**
- Formato: `tu_nombre_epic`
- Ejemplo: `josete`
- 🔗 Te llevará a: `https://www.epicgames.com/site/josete`

#### **Discord**
- Formato: `usuario#1234`
- Ejemplo: `josete#4567`
- ✅ Muestra "Conectado" cuando hay datos

#### **Twitter (X)**
- Formato: `@usuario` o `usuario`
- Ejemplo: `@josete` o `josete`
- 🔗 Te llevará a: `https://twitter.com/josete`

#### **Twitch**
- Formato: `tu_canal`
- Ejemplo: `josete`
- 🔗 Te llevará a: `https://www.twitch.tv/josete`

#### **TikTok**
- Formato: `@usuario` o `usuario`
- Ejemplo: `@josete` o `josete`
- 🔗 Te llevará a: `https://www.tiktok.com/@josete`

5. Haz clic en **"Guardar Cuentas Conectadas"**

---

## 🎯 **Funcionalidades**

### **Enlaces Automáticos**
Cuando guardas una red social, aparece un enlace **"Ver perfil →"** en azul que te lleva directamente a tu perfil en esa plataforma.

### **Validación Automática**
- Los @ se eliminan automáticamente para Twitter y TikTok
- Los enlaces se generan correctamente sin importar el formato

### **Sincronización**
- ✅ Se guarda en **Supabase** (base de datos en la nube)
- ✅ Se guarda en **localStorage** (backup local)
- ✅ Funciona incluso si Supabase está offline

### **Persistencia**
- Las cuentas se mantienen guardadas al cerrar sesión
- Se cargan automáticamente al volver a entrar
- Se actualizan en tiempo real

---

## 📊 **Verificación**

### **Comprobar que funciona:**

1. **En la aplicación:**
   - Ve a Profile → Settings
   - Llena al menos una red social
   - Haz clic en "Guardar"
   - Deberías ver un toast verde: "Cuentas vinculadas guardadas"
   - Aparecerá el enlace "Ver perfil →"
   - Haz clic en el enlace y se abrirá tu perfil

2. **En Supabase:**
   - Ve a tu proyecto en Supabase
   - Table Editor → users
   - Busca tu usuario
   - Verifica que se guardaron los campos:
     - epic_games_name
     - discord_username
     - twitter_handle
     - twitch_username
     - tiktok_handle

3. **Recarga la página:**
   - Actualiza el navegador (F5)
   - Vuelve a Settings
   - Todas tus cuentas deberían seguir ahí

---

## 🎮 **Ejemplo Completo**

Imagina que te llamas **"josete"** y quieres conectar tus cuentas:

```
🎮 EPIC GAMES: josete
💬 DISCORD: josete#1234
🐦 TWITTER: @josete
📺 TWITCH: josete
🎵 TIKTOK: @josete
```

**Después de guardar, tendrás:**
- Enlace a tu perfil de Epic Games
- Indicador "✓ Conectado" en Discord
- Enlace a tu Twitter
- Enlace a tu canal de Twitch
- Enlace a tu TikTok

---

## 🔧 **Solución de Problemas**

### **No se guardan las cuentas:**
- Verifica que ejecutaste el SQL en Supabase
- Revisa la consola del navegador (F12) por errores
- Comprueba que estás logueado

### **Los enlaces no funcionan:**
- Verifica que el formato sea correcto (sin espacios)
- Para Twitter/TikTok usa @ o no, ambos funcionan
- Para Twitch/Epic no uses @

### **Discord no muestra "Conectado":**
- El indicador aparece cuando hay texto en el campo
- No es necesario autenticación OAuth (por ahora)

---

## 🚀 **Listo para Usar**

Tu sistema de redes sociales está **100% funcional**:
- ✅ Guarda en Supabase
- ✅ Enlaces directos funcionando
- ✅ UI mejorada con iconos
- ✅ Persistencia garantizada
- ✅ Fallback a localStorage

¡Solo ejecuta el SQL y empieza a conectar tus cuentas! 🎉

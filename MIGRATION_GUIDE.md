# 🔄 Guía de Migración a Supabase

Esta guía te ayudará a migrar desde localStorage (desarrollo) a Supabase (producción).

## 📋 Prerrequisitos

1. Cuenta en [Supabase](https://supabase.com)
2. Proyecto creado en Supabase
3. SQL ejecutado (`supabase-schema.sql`)

## 🚀 Pasos de Migración

### 1. Configurar Supabase

```bash
# Ir a: https://supabase.com/dashboard

# 1. Crear nuevo proyecto
# 2. Ir a SQL Editor
# 3. Copiar y ejecutar todo el contenido de supabase-schema.sql
# 4. Esperar a que se creen todas las tablas
```

### 2. Obtener Credenciales

En tu proyecto de Supabase:

1. Ir a **Settings** → **API**
2. Copiar:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Para el frontend
   - **service_role secret**: Para el backend (solo server-side)

### 3. Exportar Datos Actuales

**Opción A: Desde el navegador (recomendado)**
```javascript
// 1. Abrir tu app en http://localhost:3000
// 2. Abrir consola del navegador (F12)
// 3. Copiar y pegar el contenido de scripts/export-localstorage.js
// 4. Presionar Enter
// 5. Se descargará un archivo backup-*.json
```

**Opción B: Script Node.js**
```bash
# Si tienes los datos en un archivo
cd scripts
npm install
node export-localstorage.js
```

### 4. Importar Datos a Supabase

```bash
cd scripts
npm install

# Configurar variables de entorno
export SUPABASE_URL="https://tu-proyecto.supabase.co"
export SUPABASE_SERVICE_KEY="tu-service-role-key-aqui"

# Importar (reemplaza con tu archivo)
node import-to-supabase.js backup-1234567890.json
```

### 5. Actualizar el Código

#### Frontend: Instalar Supabase Client

```bash
# En la raíz del proyecto
npm install @supabase/supabase-js
```

#### Crear archivo de configuración

**src/lib/supabase.js:**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### Actualizar .env

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_API_URL=http://localhost:3001
```

### 6. Reemplazar db.js

Renombrar el antiguo:
```bash
mv src/lib/db.js src/lib/db.old.js
```

Crear nuevo `src/lib/db.js` usando Supabase:

```javascript
import { supabase } from './supabase'

export const db = {
  // Login
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw new Error(error.message)
    
    // Obtener datos completos del usuario
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    return userData
  },

  // Register
  register: async (email, password, username) => {
    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })
    
    if (authError) throw new Error(authError.message)
    
    // 2. Crear perfil en tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        username,
        role: 'user',
        tokens: 0,
        snipes: 0
      })
      .select()
      .single()
    
    if (userError) throw new Error(userError.message)
    
    return userData
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    return data
  },

  // Update user
  updateUser: async (userId, updates) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data
  },

  // Matches
  createMatch: async (matchData) => {
    const { data, error } = await supabase
      .from('matches')
      .insert(matchData)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data
  },

  getMatches: async (filters = {}) => {
    let query = supabase.from('matches').select(`
      *,
      player1:player1_id(*),
      player2:player2_id(*),
      winner:winner_id(*),
      moderator:moderator_id(*)
    `)
    
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.userId) {
      query = query.or(`player1_id.eq.${filters.userId},player2_id.eq.${filters.userId}`)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data
  },

  // Transactions
  createTransaction: async (txData) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert(txData)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data
  },

  // ... añadir más métodos según necesites
}
```

### 7. Probar Localmente

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
npm run dev
```

### 8. Verificar Funcionalidad

- [ ] Login funciona
- [ ] Register funciona
- [ ] Crear match funciona
- [ ] Ver matches funciona
- [ ] Comprar tokens funciona
- [ ] Chat funciona
- [ ] Panel admin funciona

## 🐛 Solución de Problemas

### Error: "Invalid JWT"
- Verificar que VITE_SUPABASE_ANON_KEY es correcto
- Revisar que la URL de Supabase es correcta

### Error: "Row Level Security"
- Verificar que las políticas RLS están configuradas
- Para desarrollo, puedes desactivar RLS temporalmente:
  ```sql
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  ```

### Error: "Cannot insert into table"
- Verificar que el esquema SQL se ejecutó completamente
- Revisar que los UUIDs se generan correctamente

## 📚 Recursos

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## ⚠️ Notas Importantes

1. **Passwords**: Los usuarios necesitarán restablecer contraseñas después de la migración
2. **Session**: Las sesiones antiguas de localStorage no funcionarán
3. **Backup**: Guarda los archivos `.json` exportados como respaldo
4. **Testing**: Prueba todo en desarrollo antes de producción

## ✅ Checklist Final

- [ ] Supabase proyecto creado
- [ ] SQL schema ejecutado
- [ ] Datos exportados de localStorage
- [ ] Datos importados a Supabase
- [ ] Supabase client instalado
- [ ] Variables de entorno configuradas
- [ ] db.js actualizado
- [ ] Funcionalidad probada
- [ ] Listo para producción

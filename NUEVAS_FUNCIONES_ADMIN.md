# ⚡ RESUMEN RÁPIDO - Admin y Moderación Completa

## ✅ Lo que acabo de hacer:

### 1. **Añadí +40 funciones nuevas de moderación y admin** a `src/lib/db.js`:

#### 🛡️ **Funciones de Moderador:**
- `resolveDispute()` - Resolver disputas de matches
- `cancelMatch()` - Cancelar matches y devolver tokens
- `reviewReport()` - Revisar reportes de usuarios
- `deleteMessage()` - Eliminar mensajes de chat
- `getDisputedMatches()` - Ver matches con disputa
- `getAllReports()` - Ver todos los reportes
- `getPendingReports()` - Ver reportes pendientes
- `getAllMatches()` - Ver todos los matches con filtros

#### 👨‍💼 **Funciones de Admin (tiene todas las de moderador +):**
- `changeUserRole()` - Cambiar rol de usuarios
- `adjustUserTokens()` - Añadir/quitar tokens
- `banUser()` / `unbanUser()` - Suspender usuarios
- `deleteUser()` - Eliminar usuarios permanentemente
- `resetUserStats()` - Resetear estadísticas
- `changeUserEmail()` - Cambiar email
- `changeUserUsername()` - Cambiar username
- `resetUserPassword()` - Cambiar contraseña
- `approveWithdrawal()` - Aprobar retiros
- `rejectWithdrawal()` - Rechazar retiros (devuelve tokens)
- `completeWithdrawal()` - Marcar como completado
- `forceMatchResult()` - Forzar ganador de match
- `getGlobalStats()` - Estadísticas completas del sistema
- `getUsersByRole()` - Listar por rol
- `getBannedUsers()` - Ver usuarios suspendidos
- `searchUsers()` - Buscar usuarios
- `getUserHistory()` - Historial completo de usuario
- Y más...

### 2. **Creados 3 archivos SQL nuevos:**

| Archivo | Descripción | Cuando ejecutar |
|---------|-------------|-----------------|
| **supabase-functions.sql** | Funciones RPC (increment_user_stats, complete_match, etc.) | 2º - Después del schema |
| **supabase-update-schema.sql** | Campos adicionales + políticas RLS para moderadores | 3º - Después de functions |
| **INSTALACION_COMPLETA.md** | Guía paso a paso completa | Para leer |

### 3. **Sistema de permisos RLS completo:**
- ✅ Moderadores pueden ver/editar matches, reportes y chat
- ✅ Admins pueden ver/editar TODO (usuarios, retiros, etc.)
- ✅ Usuarios normales solo ven su información

---

## 🚀 QUÉ HACER AHORA:

### Opción A: **Si YA ejecutaste supabase-schema.sql antes**

Ejecuta SOLO estos 2 archivos en orden:

1. **supabase-functions.sql** (SQL Editor → Pegar → RUN)
2. **supabase-update-schema.sql** (SQL Editor → Pegar → RUN)

### Opción B: **Si AÚN NO has ejecutado nada**

Sigue la guía completa en: **INSTALACION_COMPLETA.md**

Ejecuta en orden:
1. supabase-schema.sql
2. supabase-functions.sql
3. supabase-update-schema.sql
4. Crea usuarios en Authentication
5. insert-admin-users.sql (con UUIDs reales)

---

## 🎮 Probar las Funciones

### Como Moderador:

```javascript
// En el panel de moderador verás:
- Lista de matches con disputas
- Reportes pendientes
- Mensajes de chat
- Botón para resolver disputas
- Botón para cancelar matches
```

### Como Admin:

```javascript
// En el panel de admin verás TODO lo de moderador +
- Gestión completa de usuarios
- Editar tokens de cualquier usuario
- Cambiar roles (user → moderator → admin)
- Aprobar/rechazar retiros
- Suspender/banear usuarios
- Ver estadísticas globales
- Buscar usuarios
- Historial completo de cualquier usuario
```

---

## 🧪 Ejemplos de Uso (Consola del Navegador)

Abre la consola (F12) y prueba:

```javascript
// Importar db
import { db } from './src/lib/db'

// MODERADOR: Resolver una disputa
await db.resolveDispute(
  'match-id-aqui',
  'winner-user-id-aqui', 
  'moderator-id-aqui',
  'El jugador 1 mostró evidencia válida'
)

// ADMIN: Ajustar tokens
await db.adjustUserTokens(
  'user-id-aqui',
  500,  // cantidad a añadir (negativo para quitar)
  'Bono por bug reportado',
  'admin-id-aqui'
)

// ADMIN: Cambiar rol
await db.changeUserRole(
  'user-id-aqui',
  'moderator',  // nuevo rol
  'admin-id-aqui'
)

// ADMIN: Banear usuario
await db.banUser(
  'user-id-aqui',
  7,  // días
  'Comportamiento inapropiado en chat'
)

// ADMIN: Aprobar retiro
await db.approveWithdrawal(
  'withdrawal-id-aqui',
  'admin-id-aqui',
  'Verificado y aprobado'
)

// ADMIN: Ver estadísticas globales
const stats = await db.getGlobalStats()
console.log(stats)
```

---

## 📊 Funciones Disponibles por Rol

### 🛡️ Moderador (49 funciones):
- ✅ Todas las funciones básicas de usuario
- ✅ resolveDispute, cancelMatch
- ✅ reviewReport, getAllReports, getPendingReports
- ✅ deleteMessage, getChatMessages
- ✅ getDisputedMatches, getAllMatches
- ✅ Ver estadísticas generales

### 👨‍💼 Admin (78+ funciones):
- ✅ **TODAS** las funciones de moderador
- ✅ changeUserRole
- ✅ adjustUserTokens, resetUserStats
- ✅ banUser, unbanUser, deleteUser
- ✅ changeUserEmail, changeUserUsername, resetUserPassword
- ✅ approveWithdrawal, rejectWithdrawal, completeWithdrawal
- ✅ forceMatchResult
- ✅ getGlobalStats, getUsersByRole, getBannedUsers
- ✅ searchUsers, getUserHistory
- ✅ getRecentActivity
- ✅ Y más...

---

## 🔧 Funciones RPC en Supabase

Las siguientes funciones se ejecutan en el servidor:

| Función | Descripción |
|---------|-------------|
| `increment_user_stats` | Actualiza estadísticas de usuario atómicamente |
| `update_user_streak` | Actualiza rachas de victoria |
| `complete_match` | Completa match y distribuye premios |
| `get_leaderboard` | Obtiene leaderboard optimizado |
| `is_user_banned` | Verifica si usuario está baneado |
| `cleanup_expired_bans` | Limpia bans expirados |
| `get_global_statistics` | Estadísticas globales rápidas |
| `add_experience` | Añade XP y actualiza nivel |
| `calculate_level` | Calcula nivel según XP |
| `create_match_transaction` | Crea transacción de match |

---

## ⚠️ IMPORTANTE

1. **Ejecuta los SQLs en orden** (schema → functions → update)
2. **Las funciones RPC son necesarias** para que funcione correctamente
3. **Las políticas RLS** permiten que moderadores/admins vean todo
4. **Recarga la app** después de ejecutar los SQLs

---

## ✅ Verificación Rápida

Ejecuta en SQL Editor:

```sql
-- Ver funciones creadas
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';

-- Ver usuarios con roles
SELECT username, role, tokens, banned_until
FROM users
ORDER BY role DESC, username;

-- Ver políticas RLS
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 📁 Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| **src/lib/db.js** | Todas las funciones de BD (ACTUALIZADO CON +40 NUEVAS) |
| **supabase-schema.sql** | Schema base de la BD |
| **supabase-functions.sql** | Funciones RPC (NUEVO) |
| **supabase-update-schema.sql** | Actualización de schema + RLS (NUEVO) |
| **insert-admin-users.sql** | Script para insertar admin + árbitros |
| **INSTALACION_COMPLETA.md** | Guía paso a paso completa (NUEVO) |
| **.env** | Credenciales de Supabase |

---

## 🎯 Tu aplicación ahora tiene:

✅ Sistema de moderación completo
✅ Panel de administración con todos los permisos
✅ Gestión avanzada de usuarios
✅ Sistema de roles (user, moderator, admin)
✅ Aprobación de retiros
✅ Resolución de disputas
✅ Sistema de reportes
✅ Moderación de chat
✅ Estadísticas globales
✅ Logs de actividad
✅ Control total del sistema

---

**¿Listo para probar?** 

1. Ejecuta los SQLs faltantes
2. Recarga la página
3. Inicia sesión como admin
4. Ve al panel de admin
5. ¡Disfruta de todos los poderes! ⚡

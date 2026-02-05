# 🚀 Guía Completa de Instalación - Supabase + Admin/Moderadores

## 📋 Orden de Ejecución (IMPORTANTE)

Ejecuta estos archivos SQL en Supabase **EN ESTE ORDEN**:

### 1️⃣ **supabase-schema.sql**
```sql
-- Crea todas las tablas, índices y políticas RLS básicas
```
**Cómo:** Ve a Supabase Dashboard → SQL Editor → Pega el contenido → RUN

---

### 2️⃣ **supabase-functions.sql**
```sql
-- Crea funciones RPC necesarias para moderación y administración
```
**Cómo:** SQL Editor → Pega el contenido → RUN

---

### 3️⃣ **supabase-update-schema.sql**
```sql
-- Añade campos adicionales y políticas RLS para moderadores/admins
```
**Cómo:** SQL Editor → Pega el contenido → RUN

---

### 4️⃣ **Crear Usuarios en Authentication**

Ve a: **Authentication → Users → Add User**

#### 👨‍💼 Admin:
- Email: `admin@busfare.com`
- Password: `AdminBusfare2026!`
- Email Confirm: ✅
- **Copia el UUID generado**

#### 👮 Árbitros (10 usuarios):
- Email: `arbitro1@busfare.com` hasta `arbitro10@busfare.com`
- Password: `Arbitro2026!`
- Email Confirm: ✅
- **Copia cada UUID generado**

---

### 5️⃣ **insert-admin-users.sql**
```sql
-- Inserta los usuarios admin y árbitros en la tabla users
```
**IMPORTANTE:**
1. Abre el archivo `insert-admin-users.sql`
2. **Reemplaza los UUIDs ficticios** con los UUIDs REALES que copiaste de Authentication
3. Guarda el archivo
4. Copia el contenido actualizado
5. SQL Editor → Pega → RUN

---

## ✅ Verificación

Una vez completados todos los pasos, verifica:

### 1. Verificar Tablas:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deberías ver:
- chat_messages
- matches
- reports
- transactions
- user_achievements
- users
- withdrawals

### 2. Verificar Funciones:
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

Deberías ver:
- add_experience
- calculate_level
- cleanup_expired_bans
- complete_match
- create_match_transaction
- get_global_statistics
- get_leaderboard
- increment_user_stats
- is_user_banned
- update_user_streak

### 3. Verificar Usuarios:
```sql
SELECT id, email, username, role, tokens, email_verified
FROM users
ORDER BY 
  CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'moderator' THEN 2 
    ELSE 3 
  END,
  username;
```

Deberías ver:
- 1 admin
- 10 moderadores
- 0 usuarios normales (se crean al registrarse)

---

## 🎮 Funciones de Moderador

Los moderadores pueden:

✅ **Ver todos los matches**
- Filtrar por estado (pending, in_progress, disputed, completed)
- Ver detalles completos de jugadores
- Ver capturas de pantalla

✅ **Resolver disputas**
- Revisar evidencia de ambos jugadores
- Declarar ganador
- Añadir notas de resolución
- Cancelar matches con devolución de tokens

✅ **Gestionar reportes**
- Ver todos los reportes pendientes
- Aprobar o rechazar reportes
- Banear usuarios reportados
- Añadir notas de moderación

✅ **Moderar chat**
- Eliminar mensajes inapropiados
- Ver historial completo
- Banear usuarios del chat

✅ **Estadísticas**
- Ver matches activos
- Ver reportes pendientes
- Ver actividad general

---

## 👨‍💼 Funciones de Administrador

Los admins tienen **TODOS** los permisos de moderador **MÁS**:

### 🔧 Gestión de Usuarios:

✅ **Editar cualquier usuario:**
```javascript
db.updateUser(userId, {
  username: 'nuevo_username',
  email: 'nuevo@email.com',
  tokens: 1000,
  role: 'moderator'
})
```

✅ **Cambiar roles:**
```javascript
db.changeUserRole(userId, 'moderator', adminId)
// Roles: 'user', 'moderator', 'admin'
```

✅ **Ajustar tokens:**
```javascript
db.adjustUserTokens(userId, 500, 'Bono por actividad', adminId)
db.adjustUserTokens(userId, -100, 'Penalización por trampa', adminId)
```

✅ **Suspender/Banear:**
```javascript
db.banUser(userId, 7, 'Comportamiento inapropiado')
db.unbanUser(userId)
```

✅ **Eliminar usuarios:**
```javascript
db.deleteUser(userId)
```

✅ **Resetear estadísticas:**
```javascript
db.resetUserStats(userId, adminId, 'Solicitud del usuario')
```

✅ **Cambiar contraseñas:**
```javascript
db.resetUserPassword(userId, 'nuevaContraseña123', adminId)
```

✅ **Cambiar email/username:**
```javascript
db.changeUserEmail(userId, 'nuevo@email.com', adminId)
db.changeUserUsername(userId, 'nuevo_username', adminId)
```

### 💰 Gestión de Retiros:

✅ **Aprobar retiros:**
```javascript
db.approveWithdrawal(withdrawalId, adminId, 'Aprobado')
```

✅ **Rechazar retiros:**
```javascript
db.rejectWithdrawal(withdrawalId, adminId, 'Documentación insuficiente')
// Los tokens se devuelven automáticamente al usuario
```

✅ **Completar retiros:**
```javascript
db.completeWithdrawal(withdrawalId, adminId, 'Transferido vía PayPal')
```

✅ **Ver todos los retiros:**
```javascript
db.getAllWithdrawals()
db.getPendingWithdrawals()
```

### 🎯 Gestión de Matches:

✅ **Forzar resultado:**
```javascript
db.forceMatchResult(matchId, winnerId, adminId, 'Error del sistema corregido')
```

✅ **Cancelar match:**
```javascript
db.cancelMatch(matchId, 'Match inválido', adminId)
// Devuelve tokens a ambos jugadores
```

✅ **Ver todos los matches:**
```javascript
db.getAllMatches({ status: 'disputed', limit: 50 })
```

### 📊 Estadísticas Globales:

✅ **Dashboard completo:**
```javascript
const stats = await db.getGlobalStats()
// Retorna:
// - Total usuarios
// - Total matches
// - Matches activos
// - Total tokens en el sistema
// - Usuarios nuevos esta semana
// - Total retirado
// - Retiros pendientes
// - Volumen total de transacciones
```

✅ **Actividad reciente:**
```javascript
db.getRecentActivity(100)
```

✅ **Búsqueda de usuarios:**
```javascript
db.searchUsers('juan')
```

✅ **Usuarios por rol:**
```javascript
db.getUsersByRole('moderator')
```

✅ **Usuarios baneados:**
```javascript
db.getBannedUsers()
```

✅ **Historial completo:**
```javascript
db.getUserHistory(userId)
// Retorna: user, matches, transactions, withdrawals, reports
```

---

## 🔐 Permisos por Rol

| Función | User | Moderador | Admin |
|---------|------|-----------|-------|
| Jugar matches | ✅ | ✅ | ✅ |
| Comprar tokens | ✅ | ✅ | ✅ |
| Retirar dinero | ✅ | ✅ | ✅ |
| Ver su perfil | ✅ | ✅ | ✅ |
| Ver leaderboard | ✅ | ✅ | ✅ |
| Reportar usuarios | ✅ | ✅ | ✅ |
| **Resolver disputas** | ❌ | ✅ | ✅ |
| **Revisar reportes** | ❌ | ✅ | ✅ |
| **Moderar chat** | ❌ | ✅ | ✅ |
| **Ver todos los matches** | ❌ | ✅ | ✅ |
| **Cancelar matches** | ❌ | ✅ | ✅ |
| **Editar usuarios** | ❌ | ❌ | ✅ |
| **Cambiar roles** | ❌ | ❌ | ✅ |
| **Gestionar retiros** | ❌ | ❌ | ✅ |
| **Ajustar tokens** | ❌ | ❌ | ✅ |
| **Banear usuarios** | ❌ | ❌ | ✅ |
| **Eliminar usuarios** | ❌ | ❌ | ✅ |
| **Estadísticas globales** | ❌ | ❌ | ✅ |

---

## 🆘 Problemas Comunes

### Error: "function increment_user_stats does not exist"
**Solución:** Ejecuta `supabase-functions.sql` en SQL Editor

### Error: "column player1_ready does not exist"
**Solución:** Ejecuta `supabase-update-schema.sql` en SQL Editor

### Error: "permission denied for table users"
**Solución:** Verifica las políticas RLS en `supabase-update-schema.sql`

### No puedo ver todos los matches siendo moderador
**Solución:** Ejecuta `supabase-update-schema.sql` que añade las políticas RLS

### Los retiros no aparecen en el admin panel
**Solución:** 
1. Verifica que ejecutaste `supabase-update-schema.sql`
2. Verifica que tu usuario tiene role='admin'

---

## ✅ Lista de Verificación Final

- [ ] Ejecuté `supabase-schema.sql`
- [ ] Ejecuté `supabase-functions.sql`
- [ ] Ejecuté `supabase-update-schema.sql`
- [ ] Creé 11 usuarios en Authentication (1 admin + 10 árbitros)
- [ ] Actualicé `insert-admin-users.sql` con UUIDs reales
- [ ] Ejecuté `insert-admin-users.sql`
- [ ] Verifiqué que las tablas existen
- [ ] Verifiqué que las funciones existen
- [ ] Verifiqué que los usuarios están en la BD
- [ ] Probé login como admin
- [ ] Probé login como moderador
- [ ] Las funciones de moderación funcionan
- [ ] Las funciones de admin funcionan
- [ ] Recargué la aplicación frontend

---

## 🎯 Próximos Pasos

1. **Prueba todas las funciones** de moderador y admin
2. **Registra un usuario normal** para probar  el flujo completo
3. **Crea matches de prueba** para verificar la moderación
4. **Prueba el sistema de reportes**
5. **Configura Stripe** para pagos reales (ver `STRIPE_SETUP.md`)
6. **Despliega en Vercel** (ver `DEPLOYMENT_CHECKLIST.md`)

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Revisa esta guía paso a paso
3. Verifica que los UUIDs son correctos
4. Verifica que las credenciales en `.env` son correctas

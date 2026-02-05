# GUÍA PARA ARREGLAR EL REGISTRO DE USUARIOS

## ❌ PROBLEMA ACTUAL
Error: "infinite recursion detected in policy for relation 'users'" 
- Los usuarios no se pueden registrar
- Las políticas RLS están creando bucles infinitos

## ✅ SOLUCIÓN EN 3 PASOS

### PASO 1: Arreglar Políticas RLS en Supabase
1. Ve a tu proyecto Supabase: https://supabase.com/dashboard
2. Ve a **SQL Editor** (lado izquierdo)
3. **Copia y pega** todo el contenido de `fix-rls-policies.sql`
4. Haz clic en **"Run"**

### PASO 2: Verificar que todo funciona
1. En **SQL Editor**, copia y pega todo el contenido de `verify-user-registration.sql`
2. Haz clic en **"Run"**
3. Deberías ver mensajes como "RLS Policies fixed successfully!"

### PASO 3: Probar el registro
1. Ve a tu aplicación: https://busfaretokens.vercel.app
2. Intenta registrar un nuevo usuario con un email real
3. El usuario debería aparecer en la tabla **"users"** de Supabase

## 🔧 ARCHIVOS CREADOS
- `fix-rls-policies.sql` - Arregla las políticas RLS problemáticas
- `verify-user-registration.sql` - Verifica que todo funcione
- Código actualizado en `src/lib/db.js` - Funciones de registro mejoradas

## ⚡ DESPUÉS DEL ARREGLO
Una vez ejecutados los scripts SQL:
- ✅ Los usuarios se pueden registrar sin errores
- ✅ Aparecen automáticamente en la tabla "users"
- ✅ Reciben 100 tokens iniciales
- ✅ Las políticas RLS funcionan correctamente

## 📋 CHECKLIST
- [ ] Ejecutar `fix-rls-policies.sql` en Supabase SQL Editor
- [ ] Ejecutar `verify-user-registration.sql` para verificar
- [ ] Probar registro de usuario en la app
- [ ] Verificar que el usuario aparece en tabla "users"
- [ ] Confirmar que no sale error de recursión infinita

## 🆘 SI ALGO FALLA
Si aún hay problemas después de ejecutar los scripts:
1. Verifica que estás en el proyecto Supabase correcto
2. Asegúrate de que todos los scripts se ejecutaron sin errores
3. Ve a **Authentication** > **Users** para ver usuarios registrados
4. Ve a **Table editor** > **users** para ver los perfiles creados
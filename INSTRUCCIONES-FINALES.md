🔧 INSTRUCCIONES FINALES - PASO A PASO PARA ARREGLAR TODO
═══════════════════════════════════════════════════════════════════

⚠️ SIGUE ESTOS PASOS EN ORDEN EXACTO
═══════════════════════════════════════════════════════════════════

PASO 1️⃣: LIMPIAR auth.users (En Supabase Panel)
─────────────────────────────────────────────────

1. Ve a: https://app.supabase.com
2. Selecciona tu proyecto (busfare-tokens)
3. Ve a: Authentication → Users
4. Para CADA usuario que veas en la lista:
   - Haz clic en los 3 puntos (...) a la derecha
   - Selecciona: "Delete user"
   - Confirma en la ventana que aparece

⚠️ IMPORTANTE: TODOS los usuarios deben ser ELIMINADOS. auth.users debe estar VACÍO

PASO 2️⃣: CREAR ADMIN EN Supabase Panel
─────────────────────────────────────

1. En la misma página (Authentication → Users)
2. Haz clic en: "Create new user" (botón azul/verde)
3. Rellena EXACTAMENTE así:

   Email address:     admin@busfare.com
   Password:          Admin@123456
   
   Marca estas casillas (IMPORTANTE):
   ☑ Email Confirmed (DEBES marcarla)
   ☑ Auto Confirm (DEBES marcarla)

4. Haz clic en: "Create user"

✅ Verás que aparece en la lista con email: admin@busfare.com

PASO 3️⃣: CREAR ARBITRO EN Supabase Panel
────────────────────────────────────────

1. Haz clic nuevamente en: "Create new user"
2. Rellena EXACTAMENTE así:

   Email address:     arbitro@busfare.com
   Password:          Arbitro@123456
   
   Marca estas casillas (IMPORTANTE):
   ☑ Email Confirmed (DEBES marcarla)
   ☑ Auto Confirm (DEBES marcarla)

3. Haz clic en: "Create user"

✅ Verás que aparece en la lista con email: arbitro@busfare.com

VERIFICACIÓN:
En Authentication → Users deberías ver EXACTAMENTE 2 usuarios:
  1. admin@busfare.com
  2. arbitro@busfare.com

Si hay más de 2, borra los extras.

PASO 4️⃣: EJECUTAR SQL (En SupaBase SQL Editor)
───────────────────────────────────────────────

1. Ve a: SQL Editor (en la barra izquierda de Supabase)
2. Haz clic en: "New Query" o "+" (para nueva query)
3. Abre el archivo: SETUP-FINAL-COMPLETO.sql
4. Copia TODO el contenido desde aquí:
   
   -- PASO 5: CREAR USUARIOS EN public.users
   
   Hasta el final del archivo.

5. Pégalo en el SQL Editor
6. Haz clic en: "Run" o ▶ (botón de ejecutar)

Deberías ver al final:
┌────────┬─────────────────────┬──────────────┬──────────┐
│ id     │ email               │ username     │ role     │
├────────┼─────────────────────┼──────────────┼──────────┤
│ ...    │ admin@busfare.com   │ admin_user   │ admin    │
│ ...    │ arbitro@busfare.com │ arbitro_user │ moderator│
└────────┴─────────────────────┴──────────────┴──────────┘

✅ Si ves eso, está correcto.

PASO 5️⃣: VERIFICAR EN base de datos (Data Editor)
──────────────────────────────────────────────────

1. Ve a: Data Editor (en la barra izquierda)
2. Selecciona la tabla: users
3. Deberías ver SOLO 2 filas:
   - admin_user | admin@busfare.com | admin
   - arbitro_user | arbitro@busfare.com | moderator

Si hay más usuarios, bórralos manualmente (para empezar limpio).

PASO 6️⃣: ACTUALIZAR TU .env LOCAL
──────────────────────────────────

1. En la raíz de tu proyecto, edita el archivo: .env
2. Debe tener:

VITE_SUPABASE_URL=https://tuProject.supabase.co
VITE_SUPABASE_ANON_KEY=tuAnonKey
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx

Busca estos valores en:
https://app.supabase.com → Tu Proyecto → Settings → API

PASO 7️⃣: PROBAR LOGIN/REGISTER EN LOCAL
────────────────────────────────────────

1. En una terminal, en la carpeta del proyecto:

   npm install
   npm run dev

2. Abre en navegador: http://localhost:3000

3. PRUEBA 1 - LOGIN como ADMIN:
   Clic en "Iniciar Sesión"
   Email: admin@busfare.com
   Password: Admin@123456
   Clic en "Iniciar Sesión"
   
   ✅ Debe entrar sin errores
   ✅ Debe mostrar home
   ✅ Navbar debe mostrar "admin_user"
   ✅ Debe ir a /admin sin problemas

4. LOGOUT (botón en navbar) y PRUEBA 2 - LOGIN como ARBITRO:
   Email: arbitro@busfare.com
   Password: Arbitro@123456
   
   ✅ Debe entrar sin errores
   ✅ Navbar debe mostrar "arbitro_user"
   ✅ Debe ir a /moderator sin problemas

5. LOGOUT y PRUEBA 3 - REGISTER nuevo usuario:
   Clic en "Crear Cuenta"
   Nombre de Usuario: TestUser123
   Email: test@gmail.com
   Contraseña: Test@12345
   Clic en "Crear Cuenta"
   
   ✅ Debe crear sin errores
   ✅ Debe redirigir a /verify-email
   ✅ Debe entrar automáticamente
   ✅ En Supabase → Data Editor → users, debe aparecer el nuevo usuario

PASO 8️⃣: HACER PUSH A GITHUB
──────────────────────────────

1. En terminal:

   cd c:\Users\Juanpyto\Desktop\Busfare-Tokens-master
   git add .
   git commit -m "fix: Arreglar login, register y crear admin/arbitro"
   git push origin main

2. Verifica en: https://github.com/juanpyto22/Busfare-Tokens

PASO 9️⃣: DEPLOY EN VERCEL (Opcional)
──────────────────────────────────────

1. Ve a: https://vercel.com
2. Conecta tu repositorio (si no lo hiciste)
3. Configura variables de entorno:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
4. Haz clic en "Deploy"

─────────────────────────────────────────────────────────────────

✅ ¡LISTO! Tu plataforma está funcionando

═══════════════════════════════════════════════════════════════════

📋 CHECKLIST - Verifica que completaste TODO:

⬜ PASO 1: Limpiado auth.users (todos borrados)
⬜ PASO 2: Creado admin@busfare.com en auth.users
⬜ PASO 3: Creado arbitro@busfare.com en auth.users
⬜ PASO 4: Ejecutado SQL (SETUP-FINAL-COMPLETO.sql)
⬜ PASO 5: Verificado que hay 2 usuarios en public.users
⬜ PASO 6: Actualizado .env local
⬜ PASO 7: Probado login/register en localhost:3000
  ⬜ Login admin funciona
  ⬜ Login arbitro funciona
  ⬜ Register crea usuarios automáticos
⬜ PASO 8: Hecho push a GitHub
⬜ PASO 9: (Opcional) Desplegado en Vercel

═══════════════════════════════════════════════════════════════════

🚨 SI ALGO FALLA:

❌ Error: "User not found"
   → Verifica que ejecutaste el SQL correctamente
   → Verifica que los usuarios existen en auth.users

❌ Error: "Email or password incorrect"
   → Verifica que la contraseña es exactamente: Admin@123456
   → Verifica que el email es exactamente: admin@busfare.com

❌ Register no funciona
   → Verifica que .env tiene VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
   → Intenta logout completo y limpia localStorage:
     En console: localStorage.clear()

❌ El SQL da error
   → Verifica que ya creaste los usuarios en auth.users PRIMERO
   → Copia TODO el contenido desde "PASO 5" del SQL
   → No ejecutes partes que digan "MANUAL"

═══════════════════════════════════════════════════════════════════

💡 RECORDATORIOS IMPORTANTES:

1. La contraseña de ADMIN es Admin@123456 (puedes cambiarla en Supabase)
2. La contraseña de ARBITRO es Arbitro@123456 (puedes cambiarla en Supabase)
3. El código ya está arreglado ✅ (login/register mejorados)
4. Los nuevos usuarios se crean automáticamente cuando registren
5. Solo admin+arbitro al comenzar, los demás se crean solos

═══════════════════════════════════════════════════════════════════

¿NECESITAS AYUDA?

Revisa una de estos archivos de documentación:
- RESPUESTAS-RAPIDAS.md (respuestas cortas a preguntas frecuentes)
- FLUJO-USUARIOS.md (cómo funciona el flujo de usuarios)
- REGISTRO-AUTOMATICO.md (cómo se crean usuarios automáticamente)

═══════════════════════════════════════════════════════════════════

🔐 CÓMO CREAR USUARIOS ADMIN Y ARBITRO EN SUPABASE

═══════════════════════════════════════════════════════════════════

⚠️ IMPORTANTE: LA CONTRASEÑA LA DECIDES TÚ

Tú eres quien decide la contraseña de los usuarios admin y arbitro.
En Supabase puedes configurarla como quieras. Ejemplos:

  Admin:    admin@busfare.com  →  Contraseña: Admin@123456
  Arbitro:  arbitro@busfare.com → Contraseña: Arbitro@123456

Ó puedes usar las que prefieras. Lo importante es que las recuerdes.

═══════════════════════════════════════════════════════════════════

📋 PASO A PASO: CREAR LOS DOS ÚNICOS USUARIOS INICIALES
═══════════════════════════════════════════════════════════════════

PASO 1: Ir a Supabase Auth
────────────────────────────
1. Abre: https://app.supabase.com
2. Selecciona tu proyecto (Busfare-Tokens)
3. En la barra izquierda: Authentication → Users
4. Verás que está vacío (sin usuarios)

PASO 2: Crear usuario ADMIN
────────────────────────────
1. Haz clic en: "Create new user" (botón verde/azul)
2. Rellena el formulario:

   Email address:  admin@busfare.com
   Password:       Admin@123456  (la que TÚ quieras)
   
3. IMPORTANTE - Marca estas opciones:
   ☑ Email Confirmed (marca la casilla)
   ☑ Auto Confirm (marca la casilla)
   
4. Haz clic en: "Create user"

✅ Resultado: Tendrás 1 usuario creado en auth.users

PASO 3: Crear usuario ARBITRO
──────────────────────────────
Repite el mismo proceso:

1. Haz clic en: "Create new user"
2. Rellena:

   Email address:  arbitro@busfare.com
   Password:       Arbitro@123456  (la que TÚ quieras)
   
3. IMPORTANTE - Marca:
   ☑ Email Confirmed
   ☑ Auto Confirm
   
4. Haz clic en: "Create user"

✅ Resultado: Tendrás 2 usuarios en auth.users (admin y arbitro)

PASO 4: Ejecutar el SQL para completar la configuración
────────────────────────────────────────────────────────
Ahora debes ejecutar el SQL para que estos usuarios tengan roles en la BD.

1. En Supabase, ve a: SQL Editor
2. Haz clic en: "New Query" (o "+")
3. Copia TODO el contenido del archivo: CREAR-USUARIOS-ADMIN-ARBITRO.sql
4. Pégalo en el editor
5. Haz clic en: ▶ (Run o Execute)
6. Debería decir "Success" y mostrar los usuarios al final

✅ Resultado: Los usuarios ahora tienen roles (admin, moderator) en public.users

═══════════════════════════════════════════════════════════════════

✅ VERIFICACIÓN - Confirma que todo está correcto
═══════════════════════════════════════════════════════════════════

Después de ejecutar el SQL, verifica en la tabla public.users:

1. Ve a: Data Editor
2. Selecciona tabla: users
3. Deberías ver SOLO 2 filas:

   | email               | username     | role       | tokens |
   |-------------------|--------------|-----------|--------|
   | admin@busfare.com | admin_user   | admin     | 99999  |
   | arbitro@busfare.com| arbitro_user | moderator | 50000  |

Si ves otros usuarios, BÓRRALOS manualmente (solo deben estar estos 2).

═══════════════════════════════════════════════════════════════════

🔑 CREDENCIALES FINALES PARA LOGUEARCE
═══════════════════════════════════════════════════════════════════

Para iniciar sesión desde tu página:

ADMIN:
  Email:    admin@busfare.com
  Password: Admin@123456  (la que TÚ configuraste en Supabase)
  Rol:      admin
  Acceso a: https://tu-sitio.com/admin

ARBITRO:
  Email:    arbitro@busfare.com
  Password: Arbitro@123456  (la que TÚ configuraste en Supabase)
  Rol:      moderator
  Acceso a: https://tu-sitio.com/moderator

═══════════════════════════════════════════════════════════════════

📝 LOS DEMÁS USUARIOS SE CREAN AUTOMÁTICAMENTE
═══════════════════════════════════════════════════════════════════

Cuando alguien hace REGISTER desde tu página:

1. Rellena el formulario de registro
2. Presiona "Crear Cuenta"
3. El sistema automáticamente:
   ✓ Crea el usuario en auth.users
   ✓ Crea el registro en public.users
   ✓ Asigna rol "user" por defecto
   ✓ Genera tokens iniciales (100)

TÚ NO necesitas hacer nada especial. Los usuarios se auto-crean en la BD.

Ejemplo: Si alguien se registra como:
  Email:    juan@gmail.com
  Username: JuanGamer
  Password: Password123

Automáticamente se crea en la BD con:
  ✓ role = "user"
  ✓ tokens = 100
  ✓ email_verified = false (hasta que confirme email)

═══════════════════════════════════════════════════════════════════

⚠️ PASOS MÁS IMPORTANTE:

1. ✓ Crea SOLO 2 usuarios en Supabase Auth (admin y arbitro)
2. ✓ Ejecuta el SQL: CREAR-USUARIOS-ADMIN-ARBITRO.sql
3. ✓ Verifica que solo hay 2 usuarios en public.users
4. ✓ Los demás se crean solos cuando se registren

═══════════════════════════════════════════════════════════════════

🚨 NOTAS IMPORTANTES:

• La contraseña Admin@123456 es UN EJEMPLO. Tú decides cuál usar.
• Guarda las contraseñas en un lugar seguro (gestor de contraseñas).
• Los usuarios que se registren desde la página tendrán rol "user".
• Solo admin y arbitro tienen acceso a /admin y /moderator.
• Puedes cambiar passwords después desde Supabase Auth.

═══════════════════════════════════════════════════════════════════

SI NECESITAS CAMBIAR CONTRASEÑA DESPUÉS:

1. Ve a Supabase → Authentication → Users
2. Haz clic en el usuario
3. Encuentra el campo Password
4. Cambia y guarda

═══════════════════════════════════════════════════════════════════

¿DUDAS?

Si el SQL da error, probablemente sea porque:
❌ Los usuarios no existen en auth.users → Asegúrate de crearlos PRIMERO
❌ El SQL tiene errores de sintaxis → Copia TODO el contenido exactamente
❌ Base de datos no tiene las tablas → Ejecuta SETUP-COMPLETO.sql primero

═══════════════════════════════════════════════════════════════════

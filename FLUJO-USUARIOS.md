📊 FLUJO DE USUARIOS - CÓMO FUNCIONA TODO
═══════════════════════════════════════════════════════════════════

🔵 ESTADO INICIAL (Cuando comienzas)
───────────────────────────────────
  Supabase Auth (auth.users): VACÍO
  Base de Datos (public.users): VACÍO

🟢 DESPUÉS DE CREAR ADMIN Y ARBITRO
────────────────────────────────────

PASO 1️⃣ - Crear en Supabase Auth (TÚ HACES ESTO MANUALMENTE)
┌─────────────────────────────────────────────────────────┐
│ Supabase Auth (auth.users):                             │
├─────────────────────────────────────────────────────────┤
│ 1. admin@busfare.com → Password: TÚ DECIDES            │
│ 2. arbitro@busfare.com → Password: TÚ DECIDES          │
└─────────────────────────────────────────────────────────┘

PASO 2️⃣ - Ejecutar SQL (para darles roles)
┌─────────────────────────────────────────────────────────┐
│ Base de Datos (public.users):                           │
├─────────────────────────────────────────────────────────┤
│ admin_user  | admin@busfare.com | role: admin       │
│ arbitro_user| arbitro@busfare.com| role: moderator  │
└─────────────────────────────────────────────────────────┘

✅ RESULTADO: Puedes hacer LOGIN con tus dos cuentas

═══════════════════════════════════════════════════════════════════

🔄 CUANDO ALGUIEN SE REGISTRA EN TU PÁGINA
────────────────────────────────────────────
Usuario nuevo rellena el formulario de Register:

  Username:   MiNombre
  Email:      mi@email.com
  Password:   MiPassword123

┌─────────────────────────────────────────────────────────┐
│ Al presionar "Crear Cuenta":                            │
├─────────────────────────────────────────────────────────┤
│ 1. Se crea en auth.users AUTOMÁTICAMENTE               │
│ 2. Se crea en public.users AUTOMÁTICAMENTE              │
│ 3. Se asigna role: "user"                               │
│ 4. Se asigna tokens: 100 (inicial)                      │
│ 5. Se marca: email_verified: false                      │
│    (Hasta que verifique su email)                       │
└─────────────────────────────────────────────────────────┘

✅ RESULTADO: El usuario ya puede hacer LOGIN automáticamente

═══════════════════════════════════════════════════════════════════

📋 TABLA FINAL (Después de todo)
─────────────────────────────────

public.users tendrá:

┌──────────────┬──────────────────────┬────────────┬────────┐
│ username     │ email                │ role       │ tokens │
├──────────────┼──────────────────────┼────────────┼────────┤
│ admin_user   │ admin@busfare.com    │ admin      │ 99999  │
│ arbitro_user │ arbitro@busfare.com  │ moderator  │ 50000  │
│ MiNombre     │ mi@email.com         │ user       │ 100    │
│ JuanGamer    │ juan@outlook.com     │ user       │ 100    │
│ ... más      │ ... usuarios         │ user       │ 100    │
└──────────────┴──────────────────────┴────────────┴────────┘

═══════════════════════════════════════════════════════════════════

🔐 ACCESO A PANELES ESPECIALES
───────────────────────────────

Role "admin" → Acceso a: /admin
  Login con: admin@busfare.com
  Puede: Ver todos usuarios, editar datos, borrar usuarios, etc.

Role "moderator" → Acceso a: /moderator
  Login con: arbitro@busfare.com
  Puede: Moderar, revisar disputas, validar resultados, etc.

Role "user" → Acceso a: Todo lo normal
  Registro automático
  Puede: Jugar, apostar, participar en matches, etc.

═══════════════════════════════════════════════════════════════════

🎯 RESUMEN VISUAL
─────────────────

      TÚ HACES ESTO              SISTEMA HACE ESTO AUTOMÁTICO
      ─────────────              ──────────────────────────────

1️⃣   Creas admin y arbitro       ✓ Se guardan en auth.users
     en Supabase Auth            ✓ Se guardan en public.users
                                 ✓ Se asignan roles

2️⃣   Alguien se registra         ✓ Se crea en auth.users
     desde tu página             ✓ Se crea en public.users
                                 ✓ Role = "user"

3️⃣   Usuario hace LOGIN          ✓ Verifica credenciales
                                 ✓ Crea sesión
                                 ✓ Carga datos en la app

═══════════════════════════════════════════════════════════════════

⚠️ MUY IMPORTANTE - LA CONTRASEÑA

NO EXISTIMOS NOSOTROS TU CONTRASEÑA, LAS DECIDES TÚ.

Cuando creas el usuario en Supabase Auth, TÚ ESTABLECES la contraseña.
Ejemplos que puedes usar:

  Email: admin@busfare.com
  Password: Admin@123456  ← TÚ DECIDES ESTO
  
O puedes usar:
  Password: MiContraseñaSuperSecreta123!
  Password: 1234567890
  Lo que TÚ quieras

LO IMPORTANTE: QUE LA RECUERDES PARA PODER HACER LOGIN

═══════════════════════════════════════════════════════════════════

✨ SISTEMA DE REGISTRO AUTOMÁTICO
──────────────────────────────────

El código de tu aplicación (en db.js) ya está configurado para:

✓ Crear usuarios en auth.users
✓ Crear usuarios en public.users
✓ Asignar roles automáticos
✓ Inicializar tokens
✓ Crear avatar avatar automático
✓ Verificar email

TODO OCURRE AUTOMÁTICAMENTE. TÚ NO NECESITAS HACER NADA ESPECIAL.

═══════════════════════════════════════════════════════════════════

📍 ARCHIVOS RELEVANTES
──────────────────────

src/lib/db.js
  → Función: register() - Crea usuarios automáticamente
  → Función: login() - Verifica credenciales

src/lib/supabase.js
  → Configuración conexión a Supabase
  → auth.users (Autenticación)

SETUP-COMPLETO.sql
  → Script SQL que crea todas las tablas
  → Incluye triggers que auto-crean relaciones

═══════════════════════════════════════════════════════════════════

¿PREGUNTAS?

P: ¿Qué password pongo al crear admin?
R: LA QUE TÚ QUIERAS. Ejemplo: Admin@123456 o MiPassword2026!

P: ¿Se crea el usuario inmediatamente después de registrarse?
R: Sí. Cuando presiona "Crear Cuenta", se crea en las 2 BD automaticamente.

P: ¿Puedo cambiar password después?
R: Sí. En Supabase Auth → Users → Usuario → Edit Password

P: ¿Qué pasa con los tokens de nuevos usuarios?
R: Se les da 100 tokens inicialmente (configurable en db.js)

═══════════════════════════════════════════════════════════════════

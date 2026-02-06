🎯 RESPUESTAS DIRECTAS A TUS 3 PREGUNTAS PRINCIPALES
═══════════════════════════════════════════════════════════════════

❓ PREGUNTA 1: ¿Cuál es la contraseña de mi usuario admin?
═══════════════════════════════════════════════════════════════════

✅ RESPUESTA: TÚ DECIDES LA CONTRASEÑA

No viene predefinida. Cuando creas el usuario en Supabase, TÚ 
estableces qué contraseña quieres usar.

📝 CÓMO:
1. Ve a: https://app.supabase.com
2. Authentication → Users → "Create new user"
3. Rellena:
   Email: admin@busfare.com
   Password: AQUÍ DECIDES (ej: Admin@123456)
4. Haz clic: "Create user"
5. GUARDA tu contraseña en un lugar seguro

✅ EJEMPLO:
   Email: admin@busfare.com
   Contraseña: MyStrongPass2026!

Eso es lo que usarás para hacer LOGIN desde tu página.

═══════════════════════════════════════════════════════════════════

❓ PREGUNTA 2: La página no debe tener usuarios, solo admin/arbitro
═══════════════════════════════════════════════════════════════════

✅ RESPUESTA: CORRECTO, ESO ES LO QUE TIENES AHORA

Estado inicial:
  Supabase Auth: VACÍO (sin usuarios)
  public.users: VACÍO (sin usuarios)

Qué TÚ HACES manualmente:
  1. Creas admin@busfare.com en Supabase Auth
  2. Creas arbitro@busfare.com en Supabase Auth
  3. Ejecutas el SQL para darles roles
     → RESULTADO: 2 usuarios en total en la BD

public.users quedará así:
┌──────────────┬────────────────────┬───────────┐
│ username     │ email              │ role      │
├──────────────┼────────────────────┼───────────┤
│ admin_user   │ admin@busfare.com  │ admin     │
│ arbitro_user │ arbitro@busfare.com│ moderator │
└──────────────┴────────────────────┴───────────┘

SIN OTROS USUARIOS.
La página empieza limpia, solo con estos 2.

═══════════════════════════════════════════════════════════════════

❓ PREGUNTA 3: Los demás usuarios se crean en la BD cuando registren
═══════════════════════════════════════════════════════════════════

✅ RESPUESTA: EXACTO, OCURRE AUTOMÁTICAMENTE

Usuario va a tu página → Hace clic en "Crear Cuenta"
  ↓
Rellena formulario (nombre, email, contraseña)
  ↓
Hace clic en "Crear Cuenta"
  ↓
EL CÓDIGO AUTOMÁTICAMENTE:
  ✓ Crea usuario en auth.users
  ✓ Crea registro en public.users
  ✓ Asigna role: "user"
  ✓ Asigna tokens: 100
  ✓ Lo hace LOGIN automático
  ↓
✅ Usuario ya está en la BD y puede empezar a jugar

public.users quedará así (después de que varios se registren):
┌──────────────┬──────────────────┬──────┐
│ username     │ email            │ role │
├──────────────┼──────────────────┼──────┤
│ admin_user   │ admin@busfare.com│ admin│
│ arbitro_user │ arbitro@busf...  │ mod  │
│ Juan123      │ juan@gmail.com   │ user │ ← AUTO
│ CarlosGamer  │ carlos@yahoo.es  │ user │ ← AUTO
│ MariaPro     │ maria@outlook.com│ user │ ← AUTO
└──────────────┴──────────────────┴──────┘

TÚ NO HACES NADA especial. Los usuarios se crean solos cuando
se registran desde tu página.

═══════════════════════════════════════════════════════════════════

📊 FLUJO VISUAL COMPLETO
─────────────────────────

INICIO
  ↓
┌─────────────────────────────────┐
│ TÚ HACES ESTO (1 sola vez)      │
├─────────────────────────────────┤
│ 1. Crear admin@busfare.com      │
│ 2. Crear arbitro@busfare.com    │
│ 3. Ejecutar SQL                 │
│    → 2 usuarios en la BD        │
└─────────────────────────────────┘
  ↓
┌─────────────────────────────────┐
│ EL SISTEMA HACE ESTO (AUTOMÁTICO)│
├─────────────────────────────────┤
│ Usuario hace REGISTER               │
│   → Crea en auth.users          │
│   → Crea en public.users        │
│   → role = "user"               │
│   → tokens = 100                │
│   → Lo hace LOGIN               │
└─────────────────────────────────┘
  ↓
┌─────────────────────────────────┐
│ RESULTADO EN LA BD              │
├─────────────────────────────────┤
│ admin + arbitro + usuarios      │
│ registrados automáticamente     │
└─────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

✅ PASOS QUE DEBES HACER (EN ORDEN)
────────────────────────────────────

1️⃣  Crear admin en Supabase Auth
    Email: admin@busfare.com
    Password: LA QUE TÚ DECIDAS

2️⃣  Crear arbitro en Supabase Auth
    Email: arbitro@busfare.com
    Password: LA QUE TÚ DECIDAS

3️⃣  Ejecutar SQL
    Supabase → SQL Editor
    Copiar: CREAR-USUARIOS-ADMIN-ARBITRO.sql
    Ejecutar

4️⃣  Verificar
    Data Editor → users table
    Deberían estar solo admin y arbitro

5️⃣  Configurar .env local
    VITE_SUPABASE_URL=...
    VITE_SUPABASE_ANON_KEY=...

6️⃣  Probar en local
    npm install
    npm run dev
    Login con admin@busfare.com

✅ LISTO, todo funciona automáticamente ahora

═══════════════════════════════════════════════════════════════════

📚 DOCUMENTACIÓN DE REFERENCIA
──────────────────────────────

Archivo: CREAR-USUARIOS-PASO-A-PASO.md
  → Guía detallada con imágenes mentales paso a paso

Archivo: FLUJO-USUARIOS.md
  → Diagrama visual completo del flujo

Archivo: REGISTRO-AUTOMATICO.md
  → Cómo y por qué ocurre automáticamente

Archivo: CONTRASENA-ADMIN.md
  → Info específica sobre la contraseña

═══════════════════════════════════════════════════════════════════

🎯 RESUMEN EN 3 PUNTOS
──────────────────────

1. CONTRASEÑA ADMIN → TÚ LA DECIDES cuando creas el usuario
2. INICIO → Solo 2 usuarios (admin + arbitro) creados por ti
3. NUEVOS USUARIOS → Se crean automáticamente cuando se registran

═══════════════════════════════════════════════════════════════════

❓ ¿DUDAS?

P: ¿Si no hago nada, la página empieza vacía?
R: Sí. Empieza totalmente vacía. Solo tú agregas admin y arbitro.

P: ¿Cuándo se crea un usuario nuevo en la BD?
R: Cuando hace clic en "Crear Cuenta" desde /register

P: ¿Debo crear manualmente los nuevos usuarios?
R: NO. Se crean automáticamente. Tú solo ves cómo aparecen en la BD.

P: ¿Qué password pongo al crear admin?
R: LA QUE DECIDAS. Puede ser Admin@123456 o lo que quieras.

═══════════════════════════════════════════════════════════════════

🚀 AHORA PUEDES:

1. Crear admin y arbitro en Supabase
2. Ejecutar el SQL
3. Deployar en Vercel
4. Los usuarios se registran automáticamente
5. Tu BD crece automáticamente

TODO LISTO ✅

═══════════════════════════════════════════════════════════════════

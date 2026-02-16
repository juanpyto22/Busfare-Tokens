✅ REGISTRO AUTOMÁTICO - CÓMO LOS USUARIOS SE CREAN EN LA BD
═══════════════════════════════════════════════════════════════════

📌 RESUMEN EJECUTIVO
────────────────────

✓ La página NO tendrá usuarios por defecto (empieza vacía)
✓ Solo TÚ creas admin y arbitro manualmente
✓ Los demás usuarios se crean AUTOMÁTICAMENTE cuando se registran
✓ TODO ocurre automáticamente, no necesitas hacer nada especial

═══════════════════════════════════════════════════════════════════

🔄 CÓMO FUNCIONA EL REGISTRO AUTOMÁTICO
─────────────────────────────────────────

ANTES (Estado inicial):
┌─────────────────────────────┐
│ Base de Datos               │
├─────────────────────────────┤
│ auth.users:   VACÍO         │
│ public.users: VACÍO         │
│                             │
│ (Solo admin y arbitro si    │
│  los creaste manualmente)   │
└─────────────────────────────┘

CUANDO ALGUIEN HACE CLIC EN "CREAR CUENTA":

Usuario rellena el formulario de registro en /register:
┌─────────────────────────────┐
│ Nombre de Usuario:  Juan123 │
│ Email:              j@gmail │
│ Contraseña:         Pass123 │
│ Clic en: CREAR CUENTA       │
└─────────────────────────────┘

El CÓDIGO AUTOMÁTICAMENTE:
1️⃣  Crea usuario en auth.users
    └─ email: j@gmail.com
    └─ password: Pass123 (hasheada/encriptada)

2️⃣  Crea registro en public.users
    └─ id: (mismo que auth.users)
    └─ username: Juan123
    └─ email: j@gmail.com
    └─ role: "user" (asignado automáticamente)
    └─ tokens: 100 (tokens iniciales)
    └─ email_verified: false
    └─ avatar: (generado automático)
    └─ created_at: fecha actual

3️⃣  Hace LOGIN automático
    └─ Sesión creada
    └─ Redirige a /verify-email

DESPUÉS:
┌─────────────────────────────────────┐
│ Base de Datos (public.users)        │
├──────────────┬──────────┬──────┬────┤
│ username     │ email    │ role │ tk │
├──────────────┼──────────┼──────┼────┤
│ admin_user   │ adm...   │ adm  │999 │
│ arbitro_user │ arb...   │ mod  │500 │
│ Juan123      │ j@gm...  │ user │100 │ ← NUEVO
└──────────────┴──────────┴──────┴────┘

✅ El usuario ya puede jugar, apostar, etc.

═══════════════════════════════════════════════════════════════════

🎯 DÓNDE OCURRE LA MAGIA (El código)
────────────────────────────────────

Archivo: src/lib/db.js
Función: register()

Código simplificado:

```javascript
register: async (email, password, username) => {
  // 1. Crear en auth
  const authData = await supabase.auth.signUp({
    email,
    password
  })
  
  // 2. Crear en public.users (AUTOMÁTICO)
  await supabase.from('users').insert({
    id: authData.user.id,
    username,
    email,
    role: 'user',           ← Rol por defecto
    tokens: 100,            ← Tokens iniciales
    email_verified: false
  })
  
  // 3. Hacer login automático
  await db.login(email, password)
  
  return userData
}
```

═══════════════════════════════════════════════════════════════════

📋 DETALLES TÉCNICOS
════════════════════

CUANDO SE REGISTRA UN USUARIO, ESTAS COSAS SUCEDEN:

1. Validación
   ✓ Email no existe
   ✓ Username no existe
   ✓ Contraseña tiene mínimo 8 caracteres

2. Creación en Supabase Auth
   ✓ Email y password guardan
   ✓ Password se hashea (seguro)
   ✓ Genera user ID único

3. Creación en public.users
   ✓ Mismo ID que auth
   ✓ Role = "user"
   ✓ Tokens = 100
   ✓ Avatar autogenerado
   ✓ Email verificado = false

4. Verificación de Email (envío)
   ✓ Se envía link a su email
   ✓ Al hacer clic, verifica email
   ✓ Accede a beneficios verificados

5. Auto Login
   ✓ Sesión creada automática
   ✓ Usuario ve inicio de sesión
   ✓ Redirige a /verify-email

═══════════════════════════════════════════════════════════════════

✨ CARACTERÍSTICAS DEL REGISTRO AUTOMÁTICO
─────────────────────────────────────────

✓ Valida que email no exista
✓ Valida que username no exista
✓ Hashea la contraseña (segura)
✓ Crea registro en BD automáticamente
✓ Asigna rol "user" automáticamente
✓ Da 100 tokens iniciales
✓ Genera avatar automático
✓ Envía email de verificación
✓ Hace login automático
✓ Guarda sesión en localStorage

═══════════════════════════════════════════════════════════════════

📊 TABLA DESPUÉS DE ALGUNOS REGISTROS
──────────────────────────────────────

public.users después de que 3 usuarios se registren:

┌──────────────┬─────────────────┬────────────┬────────┐
│ username     │ email           │ role       │ tokens │
├──────────────┼─────────────────┼────────────┼────────┤
│ admin_user   │ admin@busfare   │ admin      │ 99999  │
│ arbitro_user │ arbitro@busfare │ moderator  │ 50000  │
│ Juan123      │ juan@gmail.com  │ user       │ 100    │ ← Auto
│ CarlosGamer  │ carlos@yahoo.es │ user       │ 100    │ ← Auto
│ MariaPro     │ maria@hotmail   │ user       │ 100    │ ← Auto
└──────────────┴─────────────────┴────────────┴────────┘

═══════════════════════════════════════════════════════════════════

❌ QUÉ NO PASA
──────────────

Estos usuarios NO se crean manualmente:
  ✗ No necesitas añadirlos por SQL
  ✗ No necesitas crearlos en Supabase Auth manualmente
  ✗ No necesitas asignar roles manualmente
  ✗ No necesitas generar tokens manualmente

TODO OCURRE AUTOMÁTICAMENTE

═══════════════════════════════════════════════════════════════════

✅ CHECKLIST - ESTADO INICIAL CORRECTO
──────────────────────────────────────

⬜ Proyecto Supabase creado
⬜ Tablas creadas (ejecutar SETUP-COMPLETO.sql)
⬜ Usuario admin creado en Supabase Auth (TÚ)
⬜ Usuario arbitro creado en Supabase Auth (TÚ)
⬜ SQL ejecutado (CREAR-USUARIOS-ADMIN-ARBITRO.sql)
⬜ .env configurado con credenciales de Supabase
⬜ npm install ejecutado
⬜ npm run dev funcionando

✅ LISTO PARA COMENZAR

═══════════════════════════════════════════════════════════════════

🎯 FLUJO COMPLETO DE INICIO A FIN
──────────────────────────────────

INICIO:
1. Base de datos vacía (public.users: 0 usuarios)

FASE 1 - PREPARACIÓN (TÚ):
1. Crear admin@busfare.com en Supabase Auth
2. Crear arbitro@busfare.com en Supabase Auth
3. Ejecutar SQL para darles roles
   → Resultado: 2 usuarios en public.users

FASE 2 - USUARIOS REGISTRADOS (AUTOMÁTICO):
1. Usuarios llegan a tu página
2. Hacen clic en "Crear Cuenta"
3. Rellenan formulario
4. Hacen clic en "Crear Cuenta"
   → Resultado: Nuevo usuario en public.users automáticamente
              Role: "user"
              Tokens: 100

FASE 3 - EN PRODUCCIÓN:
1. Página en Vercel
2. Usuarios reales se registran
3. Base de datos crece automáticamente
4. Tú solo administras desde /admin

═══════════════════════════════════════════════════════════════════

¿PREGUNTAS?

P: ¿Quién crea los usuarios normales (no admin/arbitro)?
R: Ellos mismos. Se registran desde el formulario de /register

P: ¿Se crean automáticamente en auth y public.users?
R: Sí, ambas ocurren automáticamente en el mismo proceso

P: ¿Qué pasa si alguien usa un email que ya existe?
R: El sistema rechaza el registro (error "Email already exists")

P: ¿Todos los nuevos usuarios comienzan con 100 tokens?
R: Sí. (Puedes cambiar esto en src/lib/db.js si lo necesitas)

P: ¿Puedo cambiar el rol de un usuario después?
R: Sí, en Supabase → Data Editor → public.users → Editar rol

═══════════════════════════════════════════════════════════════════

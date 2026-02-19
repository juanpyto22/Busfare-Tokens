# 🚀 Checklist de Despliegue a Producción

## 📦 Lo que YA TIENES (Actualizado)
- ✅ Frontend con React + Vite
- ✅ Backend con Express + Stripe
- ✅ Sistema de autenticación con **Supabase Auth**
- ✅ **Base de datos real con Supabase** (PostgreSQL)
- ✅ Integración de pagos con Stripe
- ✅ UI completa con componentes
- ✅ Sistema de matches (migrado a Supabase)
- ✅ Panel de administración
- ✅ Chat global

---

## 📌 PRE-DESPLIEGUE

### 1️⃣ Base de Datos - Ejecutar Migración SQL
- [ ] **Ejecutar migración SQL en Supabase**
  - Archivo: `supabase-matches-migration.sql`
  - Acción: Copiar y pegar en Supabase SQL Editor → Execute
  - Verifica: `SELECT * FROM matches LIMIT 1;` debe mostrar columnas metadata, player1_ready, player2_ready

### 2️⃣ Variables de Entorno
- [ ] **Configurar en plataforma de hosting (Vercel/Netlify)**
  ```
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_STRIPE_PUBLIC_KEY (usar pk_live_... en producción)
  VITE_API_URL
  ```

### 3️⃣ Row Level Security (RLS)
- [ ] **Habilitar RLS en tabla `matches`**
  ```sql
  ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
  ```
- [ ] **Crear política de lectura**
  ```sql
  CREATE POLICY "Anyone can view matches" ON matches
      FOR SELECT TO authenticated USING (true);
  ```
- [ ] **Crear política de creación**
  ```sql
  CREATE POLICY "Users can create matches" ON matches
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = player1_id);
  ```
- [ ] **Crear política de actualización**
  ```sql
  CREATE POLICY "Players can update matches" ON matches
      FOR UPDATE TO authenticated
      USING (auth.uid() = player1_id OR auth.uid() = player2_id);
  ```

### 4️⃣ CORS
- [ ] **Configurar dominio en Supabase**
  - Settings → API → CORS Origins
  - Agregar: `https://tu-dominio.com`

---

## 📌 DESPLIEGUE

### Build
- [ ] **Build local exitoso**
  ```bash
  npm run build
  ```
- [ ] **Sin errores de TypeScript/ESLint**

### Deploy
- [ ] **Opción A - Vercel (Recomendado)**
  1. Conectar GitHub repo
  2. Build command: `npm run build`
  3. Output directory: `dist`
  4. Añadir variables de entorno
  
- [ ] **Opción B - Netlify**
  1. Conectar GitHub repo
  2. Build command: `npm run build`  
  3. Publish directory: `dist`

---

## 📌 POST-DESPLIEGUE - TESTING

### Test 1: Autenticación
- [ ] Registro de nuevo usuario funciona
- [ ] Login funciona
- [ ] Session se mantiene al refrescar
- [ ] Logout funciona

### Test 2: Creación de Match (Usuario A)
- [ ] Abrir app en navegador 1
- [ ] Iniciar sesión como Usuario A
- [ ] Click en "CREAR PARTIDA"
- [ ] Configurar:
  - Formato: 1v1
  - Modo: Realistic
  - Región: EU o NAE
  - Plataforma: PC
  - Tokens: 0.5
- [ ] Click "CREAR PARTIDA"
- [ ] ✅ Ver toast: "Match Creado"
- [ ] ✅ Ver match en lista de "Partidas Disponibles"

### Test 3: Ver Match (Usuario B - CRÍTICO)
- [ ] Abrir app en navegador 2 (o modo incógnito)
- [ ] Iniciar sesión como Usuario B (diferente)
- [ ] Ir a "Partidas"
- [ ] ✅ **Ver el match creado por Usuario A en lista**
- [ ] ✅ Match muestra botón "JOIN MATCH"

### Test 4: Unirse a Match (Usuario B)
- [ ] Click en "JOIN MATCH"
- [ ] ✅ Redirige a página del match
- [ ] ✅ Ver "Slot Vacío" ahora muestra "Usuario B"
- [ ] **En navegador 1 (Usuario A):**
  - [ ] ✅ Refrescar y ver que Usuario B se unió

### Test 5: Sistema Ready
- [ ] **Usuario A:** Click en botón "Listo"
  - [ ] ✅ Botón cambia a verde
  - [ ] ✅ Tokens descontados
- [ ] **Usuario B:** Click en botón "Listo"
  - [ ] ✅ Toast: "¡Match iniciado! Ambos jugadores están listos"
  - [ ] ✅ Match desaparece de "Partidas Disponibles"
  - [ ] ✅ Match aparece en "Partidas en Curso"

### Test 6: Verificación en Base de Datos
- [ ] Abrir Supabase → Table Editor → matches
- [ ] ✅ Ver match con:
  - status = 'in_progress' (si ambos listos)
  - player1_id = UUID Usuario A
  - player2_id = UUID Usuario B
  - player1_ready = true
  - player2_ready = true

---

## 📌 MONITOREO

### Logs de Aplicación (DevTools → Console)
```
✅ === MATCH CREADO EXITOSAMENTE ===
✅ === OBTENIENDO MATCHES DE SUPABASE ===
✅ Matches obtenidos de Supabase: X
✅ Matches disponibles (pending con espacio): X
```

**NO debe aparecer:**
```
❌ ERROR EN SUPABASE
❌ usando localStorage fallback
```

---

## 📌 TROUBLESHOOTING

### "Match no aparece para otros usuarios"
1. [ ] ¿Se creó en Supabase? → Table Editor → matches
2. [ ] ¿Consola muestra "MATCH CREADO EXITOSAMENTE"?
3. [ ] ¿RLS permite SELECT? → Política de lectura habilitada
4. [ ] ¿status='pending' y player2_id=NULL?

### "Error al crear match"
1. [ ] ¿Usuario autenticado?
2. [ ] ¿Columna metadata existe? → Migración ejecutada
3. [ ] ¿RLS permite INSERT?

### "No se puede unir"
1. [ ] ¿player2_id es NULL?
2. [ ] ¿Status es 'pending'?
3. [ ] ¿RLS permite UPDATE?

---

## ✅ CHECKLIST FINAL

### Funcionalidad Core
- [ ] ✅ Crear match funciona
- [ ] ✅ **Ver matches (todos los usuarios)** ← Crítico
- [ ] ✅ Unirse a match funciona
- [ ] ✅ Sistema ready funciona
- [ ] ✅ Auto-start funciona

### Seguridad
- [ ] ✅ RLS habilitado en todas las tablas
- [ ] ✅ Solo usuarios autenticados pueden crear
- [ ] ✅ Solo jugadores del match pueden actualizar

### Performance
- [ ] ✅ Matches se actualizan cada 3 segundos
- [ ] ✅ Trigger DB para auto-start

---

## 🎉 ¡PRODUCCIÓN LISTA!

Si todos los checkboxes están marcados, tu aplicación está lista para funcionar en un dominio real con múltiples usuarios concurrentes.

**Recursos:**
- [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) - Guía detallada
- [supabase-matches-migration.sql](./supabase-matches-migration.sql) - Script de migración

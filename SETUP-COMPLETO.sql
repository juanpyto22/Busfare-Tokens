-- =============================================
-- SCRIPT COMPLETO - RESETEAR Y CREAR TODO DESDE CERO
-- Copia TODO este archivo y pégalo en Supabase SQL Editor
-- Luego haz click en "Run" y espera 1 minuto
-- =============================================

-- ============================================= 
-- PASO 1: ELIMINAR TODO LO EXISTENTE
-- =============================================

-- Eliminar políticas RLS
DROP POLICY IF EXISTS "Permitir lectura a todos" ON public.users;
DROP POLICY IF EXISTS "Permitir actualización propia" ON public.users;
DROP POLICY IF EXISTS "Permitir inserción" ON public.users;
DROP POLICY IF EXISTS "allow_read_all_users" ON public.users;
DROP POLICY IF EXISTS "allow_insert_own_user" ON public.users;
DROP POLICY IF EXISTS "allow_update_own_user" ON public.users;
DROP POLICY IF EXISTS "allow_delete_by_admin" ON public.users;

-- Eliminar triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Eliminar funciones
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_online_users() CASCADE;
DROP FUNCTION IF EXISTS get_online_users() CASCADE;
DROP FUNCTION IF EXISTS get_global_stats() CASCADE;
DROP FUNCTION IF EXISTS increment_user_stats(UUID, INT, INT, INT, INT, INT) CASCADE;

-- Eliminar tablas (en orden por dependencias)
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.withdrawals CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================= 
-- PASO 2: CREAR TABLA USERS
-- =============================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    
    -- Tokens y estadísticas
    tokens INT DEFAULT 1 CHECK (tokens >= 0),
    level INT DEFAULT 1 CHECK (level >= 1),
    wins INT DEFAULT 0 CHECK (wins >= 0),
    losses INT DEFAULT 0 CHECK (losses >= 0),
    total_played INT DEFAULT 0 CHECK (total_played >= 0),
    earnings INT DEFAULT 0,
    total_earned INT DEFAULT 0,
    reputation INT DEFAULT 50 CHECK (reputation >= 0 AND reputation <= 100),
    trust_score INT DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
    
    -- Rachas
    current_streak INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    
    -- Estado
    email_verified BOOLEAN DEFAULT false,
    avatar TEXT,
    last_seen TIMESTAMPTZ DEFAULT now(),
    last_login TIMESTAMPTZ,
    banned_until TIMESTAMPTZ,
    reported_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_last_seen ON public.users(last_seen);

-- ============================================= 
-- PASO 3: CREAR OTRAS TABLAS
-- =============================================

-- Tabla: Matches
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_mode TEXT NOT NULL,
    bet_amount INT NOT NULL CHECK (bet_amount > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'disputed')),
    
    player1_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    moderator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    player1_ready BOOLEAN DEFAULT false,
    player2_ready BOOLEAN DEFAULT false,
    
    dispute_reason TEXT,
    dispute_resolved BOOLEAN DEFAULT false,
    dispute_resolution TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_player1 ON public.matches(player1_id);
CREATE INDEX idx_matches_player2 ON public.matches(player2_id);

-- Tabla: Transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'win', 'loss', 'withdrawal', 'admin_adjustment')),
    amount INT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);

-- Tabla: Withdrawals
CREATE TABLE public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    method TEXT NOT NULL,
    account_details TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_withdrawals_user ON public.withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);

-- Tabla: Chat Messages
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    deleted_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- Tabla: Reports
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolution TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_reported_user ON public.reports(reported_user_id);

-- Tabla: User Achievements
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_name TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, achievement_name)
);

-- ============================================= 
-- PASO 4: CREAR TRIGGER DE REGISTRO
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, tokens)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), 
    1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================= 
-- PASO 5: CREAR FUNCIONES RPC
-- =============================================

-- Función: Actualizar estado online
CREATE OR REPLACE FUNCTION update_online_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users 
  SET last_seen = now() 
  WHERE id = auth.uid();
END;
$$;

-- Función: Obtener usuarios online
CREATE OR REPLACE FUNCTION get_online_users()
RETURNS TABLE (
  id UUID,
  username TEXT,
  avatar TEXT,
  last_seen TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.avatar, u.last_seen
  FROM public.users u
  WHERE u.last_seen > now() - interval '5 minutes'
  ORDER BY u.last_seen DESC;
END;
$$;

-- Función: Estadísticas globales
CREATE OR REPLACE FUNCTION get_global_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM public.users),
    'onlineUsers', (SELECT COUNT(*) FROM public.users WHERE last_seen > now() - interval '5 minutes'),
    'totalMatches', COALESCE((SELECT COUNT(*) FROM matches), 0),
    'activeMatches', COALESCE((SELECT COUNT(*) FROM matches WHERE status IN ('pending', 'in_progress')), 0),
    'totalTransactions', COALESCE((SELECT COUNT(*) FROM transactions), 0),
    'totalTokensCirculating', COALESCE((SELECT SUM(tokens) FROM public.users), 0)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Función: Incrementar estadísticas de usuario
CREATE OR REPLACE FUNCTION increment_user_stats(
  p_user_id UUID,
  p_tokens INT DEFAULT 0,
  p_wins INT DEFAULT 0,
  p_losses INT DEFAULT 0,
  p_total_played INT DEFAULT 0,
  p_earnings INT DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET 
    tokens = tokens + p_tokens,
    wins = wins + p_wins,
    losses = losses + p_losses,
    total_played = total_played + p_total_played,
    earnings = earnings + p_earnings,
    total_earned = total_earned + GREATEST(p_earnings, 0),
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- ============================================= 
-- PASO 6: CONFIGURAR POLÍTICAS RLS
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Políticas para USERS
CREATE POLICY "Users: Lectura pública"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users: Actualización propia"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users: Inserción automática"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para MATCHES
CREATE POLICY "Matches: Lectura pública"
  ON public.matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Matches: Crear propio"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player1_id);

CREATE POLICY "Matches: Actualizar participantes"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id OR 
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('moderator', 'admin')));

-- Políticas para TRANSACTIONS
CREATE POLICY "Transactions: Lectura propia"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('moderator', 'admin')));

CREATE POLICY "Transactions: Inserción sistema"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para WITHDRAWALS
CREATE POLICY "Withdrawals: Lectura propia"
  ON public.withdrawals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Withdrawals: Crear propio"
  ON public.withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Withdrawals: Actualizar admin"
  ON public.withdrawals FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Políticas para CHAT
CREATE POLICY "Chat: Lectura pública"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (is_deleted = false OR 
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('moderator', 'admin')));

CREATE POLICY "Chat: Crear propio"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Chat: Eliminar moderador"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('moderator', 'admin')));

-- Políticas para REPORTS
CREATE POLICY "Reports: Lectura propia o moderador"
  ON public.reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid() OR reported_user_id = auth.uid() OR
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('moderator', 'admin')));

CREATE POLICY "Reports: Crear propio"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Reports: Actualizar moderador"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('moderator', 'admin')));

-- Políticas para ACHIEVEMENTS
CREATE POLICY "Achievements: Lectura pública"
  ON public.user_achievements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Achievements: Inserción sistema"
  ON public.user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================= 
-- PASO 7: CREAR USUARIO ADMIN
-- =============================================

DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    existing_auth_user UUID;
BEGIN
    -- Verificar si ya existe en auth.users
    SELECT id INTO existing_auth_user FROM auth.users WHERE email = 'admin@busfare.com';
    
    IF existing_auth_user IS NULL THEN
        -- Crear en auth.users
        INSERT INTO auth.users (
            instance_id, id, aud, role, email,
            encrypted_password, email_confirmed_at,
            created_at, updated_at,
            raw_app_meta_data, raw_user_meta_data,
            is_super_admin,
            confirmation_token, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            admin_uuid, 'authenticated', 'authenticated',
            'admin@busfare.com',
            crypt('Admin123!', gen_salt('bf')),
            now(), now(), now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"username":"admin"}'::jsonb,
            false, '', '', ''
        );
        
        -- Esperar al trigger
        PERFORM pg_sleep(0.5);
        
        -- Actualizar a admin
        UPDATE public.users 
        SET username = 'admin',
            role = 'admin',
            tokens = 99999,
            level = 99,
            reputation = 100,
            trust_score = 100,
            email_verified = true
        WHERE id = admin_uuid;
        
        RAISE NOTICE '✅ Admin creado: admin@busfare.com / Admin123!';
    ELSE
        -- Ya existe, solo actualizar
        UPDATE public.users 
        SET role = 'admin',
            tokens = 99999,
            level = 99,
            reputation = 100,
            trust_score = 100,
            email_verified = true
        WHERE id = existing_auth_user;
        
        RAISE NOTICE '✅ Admin actualizado: admin@busfare.com / Admin123!';
    END IF;
END $$;

-- ============================================= 
-- PASO 8: VERIFICAR TODO
-- =============================================

-- Ver usuarios
SELECT 'USUARIOS CREADOS:' as info, email, username, role, tokens 
FROM public.users 
ORDER BY role DESC, username;

-- Ver tablas
SELECT 'TABLAS CREADAS:' as info, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Ver funciones
SELECT 'FUNCIONES RPC:' as info, routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_online_users', 'get_online_users', 'get_global_stats', 'increment_user_stats', 'handle_new_user');

-- =============================================
-- ✅ COMPLETADO
-- =============================================
-- Base de datos lista para usar
-- Login: admin@busfare.com / Admin123!
-- =============================================

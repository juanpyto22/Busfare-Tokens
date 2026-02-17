-- Supabase Database Schema
-- Ejecuta este SQL en tu proyecto de Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    
    -- Game stats
    tokens INTEGER NOT NULL DEFAULT 0,
    snipes INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    earnings DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_earned DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_played INTEGER NOT NULL DEFAULT 0,
    
    -- Streaks
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    
    -- Profile
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    reputation INTEGER NOT NULL DEFAULT 100,
    trust_score INTEGER NOT NULL DEFAULT 100,
    
    -- Moderation
    reported_count INTEGER NOT NULL DEFAULT 0,
    banned_until TIMESTAMP WITH TIME ZONE,
    
    -- Security
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT tokens_non_negative CHECK (tokens >= 0),
    CONSTRAINT level_positive CHECK (level > 0)
);

-- Matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Match details
    game_mode TEXT NOT NULL,
    bet_amount INTEGER NOT NULL,
    region TEXT NOT NULL,
    
    -- Players
    player1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Moderator
    moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'in_progress', 'reviewing', 'completed', 'disputed', 'cancelled')
    ),
    
    -- Evidence
    player1_screenshot TEXT,
    player2_screenshot TEXT,
    
    -- Dispute
    dispute_reason TEXT,
    dispute_resolved BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT different_players CHECK (player1_id != player2_id),
    CONSTRAINT bet_positive CHECK (bet_amount > 0)
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    type TEXT NOT NULL CHECK (
        type IN ('purchase', 'bet_win', 'bet_loss', 'withdrawal', 'refund', 'admin_adjustment')
    ),
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    
    -- Stripe details (if applicable)
    stripe_payment_intent TEXT,
    stripe_customer TEXT,
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawals table
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Withdrawal details
    amount DECIMAL(10, 2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('paypal', 'bank_transfer', 'crypto')),
    details TEXT NOT NULL, -- Email, account number, etc.
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'processing', 'completed', 'rejected')
    ),
    
    -- Admin review
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT amount_positive CHECK (amount > 0)
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message
    message TEXT NOT NULL,
    
    -- Moderation
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_reason TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_name TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_name)
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    
    -- Report details
    reason TEXT NOT NULL,
    description TEXT,
    evidence_url TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'under_review', 'resolved', 'dismissed')
    ),
    
    -- Review
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT cannot_report_self CHECK (reporter_id != reported_user_id)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_player1 ON matches(player1_id);
CREATE INDEX idx_matches_player2 ON matches(player2_id);
CREATE INDEX idx_matches_created ON matches(created_at DESC);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 50)
);

-- Team members table (many-to-many relationship)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(team_id, user_id)
);

-- Indexes for teams
CREATE INDEX idx_teams_creator ON teams(creator_id);
CREATE INDEX idx_teams_created ON teams(created_at DESC);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies (ejemplos básicos - ajustar según necesidades)

-- Users: pueden ver su propio perfil y perfiles públicos
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable" ON users
    FOR SELECT USING (true);

-- Matches: pueden ver matches en los que participan
CREATE POLICY "Users can view their matches" ON matches
    FOR SELECT USING (
        auth.uid() = player1_id 
        OR auth.uid() = player2_id 
        OR auth.uid() = moderator_id
    );

-- Transactions: solo pueden ver sus propias transacciones
CREATE POLICY "Users can view their transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Withdrawals: solo pueden ver sus propios retiros
CREATE POLICY "Users can view their withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

-- Chat: todos pueden leer mensajes
CREATE POLICY "Anyone can read chat" ON chat_messages
    FOR SELECT USING (NOT is_deleted);

-- Teams: todos pueden ver equipos
CREATE POLICY "Anyone can view teams" ON teams
    FOR SELECT USING (true);

CREATE POLICY "Users can create teams" ON teams
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Team creators can update their teams" ON teams
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Team creators can delete their teams" ON teams
    FOR DELETE USING (auth.uid() = creator_id);

-- Team Members: pueden ver membresías
CREATE POLICY "Anyone can view team members" ON team_members
    FOR SELECT USING (true);

CREATE POLICY "Team leaders can manage members" ON team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members tm 
            WHERE tm.team_id = team_members.team_id 
            AND tm.user_id = auth.uid() 
            AND tm.role = 'leader'
        )
    );

CREATE POLICY "Users can leave teams" ON team_members
    FOR DELETE USING (auth.uid() = user_id);

-- Crear usuarios admin iniciales
INSERT INTO users (email, username, role, tokens, snipes, level, experience, email_verified)
VALUES 
    ('admin@busfare.com', 'admin', 'admin', 99999, 999, 99, 99000, true),
    ('arbitro@busfare.com', 'arbitro', 'moderator', 5000, 100, 50, 50000, true);

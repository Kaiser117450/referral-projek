-- Referral System Database Schema
-- Supabase Postgres with RLS enabled

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE user_role AS ENUM ('user', 'cashier', 'admin');
CREATE TYPE code_status AS ENUM ('ACTIVE', 'USED', 'EXPIRED');
CREATE TYPE milestone_status AS ENUM ('LOCKED', 'UNLOCKED', 'CLAIMED');
CREATE TYPE referral_status AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');
CREATE TYPE redemption_status AS ENUM ('COMPLETED', 'FAILED');

-- Profiles table (users)
CREATE TABLE profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    user_role user_role DEFAULT 'user',
    points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invites table (referral invitations)
CREATE TABLE invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    max_uses INTEGER DEFAULT 10,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals table (tracking invite usage)
CREATE TABLE referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    invitee_email TEXT NOT NULL,
    invite_id UUID REFERENCES invites(id) ON DELETE CASCADE NOT NULL,
    status referral_status DEFAULT 'PENDING',
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ephemeral codes table (single-use redemption codes)
CREATE TABLE ephemeral_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    code_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status code_status DEFAULT 'ACTIVE',
    referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redemptions table (code redemption records)
CREATE TABLE redemptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code_id UUID REFERENCES ephemeral_codes(id) ON DELETE CASCADE NOT NULL,
    cashier_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    points_awarded INTEGER NOT NULL,
    status redemption_status DEFAULT 'COMPLETED',
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones table (point thresholds)
CREATE TABLE milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestone awards table (user achievements)
CREATE TABLE milestone_awards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE NOT NULL,
    status milestone_status DEFAULT 'LOCKED',
    unlocked_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE rate_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT NOT NULL,
    max_requests INTEGER NOT NULL,
    window_ms INTEGER NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_user_role ON profiles(user_role);
CREATE INDEX idx_invites_slug ON invites(slug);
CREATE INDEX idx_invites_user_id ON invites(user_id);
CREATE INDEX idx_referrals_inviter_id ON referrals(inviter_id);
CREATE INDEX idx_referrals_invitee_email ON referrals(invitee_email);
CREATE INDEX idx_ephemeral_codes_hash ON ephemeral_codes(code_hash);
CREATE INDEX idx_ephemeral_codes_status ON ephemeral_codes(status);
CREATE INDEX idx_ephemeral_codes_expires ON ephemeral_codes(expires_at) WHERE status = 'ACTIVE';
CREATE INDEX idx_ephemeral_codes_user_id ON ephemeral_codes(user_id);
CREATE INDEX idx_redemptions_code_id ON redemptions(code_id);
CREATE INDEX idx_redemptions_cashier_id ON redemptions(cashier_id);
CREATE INDEX idx_milestone_awards_user_id ON milestone_awards(user_id);
CREATE INDEX idx_milestone_awards_status ON milestone_awards(status);
CREATE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Unique constraints
CREATE UNIQUE INDEX idx_ephemeral_codes_active_hash ON ephemeral_codes(code_hash) WHERE status = 'ACTIVE';
CREATE UNIQUE INDEX idx_milestone_awards_user_milestone ON milestone_awards(user_id, milestone_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invites_updated_at BEFORE UPDATE ON invites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired codes
CREATE OR REPLACE FUNCTION clean_expired_codes()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE ephemeral_codes 
    SET status = 'EXPIRED' 
    WHERE status = 'ACTIVE' AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to award points and check milestones
CREATE OR REPLACE FUNCTION award_points_and_check_milestones(
    p_user_id UUID,
    p_points INTEGER
)
RETURNS JSONB AS $$
DECLARE
    new_total INTEGER;
    unlocked_milestones JSONB;
BEGIN
    -- Update points
    UPDATE profiles 
    SET points = points + p_points,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    GET DIAGNOSTICS new_total = ROW_COUNT;
    
    -- Check for unlocked milestones
    INSERT INTO milestone_awards (user_id, milestone_id, status, unlocked_at)
    SELECT p_user_id, m.id, 'UNLOCKED', NOW()
    FROM milestones m
    LEFT JOIN milestone_awards ma ON ma.user_id = p_user_id AND ma.milestone_id = m.id
    WHERE m.is_active = true 
      AND ma.id IS NULL
      AND m.points_required <= (SELECT points FROM profiles WHERE id = p_user_id);
    
    -- Return unlocked milestones
    SELECT jsonb_agg(
        jsonb_build_object(
            'milestone_id', ma.milestone_id,
            'name', m.name,
            'description', m.description,
            'reward', m.reward_description
        )
    ) INTO unlocked_milestones
    FROM milestone_awards ma
    JOIN milestones m ON m.id = ma.milestone_id
    WHERE ma.user_id = p_user_id 
      AND ma.status = 'UNLOCKED'
      AND ma.unlocked_at >= NOW() - INTERVAL '1 minute';
    
    RETURN jsonb_build_object(
        'new_total_points', (SELECT points FROM profiles WHERE id = p_user_id),
        'unlocked_milestones', COALESCE(unlocked_milestones, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;

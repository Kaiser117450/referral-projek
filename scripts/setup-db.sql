-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create custom ENUM types
CREATE TYPE user_role AS ENUM ('user', 'cashier', 'admin');
CREATE TYPE code_status AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED');
CREATE TYPE referral_status AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');
CREATE TYPE redemption_status AS ENUM ('COMPLETED', 'FAILED');
CREATE TYPE milestone_status AS ENUM ('LOCKED', 'UNLOCKED', 'CLAIMED');

-- Profiles table (users)
CREATE TABLE IF NOT EXISTS profiles (
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
CREATE TABLE IF NOT EXISTS invites (
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
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    invitee_email TEXT NOT NULL,
    invite_id UUID REFERENCES invites(id) ON DELETE CASCADE NOT NULL,
    status referral_status DEFAULT 'PENDING',
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ephemeral codes table (single-use redemption codes)
CREATE TABLE IF NOT EXISTS ephemeral_codes (
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
CREATE TABLE IF NOT EXISTS redemptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code_id UUID REFERENCES ephemeral_codes(id) ON DELETE CASCADE NOT NULL,
    cashier_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    points_awarded INTEGER NOT NULL,
    status redemption_status DEFAULT 'COMPLETED',
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones table (point thresholds)
CREATE TABLE IF NOT EXISTS milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestone awards table (user achievements)
CREATE TABLE IF NOT EXISTS milestone_awards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE NOT NULL,
    status milestone_status DEFAULT 'LOCKED',
    unlocked_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT NOT NULL,
    max_requests INTEGER NOT NULL,
    window_ms INTEGER NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_invites_slug ON invites(slug);
CREATE INDEX IF NOT EXISTS idx_invites_user_id ON invites(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter_id ON referrals(inviter_id);
CREATE INDEX IF NOT EXISTS idx_referrals_invitee_email ON referrals(invitee_email);
CREATE INDEX IF NOT EXISTS idx_ephemeral_codes_hash ON ephemeral_codes(code_hash);
CREATE INDEX IF NOT EXISTS idx_ephemeral_codes_status ON ephemeral_codes(status);
CREATE INDEX IF NOT EXISTS idx_ephemeral_codes_expires ON ephemeral_codes(expires_at) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_ephemeral_codes_user_id ON ephemeral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_code_id ON redemptions(code_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_cashier_id ON redemptions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_milestone_awards_user_id ON milestone_awards(user_id);
CREATE INDEX IF NOT EXISTS idx_milestone_awards_status ON milestone_awards(status);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_ephemeral_codes_active_hash ON ephemeral_codes(code_hash) WHERE status = 'ACTIVE';
CREATE UNIQUE INDEX IF NOT EXISTS idx_milestone_awards_user_milestone ON milestone_awards(user_id, milestone_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_invites_updated_at 
    BEFORE UPDATE ON invites
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

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_key TEXT,
    p_max_requests INTEGER,
    p_window_ms INTEGER
)
RETURNS JSONB AS $$
DECLARE
    rate_limit_record RECORD;
    current_time TIMESTAMPTZ;
    window_start TIMESTAMPTZ;
    result JSONB;
BEGIN
    current_time := NOW();
    window_start := current_time - (p_window_ms || ' milliseconds')::INTERVAL;
    
    -- Get or create rate limit record
    SELECT * INTO rate_limit_record
    FROM rate_limits
    WHERE key = p_key;
    
    IF rate_limit_record IS NULL THEN
        -- Create new rate limit record
        INSERT INTO rate_limits (key, max_requests, window_ms, request_count, window_start)
        VALUES (p_key, p_max_requests, p_window_ms, 1, current_time);
        
        result := jsonb_build_object(
            'allowed', true,
            'remaining', p_max_requests - 1,
            'reset_time', current_time + (p_window_ms || ' milliseconds')::INTERVAL
        );
    ELSE
        -- Check if window has expired
        IF rate_limit_record.window_start < window_start THEN
            -- Reset window
            UPDATE rate_limits
            SET request_count = 1, window_start = current_time
            WHERE key = p_key;
            
            result := jsonb_build_object(
                'allowed', true,
                'remaining', p_max_requests - 1,
                'reset_time', current_time + (p_window_ms || ' milliseconds')::INTERVAL
            );
        ELSE
            -- Check if limit exceeded
            IF rate_limit_record.request_count >= p_max_requests THEN
                result := jsonb_build_object(
                    'allowed', false,
                    'remaining', 0,
                    'reset_time', rate_limit_record.window_start + (p_window_ms || ' milliseconds')::INTERVAL
                );
            ELSE
                -- Increment request count
                UPDATE rate_limits
                SET request_count = rate_limit_record.request_count + 1
                WHERE key = p_key;
                
                result := jsonb_build_object(
                    'allowed', true,
                    'remaining', p_max_requests - (rate_limit_record.request_count + 1),
                    'reset_time', rate_limit_record.window_start + (p_window_ms || ' milliseconds')::INTERVAL
                );
            END IF;
        END IF;
    END IF;
    
    RETURN result;
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

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_action TEXT,
    p_details JSONB DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_logs (user_id, action, details, ip_address)
    VALUES (p_user_id, p_action, p_details, p_ip_address)
    RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- Setup cron jobs
SELECT cron.schedule('clean-expired-codes', '* * * * *', 'SELECT clean_expired_codes();');
SELECT cron.schedule('clean-rate-limits', '0 * * * *', 'DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL ''24 hours'';');
SELECT cron.schedule('clean-audit-logs', '0 0 * * *', 'DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL ''30 days'';');

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ephemeral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Invites policies
CREATE POLICY "Users can view own invites" ON invites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own invites" ON invites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invites" ON invites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active invites by slug" ON invites
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all invites" ON invites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Referrals policies
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (inviter_id = auth.uid());

CREATE POLICY "System can create referrals" ON referrals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all referrals" ON referrals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Ephemeral codes policies
CREATE POLICY "Users can view own codes" ON ephemeral_codes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view codes from their invites" ON ephemeral_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invites 
            WHERE id = (SELECT invite_id FROM referrals WHERE id = ephemeral_codes.referral_id)
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own codes" ON ephemeral_codes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Cashiers can view codes for redemption" ON ephemeral_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_role = 'cashier'
        )
    );

CREATE POLICY "System can update codes" ON ephemeral_codes
    FOR UPDATE USING (true);

CREATE POLICY "Admins can view all codes" ON ephemeral_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Redemptions policies
CREATE POLICY "Users can view own redemptions" ON redemptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ephemeral_codes 
            WHERE id = redemptions.code_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Cashiers can view own redemptions" ON redemptions
    FOR SELECT USING (cashier_id = auth.uid());

CREATE POLICY "Cashiers can create redemptions" ON redemptions
    FOR INSERT WITH CHECK (cashier_id = auth.uid());

CREATE POLICY "Admins can view all redemptions" ON redemptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Milestones policies
CREATE POLICY "Anyone can view active milestones" ON milestones
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage milestones" ON milestones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Milestone awards policies
CREATE POLICY "Users can view own awards" ON milestone_awards
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage awards" ON milestone_awards
    FOR ALL USING (true);

CREATE POLICY "Admins can view all awards" ON milestone_awards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Rate limits policies
CREATE POLICY "System can manage rate limits" ON rate_limits
    FOR ALL USING (true);

-- Audit logs policies
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Create audit triggers
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_event(
            NEW.id,
            'INSERT',
            jsonb_build_object('table', TG_TABLE_NAME, 'new', to_jsonb(NEW))
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_event(
            NEW.id,
            'UPDATE',
            jsonb_build_object('table', TG_TABLE_NAME, 'old', to_jsonb(OLD), 'new', to_jsonb(NEW))
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_event(
            OLD.id,
            'DELETE',
            jsonb_build_object('table', TG_TABLE_NAME, 'old', to_jsonb(OLD))
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for key tables
CREATE TRIGGER audit_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_ephemeral_codes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ephemeral_codes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_redemptions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON redemptions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Anyone can view receipts" ON storage.objects
    FOR SELECT USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can upload receipts" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own receipts" ON storage.objects
    FOR UPDATE USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own receipts" ON storage.objects
    FOR DELETE USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

COMMIT;

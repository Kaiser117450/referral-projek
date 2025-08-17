-- Row Level Security (RLS) Policies
-- Enable RLS on all tables

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ephemeral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Invites policies
CREATE POLICY "Users can view own invites" ON invites
    FOR SELECT USING (inviter_id = auth.uid());

CREATE POLICY "Users can create own invites" ON invites
    FOR INSERT WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Users can update own invites" ON invites
    FOR UPDATE USING (inviter_id = auth.uid());

CREATE POLICY "Anyone can view active invites by slug" ON invites
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all invites" ON invites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Referrals policies
CREATE POLICY "Users can view referrals they made" ON referrals
    FOR SELECT USING (inviter_id = auth.uid());

CREATE POLICY "Users can view referrals where they were referred" ON referrals
    FOR SELECT USING (referred_user_id = auth.uid());

CREATE POLICY "System can create referrals" ON referrals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all referrals" ON referrals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Ephemeral codes policies
CREATE POLICY "Users can view codes they generated" ON ephemeral_codes
    FOR SELECT USING (referred_user_id = auth.uid());

CREATE POLICY "Users can view codes from their invites" ON ephemeral_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invites 
            WHERE id = invite_id AND inviter_id = auth.uid()
        )
    );

CREATE POLICY "Users can create codes for themselves" ON ephemeral_codes
    FOR INSERT WITH CHECK (referred_user_id = auth.uid());

CREATE POLICY "Cashiers can view codes for redemption" ON ephemeral_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'cashier'
        )
    );

CREATE POLICY "System can update code status" ON ephemeral_codes
    FOR UPDATE USING (true);

CREATE POLICY "Admins can view all codes" ON ephemeral_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Redemptions policies
CREATE POLICY "Users can view redemptions where they earned points" ON redemptions
    FOR SELECT USING (inviter_id = auth.uid());

CREATE POLICY "Users can view redemptions they made" ON redemptions
    FOR SELECT USING (referred_user_id = auth.uid());

CREATE POLICY "Cashiers can view redemptions they processed" ON redemptions
    FOR SELECT USING (redeemed_by = auth.uid());

CREATE POLICY "Cashiers can create redemptions" ON redemptions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'cashier'
        )
    );

CREATE POLICY "Admins can view all redemptions" ON redemptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Milestones policies
CREATE POLICY "Anyone can view active milestones" ON milestones
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage milestones" ON milestones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Milestone awards policies
CREATE POLICY "Users can view own milestone awards" ON milestone_awards
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage milestone awards" ON milestone_awards
    FOR ALL USING (true);

CREATE POLICY "Admins can view all milestone awards" ON milestone_awards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
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
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action TEXT,
    p_table_name TEXT,
    p_record_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        p_action,
        p_table_name,
        p_record_id,
        p_old_values,
        p_new_values,
        inet_client_addr(),
        current_setting('request.headers', true)::jsonb->>'user-agent'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_event('INSERT', TG_TABLE_NAME, NEW.id, NULL, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_event('UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_event('DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), NULL);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_ephemeral_codes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ephemeral_codes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_redemptions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON redemptions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_max_requests INTEGER DEFAULT 10,
    p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMPTZ;
BEGIN
    -- Clean old rate limit records
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
    
    -- Get current window start
    window_start := date_trunc('minute', NOW() - INTERVAL '1 minute');
    
    -- Get current request count
    SELECT COALESCE(SUM(request_count), 0) INTO current_count
    FROM rate_limits
    WHERE identifier = p_identifier 
      AND endpoint = p_endpoint
      AND window_start >= NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Check if limit exceeded
    IF current_count >= p_max_requests THEN
        RETURN FALSE;
    END IF;
    
    -- Insert or update rate limit record
    INSERT INTO rate_limits (identifier, endpoint, request_count, window_start)
    VALUES (p_identifier, p_endpoint, 1, date_trunc('minute', NOW()))
    ON CONFLICT (identifier, endpoint, window_start)
    DO UPDATE SET request_count = rate_limits.request_count + 1;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_ms INTEGER DEFAULT 900000
) RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMP;
BEGIN
  -- Calculate window start time
  window_start := NOW() - (p_window_ms || ' milliseconds')::INTERVAL;
  
  -- Get current count for this key in the window
  SELECT COALESCE(SUM(count), 0) INTO current_count
  FROM public.rate_limits
  WHERE key = p_key
    AND timestamp >= window_start;
  
  -- If under limit, allow request
  IF current_count < p_max_requests THEN
    -- Insert or update rate limit record
    INSERT INTO public.rate_limits (key, timestamp, count)
    VALUES (p_key, NOW(), 1)
    ON CONFLICT (key, timestamp)
    DO UPDATE SET count = rate_limits.count + 1;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits() RETURNS VOID AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE timestamp < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award points to inviter
CREATE OR REPLACE FUNCTION public.award_points_to_inviter(
  p_referral_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_inviter_id UUID;
  v_points_to_award INTEGER DEFAULT 10;
  v_current_points INTEGER;
BEGIN
  -- Get inviter ID from referral
  SELECT inviter_id INTO v_inviter_id
  FROM public.referrals
  WHERE id = p_referral_id;
  
  IF v_inviter_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get current points
  SELECT COALESCE(points, 0) INTO v_current_points
  FROM public.profiles
  WHERE id = v_inviter_id;
  
  -- Update points
  UPDATE public.profiles
  SET points = v_current_points + v_points_to_award
  WHERE id = v_inviter_id;
  
  -- Log the points award
  INSERT INTO public.audit_logs (
    user_id,
    action,
    details,
    ip_address
  ) VALUES (
    v_inviter_id,
    'POINTS_AWARDED',
    jsonb_build_object(
      'referral_id', p_referral_id,
      'points_awarded', v_points_to_award,
      'new_total', v_current_points + v_points_to_award
    ),
    NULL
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award milestones
CREATE OR REPLACE FUNCTION public.check_and_award_milestones(
  p_user_id UUID
) RETURNS TABLE(milestone_id UUID, points_awarded INTEGER) AS $$
DECLARE
  v_current_points INTEGER;
  v_milestone RECORD;
BEGIN
  -- Get current points
  SELECT COALESCE(points, 0) INTO v_current_points
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Check for milestones that haven't been awarded yet
  FOR v_milestone IN
    SELECT id, points_required, points_reward
    FROM public.milestones
    WHERE points_required <= v_current_points
      AND is_active = true
      AND id NOT IN (
        SELECT milestone_id
        FROM public.user_milestones
        WHERE user_id = p_user_id
      )
    ORDER BY points_required ASC
  LOOP
    -- Award milestone
    INSERT INTO public.user_milestones (user_id, milestone_id, achieved_at)
    VALUES (p_user_id, v_milestone.id, NOW());
    
    -- Award points
    UPDATE public.profiles
    SET points = points + v_milestone.points_reward
    WHERE id = p_user_id;
    
    -- Log milestone achievement
    INSERT INTO public.audit_logs (
      user_id,
      action,
      details,
      ip_address
    ) VALUES (
      p_user_id,
      'MILESTONE_ACHIEVED',
      jsonb_build_object(
        'milestone_id', v_milestone.id,
        'points_required', v_milestone.points_required,
        'points_rewarded', v_milestone.points_reward
      ),
      NULL
    );
    
    -- Return milestone info
    milestone_id := v_milestone.id;
    points_awarded := v_milestone.points_reward;
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

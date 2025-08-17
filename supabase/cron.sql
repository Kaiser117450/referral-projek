-- Cron Jobs for Maintenance Tasks
-- Run these in Supabase using pg_cron extension

-- Clean expired codes every minute
SELECT cron.schedule(
    'clean-expired-codes',
    '* * * * *', -- Every minute
    'SELECT clean_expired_codes();'
);

-- Clean old rate limit records every hour
SELECT cron.schedule(
    'clean-rate-limits',
    '0 * * * *', -- Every hour
    'DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL ''24 hours'';'
);

-- Clean old audit logs (keep last 90 days)
SELECT cron.schedule(
    'clean-audit-logs',
    '0 2 * * *', -- Daily at 2 AM
    'DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL ''90 days'';'
);

-- Update total referrals count daily
SELECT cron.schedule(
    'update-referral-counts',
    '0 3 * * *', -- Daily at 3 AM
    'UPDATE profiles SET total_referrals = (
        SELECT COUNT(*) FROM referrals WHERE inviter_id = profiles.id
    );'
);

-- Vacuum and analyze tables weekly
SELECT cron.schedule(
    'vacuum-analyze',
    '0 4 * * 0', -- Weekly on Sunday at 4 AM
    'VACUUM ANALYZE;'
);

-- Check for anomalies in redemptions (alert if too many in short time)
SELECT cron.schedule(
    'check-redemption-anomalies',
    '*/15 * * * *', -- Every 15 minutes
    'INSERT INTO audit_logs (action, table_name, old_values, new_values)
     SELECT 
         ''ANOMALY_CHECK'',
         ''redemptions'',
         jsonb_build_object(''time_window'', ''15_minutes'', ''count'', COUNT(*)),
         jsonb_build_object(''threshold'', 100, ''status'', CASE WHEN COUNT(*) > 100 THEN ''ALERT'' ELSE ''NORMAL'' END)
     FROM redemptions 
     WHERE created_at >= NOW() - INTERVAL ''15 minutes''
     GROUP BY 1, 2, 3, 4
     HAVING COUNT(*) > 100;'
);

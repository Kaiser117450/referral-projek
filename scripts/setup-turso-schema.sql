-- Complete Turso DB Schema for F&B Referral System
-- This script creates all necessary tables for the referral system

-- NextAuth.js required tables
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER, -- timestamp_ms
  image TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  sessionToken TEXT NOT NULL UNIQUE,
  userId TEXT NOT NULL,
  expires INTEGER NOT NULL, -- timestamp_ms
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verificationTokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires INTEGER NOT NULL, -- timestamp_ms
  PRIMARY KEY (identifier, token)
);

-- Application-specific tables
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, -- Links to users.id
  full_name TEXT,
  phone TEXT,
  user_role TEXT NOT NULL DEFAULT 'user', -- 'user', 'cashier', 'admin'
  points INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1, -- boolean
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  inviter_id TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1, -- boolean
  max_uses INTEGER DEFAULT NULL, -- null = unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (inviter_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  invite_id TEXT NOT NULL,
  inviter_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  completed_at INTEGER,
  FOREIGN KEY (invite_id) REFERENCES invites(id) ON DELETE CASCADE,
  FOREIGN KEY (inviter_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ephemeral_codes (
  id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  salt TEXT NOT NULL,
  invite_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'USED', 'EXPIRED'
  expires_at INTEGER NOT NULL, -- timestamp
  used_at INTEGER, -- timestamp
  used_by TEXT, -- cashier_id
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (invite_id) REFERENCES invites(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (used_by) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS redemptions (
  id TEXT PRIMARY KEY,
  code_id TEXT NOT NULL,
  inviter_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  points_awarded INTEGER NOT NULL,
  redeemed_by TEXT NOT NULL, -- cashier_id
  receipt TEXT, -- JSON receipt data
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (code_id) REFERENCES ephemeral_codes(id) ON DELETE CASCADE,
  FOREIGN KEY (inviter_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (redeemed_by) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'badge', -- 'badge', 'discount', 'freebie'
  reward_value TEXT, -- JSON data for reward details
  is_active INTEGER NOT NULL DEFAULT 1, -- boolean
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE IF NOT EXISTS milestone_awards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  milestone_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNLOCKED', -- 'UNLOCKED', 'CLAIMED'
  claimed_at INTEGER, -- timestamp
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE,
  UNIQUE(user_id, milestone_id)
);

-- Analytics tables for F&B insights
CREATE TABLE IF NOT EXISTS daily_stats (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE, -- YYYY-MM-DD format
  total_redemptions INTEGER NOT NULL DEFAULT 0,
  total_points_awarded INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  new_signups INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points);
CREATE INDEX IF NOT EXISTS idx_invites_inviter_id ON invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invites_invite_code ON invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter_id ON referrals(inviter_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_ephemeral_codes_status ON ephemeral_codes(status);
CREATE INDEX IF NOT EXISTS idx_ephemeral_codes_expires_at ON ephemeral_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_redemptions_inviter_id ON redemptions(inviter_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_redeemed_by ON redemptions(redeemed_by);
CREATE INDEX IF NOT EXISTS idx_redemptions_created_at ON redemptions(created_at);
CREATE INDEX IF NOT EXISTS idx_milestone_awards_user_id ON milestone_awards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

-- Insert default milestones for F&B system
INSERT OR IGNORE INTO milestones (id, title, description, points_required, reward_type, reward_value) VALUES
('milestone_1', 'First Referral', 'Complete your first successful referral', 1, 'badge', '{"badge_name": "Referral Rookie", "color": "#bronze"}'),
('milestone_2', 'Social Butterfly', 'Earn 5 points through referrals', 5, 'discount', '{"discount_percent": 10, "description": "10% off next purchase"}'),
('milestone_3', 'Community Builder', 'Earn 10 points through referrals', 10, 'freebie', '{"item": "Free appetizer", "description": "Complimentary appetizer on your next visit"}'),
('milestone_4', 'Referral Champion', 'Earn 25 points through referrals', 25, 'discount', '{"discount_percent": 20, "description": "20% off next purchase"}'),
('milestone_5', 'Loyalty Legend', 'Earn 50 points through referrals', 50, 'freebie', '{"item": "Free main course", "description": "Complimentary main course on your next visit"}');

-- Create trigger to update profiles.updated_at on changes
CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
  AFTER UPDATE ON profiles
  FOR EACH ROW
BEGIN
  UPDATE profiles SET updated_at = strftime('%s', 'now') * 1000 WHERE id = NEW.id;
END;

-- Create trigger to update invites.updated_at on changes
CREATE TRIGGER IF NOT EXISTS update_invites_updated_at
  AFTER UPDATE ON invites
  FOR EACH ROW
BEGIN
  UPDATE invites SET updated_at = strftime('%s', 'now') * 1000 WHERE id = NEW.id;
END;

-- Create trigger to automatically expire codes
CREATE TRIGGER IF NOT EXISTS expire_codes
  AFTER INSERT ON ephemeral_codes
  FOR EACH ROW
  WHEN NEW.expires_at < strftime('%s', 'now') * 1000
BEGIN
  UPDATE ephemeral_codes SET status = 'EXPIRED' WHERE id = NEW.id;
END;
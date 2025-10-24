-- Turso DB Schema (libSQL compatible)

-- Table: profiles
-- Stores user information, roles, and points
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: invites
-- Referral invitation configurations
CREATE TABLE invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  usage_limit INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles (id)
);

-- Table: referrals
-- Tracks individual referral attempts
CREATE TABLE referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inviter_id TEXT NOT NULL,
  invitee_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inviter_id) REFERENCES profiles (id),
  FOREIGN KEY (invitee_id) REFERENCES profiles (id)
);

-- Table: ephemeral_codes
-- Single-use codes with 5-minute TTL
CREATE TABLE ephemeral_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles (id)
);

-- Table: redemptions
-- Records successful code redemptions
CREATE TABLE redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_id INTEGER NOT NULL,
  cashier_id TEXT NOT NULL,
  receipt TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (code_id) REFERENCES ephemeral_codes (id),
  FOREIGN KEY (cashier_id) REFERENCES profiles (id)
);

-- Table: milestones
-- Configurable achievement levels
CREATE TABLE milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  point_threshold INTEGER NOT NULL,
  reward TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: milestone_awards
-- Tracks user milestone progress
CREATE TABLE milestone_awards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  milestone_id INTEGER NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles (id),
  FOREIGN KEY (milestone_id) REFERENCES milestones (id)
);

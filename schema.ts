// schema.ts - Complete F&B Referral System Schema
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// NextAuth.js required tables
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image'),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('sessionToken').notNull().unique(),
  userId: text('userId').notNull(),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
});

export const verificationTokens = sqliteTable('verificationTokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
});

// Application-specific tables
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(), // Links to users.id
  fullName: text('full_name'),
  phone: text('phone'),
  userRole: text('user_role').notNull().default('user'), // 'user', 'cashier', 'admin'
  points: integer('points').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now()),
});

export const invites = sqliteTable('invites', {
  id: text('id').primaryKey(),
  inviterId: text('inviter_id').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  maxUses: integer('max_uses').default(null), // null = unlimited
  currentUses: integer('current_uses').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now()),
});

export const referrals = sqliteTable('referrals', {
  id: text('id').primaryKey(),
  inviteId: text('invite_id').notNull(),
  inviterId: text('inviter_id').notNull(),
  referredUserId: text('referred_user_id').notNull(),
  status: text('status').notNull().default('active'), // 'active', 'completed', 'cancelled'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

export const ephemeralCodes = sqliteTable('ephemeral_codes', {
  id: text('id').primaryKey(),
  codeHash: text('code_hash').notNull().unique(),
  salt: text('salt').notNull(),
  inviteId: text('invite_id').notNull(),
  referredUserId: text('referred_user_id').notNull(),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE', 'USED', 'EXPIRED'
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  usedBy: text('used_by'), // cashier_id
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
});

export const redemptions = sqliteTable('redemptions', {
  id: text('id').primaryKey(),
  codeId: text('code_id').notNull(),
  inviterId: text('inviter_id').notNull(),
  referredUserId: text('referred_user_id').notNull(),
  pointsAwarded: integer('points_awarded').notNull(),
  redeemedBy: text('redeemed_by').notNull(), // cashier_id
  receipt: text('receipt'), // JSON receipt data
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
});

export const milestones = sqliteTable('milestones', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  pointsRequired: integer('points_required').notNull(),
  rewardType: text('reward_type').notNull().default('badge'), // 'badge', 'discount', 'freebie'
  rewardValue: text('reward_value'), // JSON data for reward details
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
});

export const milestoneAwards = sqliteTable('milestone_awards', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  milestoneId: text('milestone_id').notNull(),
  status: text('status').notNull().default('UNLOCKED'), // 'UNLOCKED', 'CLAIMED'
  claimedAt: integer('claimed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
});

// Analytics tables for F&B insights
export const dailyStats = sqliteTable('daily_stats', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(), // YYYY-MM-DD format
  totalRedemptions: integer('total_redemptions').notNull().default(0),
  totalPointsAwarded: integer('total_points_awarded').notNull().default(0),
  uniqueUsers: integer('unique_users').notNull().default(0),
  newSignups: integer('new_signups').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
});

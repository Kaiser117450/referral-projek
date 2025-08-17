import { z } from 'zod';

// Base schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const uuidSchema = z.string().uuid('Invalid UUID format');

// User authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  inviteSlug: z.string().optional(),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
});

// Referral schemas
export const createInviteSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(50).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
});

export const updateInviteSchema = z.object({
  id: uuidSchema,
  title: z.string().min(3, 'Title must be at least 3 characters').max(100).optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isActive: z.boolean().optional(),
});

// Code generation schemas
export const generateCodeSchema = z.object({
  inviteId: uuidSchema,
  referredUserId: uuidSchema,
});

export const codeRedemptionSchema = z.object({
  code: z.string().min(6, 'Code must be at least 6 characters').max(10, 'Code must be less than 10 characters'),
  redeemedBy: uuidSchema, // cashier ID
});

// Points and milestones schemas
export const milestoneCreateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().max(500, 'Description must be less than 500 characters'),
  pointsRequired: z.number().int().positive('Points must be a positive integer'),
  rewardDescription: z.string().max(500, 'Reward description must be less than 500 characters'),
});

export const milestoneUpdateSchema = z.object({
  id: uuidSchema,
  name: z.string().min(3, 'Name must be at least 3 characters').max(100).optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  pointsRequired: z.number().int().positive('Points must be a positive integer').optional(),
  rewardDescription: z.string().max(500, 'Reward description must be less than 500 characters').optional(),
  isActive: z.boolean().optional(),
});

// Admin schemas
export const userRoleUpdateSchema = z.object({
  userId: uuidSchema,
  role: z.enum(['user', 'cashier', 'admin']),
});

export const userBanSchema = z.object({
  userId: uuidSchema,
  reason: z.string().min(10, 'Ban reason must be at least 10 characters').max(500),
  duration: z.enum(['1_day', '1_week', '1_month', 'permanent']),
});

// Rate limiting schemas
export const rateLimitSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  endpoint: z.string().min(1, 'Endpoint is required'),
  maxRequests: z.number().int().positive().default(10),
  windowMinutes: z.number().int().positive().default(1),
});

// Search and pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100),
  filters: z.record(z.string(), z.any()).optional(),
});

// API response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
});

export const successResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.any(),
  timestamp: z.string().datetime(),
});

// Code status schemas
export const codeStatusSchema = z.enum(['ACTIVE', 'USED', 'EXPIRED']);

export const ephemeralCodeSchema = z.object({
  id: uuidSchema,
  inviteId: uuidSchema,
  referredUserId: uuidSchema,
  codeHash: z.string(),
  salt: z.string(),
  expiresAt: z.string().datetime(),
  usedAt: z.string().datetime().nullable(),
  usedBy: uuidSchema.nullable(),
  status: codeStatusSchema,
  createdAt: z.string().datetime(),
});

// Redemption schemas
export const redemptionSchema = z.object({
  id: uuidSchema,
  codeId: uuidSchema,
  inviterId: uuidSchema,
  referredUserId: uuidSchema,
  pointsAwarded: z.number().int().positive(),
  receiptUrl: z.string().url().nullable(),
  redeemedBy: uuidSchema,
  createdAt: z.string().datetime(),
});

// Profile schemas
export const profileSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  fullName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  role: z.enum(['user', 'cashier', 'admin']),
  points: z.number().int().nonnegative(),
  totalReferrals: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Invite schemas
export const inviteSchema = z.object({
  id: uuidSchema,
  inviterId: uuidSchema,
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Milestone schemas
export const milestoneSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  pointsRequired: z.number().int().positive(),
  rewardDescription: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

export const milestoneAwardSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  milestoneId: uuidSchema,
  status: z.enum(['LOCKED', 'UNLOCKED', 'CLAIMED']),
  unlockedAt: z.string().datetime().nullable(),
  claimedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

// Utility functions
export const validateCode = (code: string): boolean => {
  return code.length >= 6 && code.length <= 10 && /^[A-Z0-9]+$/.test(code);
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateSlug = (slug: string): boolean => {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50;
};

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type UpdateInviteInput = z.infer<typeof updateInviteSchema>;
export type GenerateCodeInput = z.infer<typeof generateCodeSchema>;
export type CodeRedemptionInput = z.infer<typeof codeRedemptionSchema>;
export type MilestoneCreateInput = z.infer<typeof milestoneCreateSchema>;
export type MilestoneUpdateInput = z.infer<typeof milestoneUpdateSchema>;
export type UserRoleUpdateInput = z.infer<typeof userRoleUpdateSchema>;
export type UserBanInput = z.infer<typeof userBanSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type SuccessResponse = z.infer<typeof successResponseSchema>;
export type CodeStatus = z.infer<typeof codeStatusSchema>;
export type EphemeralCode = z.infer<typeof ephemeralCodeSchema>;
export type Redemption = z.infer<typeof redemptionSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Invite = z.infer<typeof inviteSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type MilestoneAward = z.infer<typeof milestoneAwardSchema>;

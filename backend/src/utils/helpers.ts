import { v4 as uuidv4 } from 'uuid';

/**
 * Generate unique referral code
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate unique reward code
 */
export function generateRewardCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate expiration time in minutes from now.
 * Defaults to 15 minutes if not specified.
 */
export function calculateExpirationTime(minutes: number = 15): Date {
  const now = new Date();
  return new Date(now.getTime() + minutes * 60 * 1000);
}

/**
 * Check if code is expired
 */
export function isCodeExpired(expiresAt: Date | string): boolean {
  const expirationTime = new Date(expiresAt);
  const now = new Date();
  return now > expirationTime;
}

/**
 * Calculate remaining time in seconds
 */
export function calculateRemainingTime(expiresAt: Date | string): number {
  const expirationTime = new Date(expiresAt);
  const now = new Date();
  const remaining = Math.max(0, Math.floor((expirationTime.getTime() - now.getTime()) / 1000));
  return remaining;
}

/**
 * Generate API response
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: { code: string; message: string; details?: string; field?: string }
): any {
  return {
    success,
    ...(data && { data }),
    ...(error && { error }),
    timestamp: new Date().toISOString(),
    requestId: uuidv4()
  };
}

/**
 * Generate success response
 */
export function createSuccessResponse<T>(data: T): any {
  return createApiResponse(true, data);
}

/**
 * Generate error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: string,
  field?: string
): any {
  return createApiResponse(false, undefined, { code, message, details, field });
}

/**
 * Validate phone number format (basic validation)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Basic validation for Indonesian phone numbers
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  return phoneRegex.test(phone);
}

/**
 * Sanitize input string
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Generate random number between min and max
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}



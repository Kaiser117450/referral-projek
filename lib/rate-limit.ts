import { createServerClient } from './supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest) => string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
};

/**
 * Check rate limit for a given key
 */
export async function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    const supabase = createServerClient();
    
    // Check if rate limit exists and is not exceeded
    const { data: rateLimit, error } = await supabase
      .rpc('check_rate_limit', {
        p_key: key,
        p_max_requests: finalConfig.maxRequests,
        p_window_ms: finalConfig.windowMs
      });

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limiting fails
      return {
        success: true,
        remaining: finalConfig.maxRequests,
        resetTime: new Date(Date.now() + finalConfig.windowMs),
        limit: finalConfig.maxRequests
      };
    }

    return {
      success: rateLimit.allowed,
      remaining: rateLimit.remaining,
      resetTime: new Date(rateLimit.reset_time),
      limit: finalConfig.maxRequests
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      remaining: finalConfig.maxRequests,
      resetTime: new Date(Date.now() + finalConfig.windowMs),
      limit: finalConfig.maxRequests
    };
  }
}

/**
 * Generate rate limit key from request
 */
export function generateRateLimitKey(req: NextRequest): string {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const path = req.nextUrl.pathname;
  
  // Create a hash-like key
  return `${ip}:${path}:${userAgent.substring(0, 50)}`;
}

/**
 * Rate limiting middleware for API routes
 */
export async function withRateLimit(
  req: NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<NextResponse | null> {
  const key = config.keyGenerator ? config.keyGenerator(req) : generateRateLimitKey(req);
  const result = await checkRateLimit(key, config);

  if (!result.success) {
    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        remaining: result.remaining,
        resetTime: result.resetTime.toISOString(),
        limit: result.limit
      },
      { status: 429 }
    );

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toISOString());
    response.headers.set('Retry-After', Math.ceil(result.windowMs / 1000).toString());

    return response;
  }

  return null; // Continue with request
}

/**
 * Rate limiting decorator for API handlers
 */
export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  return function <T extends any[], R>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const originalMethod = descriptor.value;
    
    if (originalMethod) {
      descriptor.value = async function (...args: T): Promise<R> {
        // This would need to be adapted based on how it's used
        // For now, it's a placeholder for potential decorator usage
        return originalMethod.apply(this, args);
      };
    }
    
    return descriptor;
  };
}

/**
 * Get rate limit info for a key (useful for debugging)
 */
export async function getRateLimitInfo(key: string): Promise<{
  current: number;
  limit: number;
  resetTime: Date;
  windowMs: number;
} | null> {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('key', key)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      current: data.request_count,
      limit: data.max_requests,
      resetTime: new Date(data.window_start + data.window_ms),
      windowMs: data.window_ms
    };
  } catch (error) {
    console.error('Failed to get rate limit info:', error);
    return null;
  }
}

/**
 * Reset rate limit for a key (admin function)
 */
export async function resetRateLimit(key: string): Promise<boolean> {
  try {
    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('rate_limits')
      .delete()
      .eq('key', key);

    return !error;
  } catch (error) {
    console.error('Failed to reset rate limit:', error);
    return false;
  }
}

/**
 * Get all rate limits (admin function)
 */
export async function getAllRateLimits(): Promise<Array<{
  key: string;
  current: number;
  limit: number;
  resetTime: Date;
  windowMs: number;
}>> {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('rate_limits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(item => ({
      key: item.key,
      current: item.request_count,
      limit: item.max_requests,
      resetTime: new Date(item.window_start + item.window_ms),
      windowMs: item.window_ms
    }));
  } catch (error) {
    console.error('Failed to get all rate limits:', error);
    return [];
  }
}

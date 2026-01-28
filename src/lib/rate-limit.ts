/**
 * Rate Limiter Utility
 * In-memory rate limiting for API protection
 */

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
}

interface RateLimitRecord {
  count: number;
  firstRequest: number;
}

// In-memory store (consider Redis for production)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.firstRequest > 60000) { // 1 minute
      rateLimitStore.delete(key);
    }
  }
}, 30000); // Run every 30 seconds

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // No previous requests
  if (!record) {
    rateLimitStore.set(identifier, { count: 1, firstRequest: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Window has expired, reset
  if (now - record.firstRequest > config.windowMs) {
    rateLimitStore.set(identifier, { count: 1, firstRequest: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Within window, check limit
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.firstRequest + config.windowMs,
    };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.firstRequest + config.windowMs,
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Strict limit for authentication
  auth: { windowMs: 60000, maxRequests: 5 },
  // Moderate limit for API calls
  api: { windowMs: 60000, maxRequests: 100 },
  // Very strict for password reset
  passwordReset: { windowMs: 3600000, maxRequests: 3 }, // 3 per hour
  // Lenient for static resources
  static: { windowMs: 60000, maxRequests: 500 },
  // Export limit
  export: { windowMs: 60000, maxRequests: 10 },
};

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (proxy)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a hash of user-agent + accept-language
  const ua = request.headers.get('user-agent') || 'unknown';
  const lang = request.headers.get('accept-language') || 'unknown';
  return `${ua.substring(0, 50)}_${lang.substring(0, 20)}`;
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: {
  remaining: number;
  resetTime: number;
}): Headers {
  const headers = new Headers();
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetTime.toString());
  return headers;
}

/**
 * 简单的内存限流（生产环境建议使用 KV 存储）
 */

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/analyze': { limit: 10, windowMs: 60000 },
  '/api/match': { limit: 20, windowMs: 60000 },
  '/api/rewrite': { limit: 20, windowMs: 60000 },
  '/api/rewrite-suggestions': { limit: 20, windowMs: 60000 },
  '/api/finalize': { limit: 10, windowMs: 60000 },
  '/api/chat-edit': { limit: 30, windowMs: 60000 },
};

// 内存存储（边缘函数实例级别）
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string, path: string): { allowed: boolean; retryAfter?: number } {
  const config = RATE_LIMITS[path];
  if (!config) return { allowed: true };

  const key = `${ip}:${path}`;
  const now = Date.now();
  const record = requestCounts.get(key);

  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true };
  }

  if (record.count >= config.limit) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

export function getRateLimitHeaders(path: string, ip: string): Record<string, string> {
  const config = RATE_LIMITS[path];
  if (!config) return {};

  const key = `${ip}:${path}`;
  const record = requestCounts.get(key);
  const remaining = record ? Math.max(0, config.limit - record.count) : config.limit;

  return {
    'X-RateLimit-Limit': String(config.limit),
    'X-RateLimit-Remaining': String(remaining),
  };
}

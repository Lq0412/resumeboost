/**
 * 客户端频率限制
 * 使用滑动窗口计数器实现
 */

interface RateLimitConfig {
  maxRequests: number;  // 最大请求数
  windowMs: number;     // 时间窗口（毫秒）
}

interface RateLimitState {
  timestamps: number[];
}

// 默认配置：每分钟 20 次请求
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60 * 1000,
};

// 存储各端点的请求时间戳
const rateLimitStates: Map<string, RateLimitState> = new Map();

/**
 * 检查是否允许请求
 * @param endpoint API 端点标识
 * @param config 可选的配置覆盖
 * @returns { allowed: boolean, remaining: number, retryAfter?: number }
 */
export function checkClientRateLimit(
  endpoint: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  
  // 获取或创建状态
  let state = rateLimitStates.get(endpoint);
  if (!state) {
    state = { timestamps: [] };
    rateLimitStates.set(endpoint, state);
  }
  
  // 清理过期的时间戳
  state.timestamps = state.timestamps.filter(ts => now - ts < windowMs);
  
  // 检查是否超过限制
  if (state.timestamps.length >= maxRequests) {
    const oldestTimestamp = state.timestamps[0];
    const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, retryAfter),
    };
  }
  
  return {
    allowed: true,
    remaining: maxRequests - state.timestamps.length,
  };
}

/**
 * 记录一次请求
 * @param endpoint API 端点标识
 */
export function recordRequest(endpoint: string): void {
  let state = rateLimitStates.get(endpoint);
  if (!state) {
    state = { timestamps: [] };
    rateLimitStates.set(endpoint, state);
  }
  state.timestamps.push(Date.now());
}

/**
 * 重置指定端点的限制
 * @param endpoint API 端点标识
 */
export function resetRateLimit(endpoint: string): void {
  rateLimitStates.delete(endpoint);
}

/**
 * 获取剩余请求次数
 * @param endpoint API 端点标识
 * @param config 可选的配置覆盖
 */
export function getRemainingRequests(
  endpoint: string,
  config: Partial<RateLimitConfig> = {}
): number {
  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  
  const state = rateLimitStates.get(endpoint);
  if (!state) return maxRequests;
  
  const validTimestamps = state.timestamps.filter(ts => now - ts < windowMs);
  return Math.max(0, maxRequests - validTimestamps.length);
}

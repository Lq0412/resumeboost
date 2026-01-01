/**
 * 统一响应工具
 */

export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  extra: Record<string, unknown> = {}
): Response {
  return jsonResponse(
    { error: { code, message, ...extra } },
    status
  );
}

export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMITED',
        message: '请求过于频繁，请稍后再试',
        retry_after_sec: retryAfter,
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}

/**
 * /api/rewrite - 经历改写
 */

import { serverMask } from '../shared/masking';
import { checkRateLimit, getRateLimitHeaders } from '../shared/ratelimit';
import { callAI, parseJSON } from '../shared/ai';
import { jsonResponse, errorResponse, rateLimitResponse } from '../shared/response';

interface RewriteRequest {
  source_text: string;
  jd_text?: string | null;
  style: 'conservative' | 'strong';
  lang: 'auto' | 'zh' | 'en';
  constraints: {
    no_new_facts: boolean;
    ats_friendly: boolean;
    keep_bullets: boolean;
  };
}

interface RewriteResponse {
  rewritten_text: string;
  cautions: string[];
}

const CONSERVATIVE_PROMPT = `你是一个简历优化专家。请对以下文本进行保守改写。

要求：
1. 贴近原文，主要优化表达和措辞
2. 保持原有结构（如果是 bullet 列表，输出也是 bullet 列表）
3. 不添加任何新的事实、数据或时间
4. 保持脱敏占位符不变
5. 使用更专业、更有力的动词
6. ATS 友好：避免特殊符号、表格、多栏

输出格式（JSON）：
{
  "rewritten_text": "改写后的文本",
  "cautions": []
}`;

const STRONG_PROMPT = `你是一个简历优化专家。请对以下文本进行强化改写。

要求：
1. 强调影响力和成果
2. 保持原有结构（如果是 bullet 列表，输出也是 bullet 列表）
3. 不编造事实，但可以用更有力的表达
4. 如果需要量化但原文没有数据，使用 X% 或 X+ 作为占位符，并在 cautions 中提醒用户替换
5. 保持脱敏占位符不变
6. ATS 友好：避免特殊符号、表格、多栏

输出格式（JSON）：
{
  "rewritten_text": "改写后的文本",
  "cautions": ["请将 X% 替换为实际数据"]
}`;

export async function onRequest(context: { request: Request }): Promise<Response> {
  const { request } = context;
  
  if (request.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Only POST allowed', 405);
  }

  const ip = request.headers.get('cf-connecting-ip') || 
             request.headers.get('x-forwarded-for')?.split(',')[0] || 
             'unknown';

  const rateLimit = checkRateLimit(ip, '/api/rewrite');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter!);
  }

  try {
    const body: RewriteRequest = await request.json();

    if (!body.source_text || body.source_text.length < 5) {
      return errorResponse('BAD_REQUEST', '待改写文本不能为空', 400);
    }
    if (body.source_text.length > 3000) {
      return errorResponse('PAYLOAD_TOO_LARGE', '待改写文本超出长度限制', 413);
    }

    const maskedSource = serverMask(body.source_text);
    const maskedJd = body.jd_text ? serverMask(body.jd_text) : '';

    const systemPrompt = body.style === 'conservative' ? CONSERVATIVE_PROMPT : STRONG_PROMPT;
    
    let userPrompt = `请改写以下文本：\n\n${maskedSource}`;
    if (maskedJd) {
      userPrompt += `\n\n参考目标职位 JD：\n${maskedJd}`;
    }

    const aiResponse = await callAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: body.style === 'conservative' ? 0.5 : 0.7,
    });

    const result = parseJSON<RewriteResponse>(aiResponse);
    if (!result || !result.rewritten_text) {
      return errorResponse('MODEL_ERROR', 'AI 响应解析失败', 502);
    }

    const response: RewriteResponse = {
      rewritten_text: result.rewritten_text,
      cautions: result.cautions || [],
    };

    return jsonResponse(response, 200, getRateLimitHeaders('/api/rewrite', ip));
  } catch (error) {
    console.error('Rewrite error:', error);
    return errorResponse('INTERNAL_ERROR', '服务异常，请稍后重试', 500);
  }
}

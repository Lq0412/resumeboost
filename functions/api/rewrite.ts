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

const CONSERVATIVE_PROMPT = `你是简历优化专家。对文本进行保守改写，保持原意，优化表达。

## 改写原则
1. 保持原有事实和数据不变
2. 优化句式结构，使表达更专业
3. 使用更有力的动词（如"负责"→"主导"、"参与"→"协助推进"）
4. 确保语法正确、表述流畅
5. 保持bullet point结构

## 输出格式（严格JSON）
{"rewritten_text": "改写后的文本", "cautions": []}

## 注意
- 保持脱敏占位符不变
- 不添加原文没有的事实或数据
- 如果原文已经很好，可以只做微调`;

const STRONG_PROMPT = `你是简历优化专家。对文本进行强化改写，突出影响力和成果。

## 改写原则
1. 强调成果和影响，使用STAR法则
2. 添加量化指标（如果原文有数据基础）
3. 使用强有力的动词和成果导向的表述
4. 突出个人贡献和价值
5. 如果需要量化但原文无数据，用X%、X+、XX人等占位

## 输出格式（严格JSON）
{"rewritten_text": "改写后的文本", "cautions": ["请将X%替换为实际数据"]}

## 注意
- 保持脱敏占位符不变
- 不编造具体数字，用占位符并在cautions提醒
- cautions中说明哪些地方需要用户补充真实数据`;

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

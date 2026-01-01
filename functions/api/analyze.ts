/**
 * /api/analyze - 简历诊断分析
 */

import { serverMask } from '../shared/masking';
import { checkRateLimit, getRateLimitHeaders } from '../shared/ratelimit';
import { callAI, parseJSON } from '../shared/ai';
import { jsonResponse, errorResponse, rateLimitResponse } from '../shared/response';

interface AnalyzeRequest {
  resume_text: string;
  jd_text?: string | null;
  lang: 'auto' | 'zh' | 'en';
  mask_enabled: boolean;
}

interface Issue {
  title: string;
  why: string;
  how: string;
  example?: { before: string; after: string };
}

interface AnalyzeResponse {
  issues: Issue[];
  actions: string[];
  examples: { before: string; after: string }[];
}

const SYSTEM_PROMPT = `你是一个专业的简历优化顾问。分析用户的简历，找出问题并提供可执行的改进建议。

要求：
1. 找出简历中的问题（最多10条），每个问题包含：标题、原因、改进方法
2. 提供可执行的行动建议（最多10条），以动词开头
3. 如果有具体的改写示例，提供 before/after 对比

输出格式（JSON）：
{
  "issues": [
    { "title": "问题标题", "why": "为什么这是问题", "how": "如何改进", "example": { "before": "原文", "after": "改后" } }
  ],
  "actions": ["行动建议1", "行动建议2"],
  "examples": [{ "before": "原文", "after": "改后" }]
}

注意：
- 保持脱敏占位符（如 [PHONE_1]、[EMAIL_1]）不变
- 不要编造事实或数据
- 建议要具体可执行`;

export async function onRequest(context: { request: Request }): Promise<Response> {
  const { request } = context;
  
  if (request.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Only POST allowed', 405);
  }

  // 获取客户端 IP
  const ip = request.headers.get('cf-connecting-ip') || 
             request.headers.get('x-forwarded-for')?.split(',')[0] || 
             'unknown';

  // 限流检查
  const rateLimit = checkRateLimit(ip, '/api/analyze');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter!);
  }

  try {
    const body: AnalyzeRequest = await request.json();

    // 验证输入
    if (!body.resume_text || body.resume_text.length < 10) {
      return errorResponse('BAD_REQUEST', '简历文本不能为空', 400);
    }
    if (body.resume_text.length > 20000) {
      return errorResponse('PAYLOAD_TOO_LARGE', '简历文本超出长度限制', 413);
    }

    // 二次脱敏
    const maskedResume = serverMask(body.resume_text);
    const maskedJd = body.jd_text ? serverMask(body.jd_text) : '';

    // 构建提示
    let userPrompt = `请分析以下简历：\n\n${maskedResume}`;
    if (maskedJd) {
      userPrompt += `\n\n目标职位 JD：\n${maskedJd}`;
    }

    // 调用 AI
    const aiResponse = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    // 解析响应
    const result = parseJSON<AnalyzeResponse>(aiResponse);
    if (!result) {
      return errorResponse('MODEL_ERROR', 'AI 响应解析失败', 502);
    }

    // 确保数组字段存在
    const response: AnalyzeResponse = {
      issues: (result.issues || []).slice(0, 10),
      actions: (result.actions || []).slice(0, 10),
      examples: result.examples || [],
    };

    return jsonResponse(response, 200, getRateLimitHeaders('/api/analyze', ip));
  } catch (error) {
    console.error('Analyze error:', error);
    return errorResponse('INTERNAL_ERROR', '服务异常，请稍后重试', 500);
  }
}

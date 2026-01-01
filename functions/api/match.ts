/**
 * /api/match - JD 匹配分析
 */

import { serverMask } from '../shared/masking';
import { checkRateLimit, getRateLimitHeaders } from '../shared/ratelimit';
import { callAI, parseJSON } from '../shared/ai';
import { jsonResponse, errorResponse, rateLimitResponse } from '../shared/response';

interface MatchRequest {
  resume_text: string;
  jd_text: string;
  lang: 'auto' | 'zh' | 'en';
}

interface MatchResponse {
  score: number;
  missing_keywords: string[];
  hit_keywords: string[];
  notes: string;
}

const SYSTEM_PROMPT = `你是一个 ATS（申请人追踪系统）专家。分析简历与职位描述的匹配度。

要求：
1. 给出匹配分数（0-100 整数）
2. 列出简历中缺失的关键词（10-20个，按重要性排序）
3. 列出简历中命中的关键词（最多20个）
4. 一句话总结匹配情况

输出格式（JSON）：
{
  "score": 75,
  "missing_keywords": ["关键词1", "关键词2"],
  "hit_keywords": ["命中词1", "命中词2"],
  "notes": "一句话总结"
}

评分标准：
- 90-100：非常匹配，几乎满足所有要求
- 70-89：较好匹配，满足大部分核心要求
- 50-69：一般匹配，有明显差距但有潜力
- 30-49：匹配度低，需要大幅改进
- 0-29：基本不匹配`;

export async function onRequest(context: { request: Request }): Promise<Response> {
  const { request } = context;
  
  if (request.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Only POST allowed', 405);
  }

  const ip = request.headers.get('cf-connecting-ip') || 
             request.headers.get('x-forwarded-for')?.split(',')[0] || 
             'unknown';

  const rateLimit = checkRateLimit(ip, '/api/match');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter!);
  }

  try {
    const body: MatchRequest = await request.json();

    if (!body.resume_text || body.resume_text.length < 10) {
      return errorResponse('BAD_REQUEST', '简历文本不能为空', 400);
    }
    if (!body.jd_text || body.jd_text.length < 10) {
      return errorResponse('BAD_REQUEST', 'JD 文本不能为空', 400);
    }
    if (body.resume_text.length > 20000) {
      return errorResponse('PAYLOAD_TOO_LARGE', '简历文本超出长度限制', 413);
    }
    if (body.jd_text.length > 10000) {
      return errorResponse('PAYLOAD_TOO_LARGE', 'JD 文本超出长度限制', 413);
    }

    const maskedResume = serverMask(body.resume_text);
    const maskedJd = serverMask(body.jd_text);

    const userPrompt = `请分析以下简历与职位描述的匹配度：

简历：
${maskedResume}

职位描述：
${maskedJd}`;

    const aiResponse = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
    });

    const result = parseJSON<MatchResponse>(aiResponse);
    if (!result) {
      return errorResponse('MODEL_ERROR', 'AI 响应解析失败', 502);
    }

    // 确保数据格式正确
    const response: MatchResponse = {
      score: Math.min(100, Math.max(0, Math.round(result.score || 0))),
      missing_keywords: (result.missing_keywords || []).slice(0, 20),
      hit_keywords: (result.hit_keywords || []).slice(0, 20),
      notes: result.notes || '',
    };

    // 确保 missing_keywords 至少有 10 个
    if (response.missing_keywords.length < 10) {
      response.missing_keywords = response.missing_keywords.concat(
        Array(10 - response.missing_keywords.length).fill('').filter(() => false)
      );
    }

    return jsonResponse(response, 200, getRateLimitHeaders('/api/match', ip));
  } catch (error) {
    console.error('Match error:', error);
    return errorResponse('INTERNAL_ERROR', '服务异常，请稍后重试', 500);
  }
}

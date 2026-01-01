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

const SYSTEM_PROMPT = `你是ATS系统专家和招聘顾问。分析简历与JD的匹配度。

## 分析要点
1. **硬性要求匹配**：学历、年限、必备技能是否满足
2. **技术栈匹配**：JD要求的技术/工具，简历中是否体现
3. **经验匹配**：工作内容、项目经验是否与岗位相关
4. **关键词覆盖**：JD中的高频词、专业术语是否出现在简历中

## 评分标准
- 90-100：高度匹配，满足所有核心要求
- 70-89：较好匹配，满足大部分要求，有小缺口
- 50-69：一般匹配，有明显技能缺口
- 30-49：匹配度低，缺少多项核心要求
- 0-29：基本不匹配

## 输出格式（严格JSON）
{"score": 75, "missing_keywords": ["缺失关键词"], "hit_keywords": ["命中关键词"], "notes": "一句话总结匹配情况和主要差距"}

## 注意
- missing_keywords：按重要性排序，优先列出JD中强调的核心技能（10-20个）
- hit_keywords：简历中已覆盖的JD关键词（最多20个）
- notes：简明扼要说明主要差距和建议方向`;

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

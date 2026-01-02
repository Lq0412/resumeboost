/**
 * /api/rewrite-suggestions - AI 智能改写建议
 * 返回结构化的改写建议，可直接应用到简历
 */

import { checkRateLimit, getRateLimitHeaders } from '../shared/ratelimit';
import { callAI, parseJSON } from '../shared/ai';
import { jsonResponse, errorResponse, rateLimitResponse } from '../shared/response';

interface RewriteSuggestionsRequest {
  resume_data: {
    experience: Array<{
      index: number;
      company: string;
      position: string;
      bullets: Array<{ index: number; text: string }>;
    }>;
    projects: Array<{
      index: number;
      name: string;
      role: string;
      bullets: Array<{ index: number; text: string }>;
    }>;
  };
  jd_text?: string | null;
}

interface Suggestion {
  path: string;
  original: string;
  suggested: string;
  reason: string;
}

interface RewriteSuggestionsResponse {
  suggestions: Suggestion[];
}

const SYSTEM_PROMPT = `你是资深简历优化专家。分析简历中的工作经历和项目经历描述，给出具体的改写建议。

## 输入格式
你会收到结构化的简历数据，包含：
- experience: 工作经历列表，每条包含 index、company、position、bullets（描述列表）
- projects: 项目经历列表，每条包含 index、name、role、bullets（描述列表）

## 改写原则
1. 使用 STAR 法则（情境-任务-行动-结果）
2. 添加量化数据（如果原文有基础，用具体数字；如果没有，用 X%、X+ 占位）
3. 使用强有力的动词（主导、设计、优化、提升、推动等）
4. 突出个人贡献和成果
5. 保持专业、简洁，每条建议不超过 50 字

## 输出格式（严格 JSON）
{
  "suggestions": [
    {
      "path": "experience.0.bullets.0",
      "original": "原文内容（必须与输入完全一致）",
      "suggested": "改写后的内容",
      "reason": "改写原因（10-15字）"
    }
  ]
}

## path 格式
- experience.{index}.bullets.{bulletIndex} - 工作经历的第 index 条的第 bulletIndex 条描述
- projects.{index}.bullets.{bulletIndex} - 项目经历的第 index 条的第 bulletIndex 条描述

## 重要规则
1. original 字段必须与输入的 text 完全一致，一字不差
2. 只改写需要优化的内容，已经很好的描述不要改
3. 每条 reason 要简短有力（10-15字）
4. 最多返回 8 条建议，优先改写最需要优化的内容
5. 如果所有描述都很好，返回空数组`;

export async function onRequest(context: { request: Request }): Promise<Response> {
  const { request } = context;
  
  if (request.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Only POST allowed', 405);
  }

  const ip = request.headers.get('cf-connecting-ip') || 
             request.headers.get('x-forwarded-for')?.split(',')[0] || 
             'unknown';

  const rateLimit = checkRateLimit(ip, '/api/rewrite-suggestions');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter!);
  }

  try {
    const body: RewriteSuggestionsRequest = await request.json();

    if (!body.resume_data) {
      return errorResponse('BAD_REQUEST', '简历数据不能为空', 400);
    }

    // 构建用户提示
    let userPrompt = '请分析以下简历内容，给出改写建议：\n\n';
    userPrompt += JSON.stringify(body.resume_data, null, 2);
    
    if (body.jd_text) {
      userPrompt += `\n\n目标职位 JD：\n${body.jd_text}\n\n请根据 JD 要求，针对性地优化简历内容。`;
    }

    const aiResponse = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    const result = parseJSON<RewriteSuggestionsResponse>(aiResponse);
    if (!result) {
      return errorResponse('MODEL_ERROR', 'AI 响应解析失败', 502);
    }

    const response: RewriteSuggestionsResponse = {
      suggestions: (result.suggestions || []).slice(0, 8),
    };

    return jsonResponse(response, 200, getRateLimitHeaders('/api/rewrite-suggestions', ip));
  } catch (error) {
    console.error('Rewrite suggestions error:', error);
    return errorResponse('INTERNAL_ERROR', '服务异常，请稍后重试', 500);
  }
}

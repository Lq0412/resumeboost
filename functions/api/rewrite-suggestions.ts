/**
 * /api/rewrite-suggestions - AI 智能改写建议
 * 返回结构化的改写建议，可直接应用到简历
 */

import { checkRateLimit, getRateLimitHeaders } from '../shared/ratelimit';
import { callAI, parseJSON } from '../shared/ai';
import { jsonResponse, errorResponse, rateLimitResponse } from '../shared/response';

interface RewriteSuggestionsRequest {
  resume_data: {
    basicInfo?: {
      name?: string;
      jobTitle?: string;
    };
    experience: Array<{
      index: number;
      company: string;
      position: string;
      bullets: string[];
    }>;
    projects: Array<{
      index: number;
      name: string;
      role: string;
      bullets: string[];
    }>;
    education?: Array<{
      index: number;
      school: string;
      major?: string;
      degree?: string;
      description?: string;
    }>;
    skillCategories?: Array<{
      index: number;
      name: string;
      description: string;
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

const SYSTEM_PROMPT = `你是资深简历优化专家。你需要找出简历中「明显需要优化」的内容，并给出可直接替换的改写建议。

## 输入格式
你会收到结构化的简历数据（JSON），包含：
- basicInfo: 基本信息（可能包含 name、jobTitle）
- experience: 工作经历列表，每条包含 index、company、position、bullets（字符串数组，可能包含空字符串占位）
- projects: 项目经历列表，每条包含 index、name、role、bullets（字符串数组，可能包含空字符串占位）
- education: 教育经历列表（可选）
- skillCategories: 技能分类列表（可选）

## 改写原则
1. 使用 STAR 法则（情境-任务-行动-结果）
2. 添加量化数据（如果原文有基础，用具体数字；如果没有，用 X%、X+ 占位）
3. 使用强有力的动词（主导、设计、优化、提升、推动等）
4. 突出个人贡献和成果
5. 保留原文关键信息（技术栈/业务背景/结果），不要删掉重要事实
6. 保持专业、简洁

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
- experience.{index}.position - 工作职位
- projects.{index}.bullets.{bulletIndex} - 项目经历的第 index 条的第 bulletIndex 条描述
- projects.{index}.name - 项目名称
- projects.{index}.role - 项目角色
- education.{index}.description - 教育描述
- skillCategories.{index}.description - 技能描述
- basicInfo.jobTitle - 求职意向

## 重要规则
1. original 字段必须与输入对应字段完全一致，一字不差
2. 只改写需要优化的内容，已经很好的描述不要改
3. 每条 reason 要简短有力（10-15字）
4. **每条 suggested 必须与 original 有实质差异**；如果无法改进就不要返回该条
5. 不要重复：同一个 path 只能出现一次
6. 最多返回 12 条建议，优先改写最需要优化的内容
7. 如果所有描述都很好，返回空数组
8. **suggested 字段必须是可以直接替换原文的完整句子**，不要包含任何解释、括号说明或"建议..."等前缀
9. 如果发现重复内容，suggested 应该是重写后的独特描述，而不是"建议删除"这样的说明
10. 不要对空字符串占位符给出建议（original 为空/全空白就跳过）`;

function normalizeForCompare(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function isSupportedPath(path: string): boolean {
  return [
    /^experience\.\d+\.bullets\.\d+$/,
    /^experience\.\d+\.position$/,
    /^projects\.\d+\.bullets\.\d+$/,
    /^projects\.\d+\.name$/,
    /^projects\.\d+\.role$/,
    /^education\.\d+\.description$/,
    /^skillCategories\.\d+\.description$/,
    /^basicInfo\.jobTitle$/,
  ].some((re) => re.test(path));
}

function isPathInBounds(resumeData: RewriteSuggestionsRequest['resume_data'], path: string): boolean {
  const parts = path.split('.');
  const sectionKey = parts[0];

  if (sectionKey === 'basicInfo') {
    return parts[1] === 'jobTitle' && typeof resumeData.basicInfo?.jobTitle === 'string';
  }

  const itemIndex = parts[1] ? parseInt(parts[1], 10) : NaN;
  if (Number.isNaN(itemIndex) || itemIndex < 0) return false;

  if (sectionKey === 'experience') {
    const exp = resumeData.experience[itemIndex];
    if (!exp) return false;
    if (parts[2] === 'position') return typeof exp.position === 'string';
    if (parts[2] !== 'bullets') return false;
    const bulletIndex = parts[3] ? parseInt(parts[3], 10) : NaN;
    if (Number.isNaN(bulletIndex) || bulletIndex < 0) return false;
    return Array.isArray(exp.bullets) && bulletIndex < exp.bullets.length;
  }

  if (sectionKey === 'projects') {
    const proj = resumeData.projects[itemIndex];
    if (!proj) return false;
    if (parts[2] === 'name') return typeof proj.name === 'string';
    if (parts[2] === 'role') return typeof proj.role === 'string';
    if (parts[2] !== 'bullets') return false;
    const bulletIndex = parts[3] ? parseInt(parts[3], 10) : NaN;
    if (Number.isNaN(bulletIndex) || bulletIndex < 0) return false;
    return Array.isArray(proj.bullets) && bulletIndex < proj.bullets.length;
  }

  if (sectionKey === 'education') {
    const edu = resumeData.education?.[itemIndex];
    if (!edu) return false;
    return parts[2] === 'description' && typeof edu.description === 'string';
  }

  if (sectionKey === 'skillCategories') {
    const category = resumeData.skillCategories?.[itemIndex];
    if (!category) return false;
    return parts[2] === 'description' && typeof category.description === 'string';
  }

  return false;
}

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

    const rawSuggestions = Array.isArray(result.suggestions) ? result.suggestions : [];
    const seenPaths = new Set<string>();
    const seenKeys = new Set<string>();
    const suggestions: Suggestion[] = [];

    for (const item of rawSuggestions) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      const pathValue = record.path;
      const originalValue = record.original;
      const suggestedValue = record.suggested;
      const reasonValue = record.reason;

      if (typeof pathValue !== 'string') continue;
      if (typeof originalValue !== 'string') continue;
      if (typeof suggestedValue !== 'string') continue;
      if (typeof reasonValue !== 'string') continue;

      const path = pathValue.trim();
      const original = originalValue;
      const suggested = suggestedValue;
      const reason = reasonValue.trim();

      if (!path || !isSupportedPath(path)) continue;
      if (!isPathInBounds(body.resume_data, path)) continue;
      if (seenPaths.has(path)) continue;

      const originalNorm = normalizeForCompare(original);
      const suggestedNorm = normalizeForCompare(suggested);

      if (!originalNorm) continue;
      if (!suggestedNorm) continue;
      if (originalNorm === suggestedNorm) continue;

      const key = `${path}|${suggestedNorm}`;
      if (seenKeys.has(key)) continue;

      seenPaths.add(path);
      seenKeys.add(key);
      suggestions.push({ path, original, suggested: suggested.trim(), reason });

      if (suggestions.length >= 12) break;
    }

    const response: RewriteSuggestionsResponse = {
      suggestions,
    };

    return jsonResponse(response, 200, getRateLimitHeaders('/api/rewrite-suggestions', ip));
  } catch (error) {
    console.error('Rewrite suggestions error:', error);
    return errorResponse('INTERNAL_ERROR', '服务异常，请稍后重试', 500);
  }
}

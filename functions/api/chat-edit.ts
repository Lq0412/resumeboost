/**
 * /api/chat-edit - AI 对话式精准修改
 * 根据用户自然语言指令，返回具体的修改建议
 */

import { checkRateLimit, getRateLimitHeaders } from '../shared/ratelimit';
import { callAI, parseJSON } from '../shared/ai';
import { jsonResponse, errorResponse, rateLimitResponse } from '../shared/response';

interface ChatEditRequest {
  message: string;
  resume_data: {
    basicInfo: {
      name?: string;
      jobTitle?: string;
      phone?: string;
      email?: string;
      city?: string;
      status?: string;
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
    education: Array<{
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

interface ChatEditResponse {
  reply: string;
  suggestion?: {
    path: string;
    original: string;
    suggested: string;
    reason: string;
  };
}

const SYSTEM_PROMPT = `你是专业的简历优化助手。用户会用自然语言描述他们想要的修改，你需要理解意图并给出具体的修改建议。

## 输入格式
你会收到：
1. 用户的修改请求（自然语言）
2. 简历数据（JSON 格式，包含 experience 工作经历和 projects 项目经历）
3. 可选的目标职位 JD

补充说明：experience/projects 的 bullets 是字符串数组，可能包含空字符串占位；bulletIndex 指该数组的下标（从 0 开始），不要对空字符串返回建议。
补充说明：experience/projects 通常有多条，请完整阅读数组内容后再回答；不要在未确认的情况下说“只有一条工作经历/项目经历”。
当用户明确说“第 N 条/第二条/第2条”等序号时，必须优先定位到对应 index（第二条=1），不要默认第 0 条。

## 输出格式（严格 JSON）
{
  "reply": "对用户的回复，简洁友好",
  "suggestion": {
    "path": "修改路径",
    "original": "原文（必须与简历数据完全一致）",
    "suggested": "修改后的内容",
    "reason": "修改原因（10-15字）"
  }
}

## path 格式规则（注意区分工作经历和项目经历）
- experience.{index}.bullets.{bulletIndex} - 工作经历的第 index 条的第 bulletIndex 条描述
- experience.{index}.position - 工作职位
- projects.{index}.bullets.{bulletIndex} - 项目经历的第 index 条的第 bulletIndex 条描述
- projects.{index}.name - 项目名称
- projects.{index}.role - 项目角色
- education.{index}.description - 教育描述
- skillCategories.{index}.description - 技能描述
- basicInfo.jobTitle - 求职意向

## 重要规则
1. **如果内容已经很好，不需要修改，只返回 reply 说明内容已经很好，不返回 suggestion**
2. 如果用户请求不明确或无法定位到具体内容，只返回 reply 询问具体要修改哪部分
3. original 必须与简历数据中的内容**完全一致**，一字不差
4. suggested 必须是可以直接替换的完整内容
5. 每次只返回一条建议，针对用户最可能想修改的内容
6. reply 要简洁友好，不超过 50 字
7. 如果用户的请求与简历修改无关，礼貌地引导回简历优化话题

## 判断内容是否需要修改的标准
以下情况**不需要修改**，直接回复"这条描述已经很好了"：
- 已经包含具体的量化数据（如百分比、人数、金额等）
- 使用了 STAR 法则（情境-任务-行动-结果）
- 动词有力（如主导、设计、优化、提升等）
- 表述专业、简洁

以下情况**需要修改**：
- 描述过于笼统，缺乏具体细节
- 没有量化数据
- 使用弱动词（如负责、参与、做了等）
- 只描述了做什么，没有说明成果

## 常见意图识别
- "优化第一条工作经历" → 定位到 experience.0.bullets.0
- "优化第一个项目" → 定位到 projects.0.bullets.0（注意是 projects 不是 experience）
- "让项目描述更专业" → 定位到 projects.*.bullets.*
- "添加量化数据" → 在描述中加入具体数字
- "精简内容" → 缩短描述，保留核心信息
- "突出成果" → 强调结果和影响`;

export async function onRequest(context: { request: Request }): Promise<Response> {
  const { request } = context;
  
  if (request.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Only POST allowed', 405);
  }

  const ip = request.headers.get('cf-connecting-ip') || 
             request.headers.get('x-forwarded-for')?.split(',')[0] || 
             'unknown';

  const rateLimit = checkRateLimit(ip, '/api/chat-edit');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter!);
  }

  try {
    const body: ChatEditRequest = await request.json();

    if (!body.message || !body.message.trim()) {
      return errorResponse('BAD_REQUEST', '消息不能为空', 400);
    }

    if (!body.resume_data) {
      return errorResponse('BAD_REQUEST', '简历数据不能为空', 400);
    }

    // 限制消息长度
    const message = body.message.trim().slice(0, 500);

    const experience = Array.isArray(body.resume_data.experience) ? body.resume_data.experience : [];
    const projects = Array.isArray(body.resume_data.projects) ? body.resume_data.projects : [];

    const isNonEmpty = (value: string | undefined): boolean => Boolean(value && value.trim());
    const countNonEmptyBullets = (bullets: string[] | undefined): number => (bullets || []).filter((b) => isNonEmpty(b)).length;

    const experienceNonEmpty = experience.filter((e) =>
      isNonEmpty(e.company) || isNonEmpty(e.position) || countNonEmptyBullets(e.bullets) > 0
    ).length;
    const projectsNonEmpty = projects.filter((p) =>
      isNonEmpty(p.name) || isNonEmpty(p.role) || countNonEmptyBullets(p.bullets) > 0
    ).length;

    const experienceIndexList = experience
      .map((e) => `${e.index}: ${(e.company || '').trim() || '(公司未填)'} | ${(e.position || '').trim() || '(岗位未填)'}`)
      .join('\n');
    const projectIndexList = projects
      .map((p) => `${p.index}: ${(p.name || '').trim() || '(项目名未填)'} | ${(p.role || '').trim() || '(角色未填)'}`)
      .join('\n');

    // 构建用户提示
    let userPrompt = `用户请求：${message}\n\n`;
    userPrompt += `简历概览：工作经历 ${experienceNonEmpty}/${experience.length} 条；项目经历 ${projectsNonEmpty}/${projects.length} 条\n`;
    if (experience.length > 0) userPrompt += `工作经历索引：\n${experienceIndexList}\n\n`;
    if (projects.length > 0) userPrompt += `项目经历索引：\n${projectIndexList}\n\n`;
    userPrompt += `简历数据：\n${JSON.stringify(body.resume_data, null, 2)}`;
    
    if (body.jd_text) {
      userPrompt += `\n\n目标职位 JD：\n${body.jd_text}`;
    }

    const aiResponse = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    const result = parseJSON<ChatEditResponse>(aiResponse);
    if (!result) {
      return errorResponse('MODEL_ERROR', 'AI 响应解析失败', 502);
    }

    const response: ChatEditResponse = {
      reply: result.reply || '抱歉，我没有理解你的请求，请再说一遍？',
      suggestion: result.suggestion,
    };

    return jsonResponse(response, 200, getRateLimitHeaders('/api/chat-edit', ip));
  } catch (error) {
    console.error('Chat edit error:', error);
    return errorResponse('INTERNAL_ERROR', '服务异常，请稍后重试', 500);
  }
}

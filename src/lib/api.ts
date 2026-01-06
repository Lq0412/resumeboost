/**
 * API 客户端 - 统一的 API 调用和错误处理
 */

import { showToast } from '../components';

// 开发模式配置
const isDev = import.meta.env.DEV;
const USE_MOCK = false; // 设为 true 使用模拟数据，false 直接调用 DeepSeek

// DeepSeek API 配置（仅开发模式）
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

function buildChatEditResumeOverview(resumeData: ChatEditRequest['resume_data']): string {
  const experience = resumeData.experience || [];
  const projects = resumeData.projects || [];

  const isNonEmpty = (value: string | undefined): boolean => Boolean(value && value.trim());
  const countNonEmptyBullets = (bullets: string[] | undefined): number => (bullets || []).filter((b) => isNonEmpty(b)).length;

  const experienceNonEmpty = experience.filter((e) =>
    isNonEmpty(e.company) || isNonEmpty(e.position) || countNonEmptyBullets(e.bullets) > 0
  ).length;
  const projectsNonEmpty = projects.filter((p) =>
    isNonEmpty(p.name) || isNonEmpty(p.role) || countNonEmptyBullets(p.bullets) > 0
  ).length;

  const experienceIndexList = experience
    .map((e) => `${e.index}: ${(e.company || '').trim() || '(empty)'} | ${(e.position || '').trim() || '(empty)'}`)
    .join('\n');
  const projectIndexList = projects
    .map((p) => `${p.index}: ${(p.name || '').trim() || '(empty)'} | ${(p.role || '').trim() || '(empty)'}`)
    .join('\n');

  let overview = `Overview: experience ${experienceNonEmpty}/${experience.length}, projects ${projectsNonEmpty}/${projects.length}\n`;
  if (experience.length > 0) overview += `Experience index:\n${experienceIndexList}\n\n`;
  if (projects.length > 0) overview += `Projects index:\n${projectIndexList}\n\n`;
  return overview;
}

// Prompts - 优化版，更精准、更有针对性
const PROMPTS = {
  analyze: `你是资深HR和简历优化专家，拥有10年招聘经验。请对简历进行深度诊断。

## 分析维度（按优先级）
1. **结构完整性**：是否包含必要模块（联系方式、教育、经历、技能）？顺序是否合理？
2. **内容质量**：描述是否具体可量化？是否使用STAR法则？是否有空洞表述？
3. **ATS友好度**：格式是否规范？关键词是否充足？是否有特殊字符/表格影响解析？
4. **专业度**：时间线是否合理？是否有明显错误（如未来时间）？表述是否专业？
5. **差异化**：是否突出个人优势？是否有亮点数据？

## 输出要求
- issues：找出3-6个最关键的问题，每个问题必须：
  - title：一句话概括问题（如"项目成果缺乏量化数据"）
  - why：解释为什么这是问题，对求职的具体影响
  - how：给出具体可执行的改进方法，最好有示例
- actions：5-8条立即可执行的优化建议，按重要性排序，以动词开头
- examples：如果发现可以改进的具体句子，给出before/after示例（最多3个）

## 输出格式（严格JSON）
{"issues": [{"title": "问题标题", "why": "原因和影响", "how": "具体改进方法"}], "actions": ["建议1"], "examples": [{"before": "原文", "after": "改进后"}]}

## 注意
- 保持脱敏占位符（如[PHONE_1]、[EMAIL_1]）不变
- 不要给出泛泛的建议，要针对简历的具体内容
- 优先指出影响最大的问题`,

  match: `你是ATS系统专家和招聘顾问。分析简历与JD的匹配度。

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
- notes：简明扼要说明主要差距和建议方向`,

  rewrite_conservative: `你是简历优化专家。对文本进行保守改写，保持原意，优化表达。

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
- 如果原文已经很好，可以只做微调`,

  rewrite_strong: `你是简历优化专家。对文本进行强化改写，突出影响力和成果。

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
- cautions中说明哪些地方需要用户补充真实数据`,

  rewrite_suggestions: `你是资深简历优化专家。你需要找出简历中「明显需要优化」的内容，并给出可直接替换的改写建议。

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
10. 不要对空字符串占位符给出建议（original 为空/全空白就跳过）`,

  finalize: `你是简历排版专家。根据简历内容生成ATS友好的最终版本。

## 排版要求（simple_v1模板）
1. **结构**：单栏布局，清晰的模块分隔
2. **顺序**：姓名/联系方式 → 求职意向(可选) → 教育背景 → 专业技能 → 工作/项目经历 → 其他（证书/荣誉）
3. **格式**：
   - 使用Markdown标题（##）分隔模块
   - 经历使用bullet point（-）
   - 时间右对齐或放在标题行
   - 无表格、无图标、无多栏

## HTML要求
- 简洁的内联样式
- 适合A4打印（字号10.5-11pt，行高1.3）
- 黑字白底，无背景色
- 模块间有适当间距

## 输出格式（严格JSON）
{"final_markdown": "Markdown格式简历", "final_html": "HTML格式简历"}

## 注意
- 保持所有脱敏占位符不变
- 整合已采用的改写内容
- 确保内容完整，不遗漏原简历信息
- 一页为主，内容精炼`,

  chat_edit: `你是专业的简历优化助手。用户会用自然语言描述想要修改简历的哪个部分，你需要理解意图并给出具体的修改建议。

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
3. 如果用户明确指定了第 N 条工作/项目经历，必须优先按该序号定位，不要默认第一条
4. original 必须与简历数据中的内容**完全一致**，一字不差
5. suggested 必须是可以直接替换的完整内容
6. 每次只返回一条建议，针对用户最可能想修改的内容
7. reply 要简洁友好，不超过 50 字
8. 如果用户只是闲聊或问问题，正常回复，不返回 suggestion

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
- "突出成果" → 强调结果和影响`
};

/**
 * 开发模式直接调用 DeepSeek API
 */
async function callDeepSeekDirect<T>(url: string, options: RequestInit): Promise<T> {
  const body = JSON.parse(options.body as string);
  let systemPrompt = '';
  let userPrompt = '';

  if (url.includes('/api/analyze')) {
    systemPrompt = PROMPTS.analyze;
    userPrompt = `分析简历：\n${body.resume_text}${body.jd_text ? `\n\nJD：\n${body.jd_text}` : ''}`;
  } else if (url.includes('/api/match')) {
    systemPrompt = PROMPTS.match;
    userPrompt = `简历：\n${body.resume_text}\n\nJD：\n${body.jd_text}`;
  } else if (url.includes('/api/rewrite-suggestions')) {
    systemPrompt = PROMPTS.rewrite_suggestions;
    userPrompt = '请分析以下简历内容，给出改写建议：\n\n';
    userPrompt += JSON.stringify(body.resume_data, null, 2);
    if (body.jd_text) {
      userPrompt += `\n\n目标职位 JD：\n${body.jd_text}\n\n请根据 JD 要求，针对性地优化简历内容。`;
    }
  } else if (url.includes('/api/chat-edit')) {
    systemPrompt = PROMPTS.chat_edit;
    const overview = buildChatEditResumeOverview(body.resume_data as ChatEditRequest['resume_data']);
    userPrompt = `User request: ${body.message}\n\n${overview}Resume data:\n${JSON.stringify(body.resume_data, null, 2)}`;
    if (body.jd_text) {
      userPrompt += `\n\n目标职位 JD：\n${body.jd_text}`;
    }
  } else if (url.includes('/api/rewrite')) {
    systemPrompt = body.style === 'conservative' ? PROMPTS.rewrite_conservative : PROMPTS.rewrite_strong;
    userPrompt = `改写：\n${body.source_text}${body.jd_text ? `\n\n参考JD：\n${body.jd_text}` : ''}`;
  } else if (url.includes('/api/finalize')) {
    systemPrompt = PROMPTS.finalize;
    let rewritesInfo = '';
    if (body.applied_rewrites?.length > 0) {
      rewritesInfo = '\n\n已采用改写：\n' + body.applied_rewrites.map((r: AppliedRewriteItem, i: number) => 
        `${i+1}. 原：${r.before_text}\n   改：${r.after_text}`
      ).join('\n');
    }
    userPrompt = `生成终稿：\n${body.resume_text}${rewritesInfo}`;
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new APIError('MODEL_ERROR', 'AI 调用失败', response.status);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // 解析 JSON
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as T;
    }
    // 尝试直接解析
    return JSON.parse(content) as T;
  } catch {
    // 对于 chat-edit，如果解析失败，返回纯文本回复
    if (url.includes('/api/chat-edit')) {
      return { reply: content } as T;
    }
    throw new APIError('PARSE_ERROR', 'AI 响应解析失败', 500);
  }
}

// API 错误类
export class APIError extends Error {
  code: string;
  status: number;
  retryAfterSec?: number;

  constructor(code: string, message: string, status: number, retryAfterSec?: number) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
    this.retryAfterSec = retryAfterSec;
  }
}

// 请求/响应类型定义
export interface AnalyzeRequest {
  resume_text: string;
  jd_text?: string | null;
  lang: 'auto' | 'zh' | 'en';
  mask_enabled: boolean;
}

export interface Issue {
  title: string;
  why: string;
  how: string;
  example?: { before: string; after: string };
}

export interface AnalyzeResponse {
  issues: Issue[];
  actions: string[];
  examples: { before: string; after: string }[];
}

export interface MatchRequest {
  resume_text: string;
  jd_text: string;
  lang: 'auto' | 'zh' | 'en';
}

export interface MatchResponse {
  score: number;
  missing_keywords: string[];
  hit_keywords: string[];
  notes: string;
}

export interface RewriteRequest {
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

export interface RewriteResponse {
  rewritten_text: string;
  cautions: string[];
}

export interface AppliedRewriteItem {
  id: string;
  before_text: string;
  after_text: string;
  style: 'conservative' | 'strong';
}

export interface FinalizeRequest {
  resume_text: string;
  applied_rewrites: AppliedRewriteItem[];
  lang: 'auto' | 'zh' | 'en';
  template: 'simple_v1';
  mask_enabled: boolean;
}

export interface FinalizeResponse {
  final_markdown: string;
  final_html: string;
}

// AI 改写建议相关类型
export interface RewriteSuggestionsRequest {
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

export interface RewriteSuggestionItem {
  path: string;
  original: string;
  suggested: string;
  reason: string;
}

export interface RewriteSuggestionsResponse {
  suggestions: RewriteSuggestionItem[];
}

// AI 对话式修改相关类型
export interface ChatEditRequest {
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

export interface ChatEditResponse {
  reply: string;
  suggestion?: {
    path: string;
    original: string;
    suggested: string;
    reason: string;
  };
}

/**
 * 统一的 fetch 封装
 */
async function fetchJson<T>(url: string, options: RequestInit): Promise<T> {
  try {
    // 开发模式且启用 mock
    if (isDev && USE_MOCK) {
      const { mockFetch } = await import('./mock-api');
      const response = await mockFetch(url, options);
      const data = await response.json();
      if (!response.ok) {
        const error = data.error || {};
        throw new APIError(error.code || 'UNKNOWN_ERROR', error.message || '请求失败', response.status, error.retry_after_sec);
      }
      return data as T;
    }

    // 开发模式直接调用 DeepSeek
    if (isDev && DEEPSEEK_API_KEY) {
      return await callDeepSeekDirect<T>(url, options);
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data.error || {};
      throw new APIError(
        error.code || 'UNKNOWN_ERROR',
        error.message || '请求失败',
        response.status,
        error.retry_after_sec
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    // 网络错误
    throw new APIError('NETWORK_ERROR', '网络异常，请重试', 0);
  }
}

/**
 * 统一错误处理
 */
export function handleAPIError(error: unknown): void {
  if (error instanceof APIError) {
    switch (error.status) {
      case 0:
        showToast('网络异常，请重试', 'error');
        break;
      case 400:
        showToast(error.message, 'error');
        break;
      case 429:
        showToast(`请求过于频繁，请稍后再试（${error.retryAfterSec || 60}s）`, 'warning');
        break;
      default:
        showToast('服务异常，请稍后重试', 'error');
    }
  } else {
    showToast('发生未知错误', 'error');
  }
}

// API 方法
export const api = {
  /**
   * 简历诊断分析
   */
  async analyze(params: AnalyzeRequest): Promise<AnalyzeResponse> {
    return fetchJson<AnalyzeResponse>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * JD 匹配分析
   */
  async match(params: MatchRequest): Promise<MatchResponse> {
    return fetchJson<MatchResponse>('/api/match', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * 经历改写
   */
  async rewrite(params: RewriteRequest): Promise<RewriteResponse> {
    return fetchJson<RewriteResponse>('/api/rewrite', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * 生成终稿
   */
  async finalize(params: FinalizeRequest): Promise<FinalizeResponse> {
    return fetchJson<FinalizeResponse>('/api/finalize', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * AI 智能改写建议
   */
  async rewriteSuggestions(params: RewriteSuggestionsRequest): Promise<RewriteSuggestionsResponse> {
    return fetchJson<RewriteSuggestionsResponse>('/api/rewrite-suggestions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * AI 对话式精准修改
   */
  async chatEdit(params: ChatEditRequest): Promise<ChatEditResponse> {
    return fetchJson<ChatEditResponse>('/api/chat-edit', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};

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

// Prompts
const PROMPTS = {
  analyze: `你是一个专业的简历优化顾问。分析用户的简历，找出问题并提供可执行的改进建议。
输出格式（JSON）：{"issues": [{"title": "问题标题", "why": "原因", "how": "改进方法"}], "actions": ["建议1"], "examples": []}
注意：issues 最多10条，actions 最多10条，保持脱敏占位符不变。`,

  match: `你是一个 ATS 专家。分析简历与职位描述的匹配度。
输出格式（JSON）：{"score": 75, "missing_keywords": ["关键词1"], "hit_keywords": ["命中词1"], "notes": "一句话总结"}
score 为 0-100 整数，missing_keywords 10-20个，hit_keywords 最多20个。`,

  rewrite_conservative: `你是简历优化专家。对文本进行保守改写，贴近原文，主要优化表达。
输出格式（JSON）：{"rewritten_text": "改写后文本", "cautions": []}
保持原有结构，不添加新事实，保持脱敏占位符不变。`,

  rewrite_strong: `你是简历优化专家。对文本进行强化改写，强调影响力和成果。
输出格式（JSON）：{"rewritten_text": "改写后文本", "cautions": ["请将X%替换为实际数据"]}
如需量化但无数据，用 X%/X+ 占位并在 cautions 提醒。保持脱敏占位符不变。`,

  finalize: `你是简历排版专家。生成最终简历。
输出格式（JSON）：{"final_markdown": "Markdown简历", "final_html": "HTML简历"}
遵循 simple_v1 模板：单栏、无表格、无图标。保持脱敏占位符不变。`
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
    return JSON.parse(content) as T;
  } catch {
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
};

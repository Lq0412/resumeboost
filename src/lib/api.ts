/**
 * API 客户端 - 统一的 API 调用和错误处理
 */

import { showToast } from '../components';

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

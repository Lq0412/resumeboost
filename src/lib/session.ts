/**
 * 会话存储服务 - 使用 sessionStorage 存储数据
 */

import type { MaskingMap } from './masking';
import { serializeMap, deserializeMap, createEmptyMap } from './masking';

export interface AppliedRewrite {
  id: string;
  before_text: string;
  after_text: string;
  style: 'conservative' | 'strong';
}

export interface SessionData {
  resumeText: string;
  jdText: string;
  appliedRewrites: AppliedRewrite[];
  maskingMap: MaskingMap;
}

const STORAGE_KEY = 'resumeboost_session';

/**
 * 保存数据到 sessionStorage
 */
export function saveSession(data: Partial<SessionData>): void {
  try {
    const existing = loadSession();
    const merged: SessionData = {
      resumeText: data.resumeText ?? existing?.resumeText ?? '',
      jdText: data.jdText ?? existing?.jdText ?? '',
      appliedRewrites: data.appliedRewrites ?? existing?.appliedRewrites ?? [],
      maskingMap: data.maskingMap ?? existing?.maskingMap ?? createEmptyMap(),
    };

    const serialized = JSON.stringify({
      resumeText: merged.resumeText,
      jdText: merged.jdText,
      appliedRewrites: merged.appliedRewrites,
      maskingMap: serializeMap(merged.maskingMap),
    });

    sessionStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

/**
 * 从 sessionStorage 加载数据
 */
export function loadSession(): SessionData | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return {
      resumeText: parsed.resumeText || '',
      jdText: parsed.jdText || '',
      appliedRewrites: parsed.appliedRewrites || [],
      maskingMap: parsed.maskingMap ? deserializeMap(parsed.maskingMap) : createEmptyMap(),
    };
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

/**
 * 清除 sessionStorage 数据
 */
export function clearSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

/**
 * 添加已采用的改写
 */
export function addAppliedRewrite(rewrite: AppliedRewrite): void {
  const session = loadSession();
  const rewrites = session?.appliedRewrites ?? [];
  rewrites.push(rewrite);
  saveSession({ appliedRewrites: rewrites });
}

/**
 * 移除已采用的改写
 */
export function removeAppliedRewrite(id: string): void {
  const session = loadSession();
  const rewrites = session?.appliedRewrites ?? [];
  const filtered = rewrites.filter((r) => r.id !== id);
  saveSession({ appliedRewrites: filtered });
}

/**
 * 获取已采用的改写列表
 */
export function getAppliedRewrites(): AppliedRewrite[] {
  const session = loadSession();
  return session?.appliedRewrites ?? [];
}

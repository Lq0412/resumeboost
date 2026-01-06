/**
 * AI 智能改写相关类型定义
 */

// AI 建议的状态
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

// AI 建议项
export interface AISuggestion {
  id: string;
  // 定位信息
  path: string;           // 如 "experience.0.bullets.1" 或 "basicInfo.jobTitle"
  section: 'basic' | 'edu' | 'skill' | 'work' | 'project' | 'award';
  sectionLabel: string;   // 显示用，如 "工作经历"
  itemIndex?: number;     // 第几条经历（从0开始）
  bulletIndex?: number;   // 第几条描述（从0开始）
  field?: string;         // 字段名
  
  // 内容
  original: string;       // 原文
  suggested: string;      // 建议修改
  reason: string;         // 修改原因
  
  // 状态
  status: SuggestionStatus;
}

// AI 改写 API 请求
export interface AIRewriteRequest {
  resume_text: string;
  jd_text?: string | null;
  lang: 'auto' | 'zh' | 'en';
}

// AI 改写 API 响应
export interface AIRewriteResponse {
  suggestions: Array<{
    path: string;
    original: string;
    suggested: string;
    reason: string;
  }>;
}

// ============================================
// AI 对话式修改相关类型定义
// ============================================

// 消息状态
export type MessageStatus = 'sending' | 'sent' | 'error';

// 聊天消息
export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestion?: EditSuggestion;
  status: MessageStatus;
  timestamp: number;
  error?: string;  // 错误信息（当 status 为 error 时）
}

// 修改建议（对话中的）
export interface EditSuggestion {
  id: string;
  path: string;           // 如 "experience.0.bullets.1"
  original: string;       // 原文
  suggested: string;      // 建议修改
  reason: string;         // 修改原因
  status: SuggestionStatus;
}

// 对话历史项（发送给 API）
export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

// 快捷操作模板
export interface QuickActionTemplate {
  id: string;
  label: string;
  template: string;
  icon?: string;
}

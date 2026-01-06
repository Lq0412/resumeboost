/**
 * 对话状态管理 Hook
 */
import { useState, useCallback } from 'react';
import { api, handleAPIError } from '../../lib/api';
import type { ChatEditRequest } from '../../lib/api';
import { checkClientRateLimit, recordRequest } from '../../lib/rateLimit';
import type { ChatMessageData, ChatHistoryItem, EditSuggestion } from './types';

// 最大历史消息数
const MAX_HISTORY_LENGTH = 10;

// 生成唯一 ID
const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export interface ChatContext {
  resumeData: ChatEditRequest['resume_data'];
  jdText?: string | null;
}

export function useChatState() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 获取对话历史（用于发送给 API）
  const getHistory = useCallback((): ChatHistoryItem[] => {
    return messages
      .filter(m => m.status === 'sent')
      .slice(-MAX_HISTORY_LENGTH)
      .map(m => ({
        role: m.role,
        content: m.content,
      }));
  }, [messages]);

  // 发送消息
  const sendMessage = useCallback(async (content: string, context: ChatContext) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    // 检查频率限制
    const rateLimit = checkClientRateLimit('/api/chat-edit');
    if (!rateLimit.allowed) {
      const errorMessage: ChatMessageData = {
        id: generateId(),
        role: 'assistant',
        content: `请求太频繁，请 ${rateLimit.retryAfter} 秒后再试`,
        status: 'sent',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessageId = generateId();
    const userMessage: ChatMessageData = {
      id: userMessageId,
      role: 'user',
      content: trimmedContent,
      status: 'sending',
      timestamp: Date.now(),
    };

    // 添加用户消息
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      // 限制历史长度
      if (newMessages.length > MAX_HISTORY_LENGTH * 2) {
        return newMessages.slice(-MAX_HISTORY_LENGTH * 2);
      }
      return newMessages;
    });

    setIsLoading(true);

    try {
      // 记录请求
      recordRequest('/api/chat-edit');
      
      // 调用 API
      const response = await api.chatEdit({
        message: trimmedContent,
        resume_data: context.resumeData,
        jd_text: context.jdText,
      });

      // 更新用户消息状态为已发送
      setMessages(prev => prev.map(m => 
        m.id === userMessageId ? { ...m, status: 'sent' as const } : m
      ));

      // 添加 AI 回复
      const aiMessage: ChatMessageData = {
        id: generateId(),
        role: 'assistant',
        content: response.reply,
        suggestion: response.suggestion ? {
          id: generateId(),
          path: response.suggestion.path,
          original: response.suggestion.original,
          suggested: response.suggestion.suggested,
          reason: response.suggestion.reason,
          status: 'pending',
        } : undefined,
        status: 'sent',
        timestamp: Date.now(),
      };

      setMessages(prev => {
        const newMessages = [...prev, aiMessage];
        if (newMessages.length > MAX_HISTORY_LENGTH * 2) {
          return newMessages.slice(-MAX_HISTORY_LENGTH * 2);
        }
        return newMessages;
      });

    } catch (error) {
      // 更新用户消息状态为错误
      setMessages(prev => prev.map(m => 
        m.id === userMessageId ? { 
          ...m, 
          status: 'error' as const,
          error: error instanceof Error ? error.message : '发送失败'
        } : m
      ));
      handleAPIError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 重试发送失败的消息
  const retryMessage = useCallback(async (messageId: string, context: ChatContext) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.status !== 'error') return;

    // 移除失败的消息
    setMessages(prev => prev.filter(m => m.id !== messageId));

    // 重新发送
    await sendMessage(message.content, context);
  }, [messages, sendMessage]);

  // 清空对话历史
  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  // 更新建议状态
  const updateSuggestionStatus = useCallback((messageId: string, status: EditSuggestion['status']) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId && m.suggestion) {
        return {
          ...m,
          suggestion: { ...m.suggestion, status }
        };
      }
      return m;
    }));
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    retryMessage,
    clearHistory,
    updateSuggestionStatus,
    getHistory,
  };
}

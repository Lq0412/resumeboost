/**
 * AI 对话面板组件
 */
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useChatState } from './useChatState';
import type { ChatContext } from './useChatState';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { QuickActions } from './QuickActions';
import type { EditSuggestion } from './types';

interface AIChatPanelProps {
  resumeData: ChatContext['resumeData'];
  jdText?: string;
  onApplySuggestion: (suggestion: EditSuggestion) => void;
  onNewSuggestion?: (suggestion: EditSuggestion) => void;
  onRejectSuggestion?: (suggestionId: string) => void;
  onClose: () => void;
}

export function AIChatPanel({
  resumeData,
  jdText,
  onApplySuggestion,
  onNewSuggestion,
  onRejectSuggestion,
  onClose,
}: AIChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notifiedSuggestionIdsRef = useRef<Set<string>>(new Set());
  
  const {
    messages,
    isLoading,
    sendMessage,
    retryMessage,
    updateSuggestionStatus,
  } = useChatState();

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 将对话中的建议同步到外部（用于中间预览高亮）
  useEffect(() => {
    if (!onNewSuggestion) return;

    for (const message of messages) {
      const suggestion = message.suggestion;
      if (!suggestion) continue;
      if (notifiedSuggestionIdsRef.current.has(suggestion.id)) continue;
      notifiedSuggestionIdsRef.current.add(suggestion.id);
      onNewSuggestion(suggestion);
    }
  }, [messages, onNewSuggestion]);

  // 构建上下文 - 使用 useMemo 避免每次渲染都创建新对象
  const context: ChatContext = useMemo(() => ({
    resumeData,
    jdText: jdText || null,
  }), [resumeData, jdText]);

  // 发送消息
  const handleSend = useCallback((message: string) => {
    sendMessage(message, context);
  }, [sendMessage, context]);

  // 快捷操作选择
  const handleQuickAction = useCallback((template: string) => {
    // 直接发送快捷操作消息
    sendMessage(template, context);
  }, [sendMessage, context]);

  // 接受建议
  const handleAccept = useCallback((suggestion: EditSuggestion) => {
    // 找到包含这个建议的消息
    const messageWithSuggestion = messages.find(m => m.suggestion?.id === suggestion.id);
    if (messageWithSuggestion) {
      updateSuggestionStatus(messageWithSuggestion.id, 'accepted');
    }
    onNewSuggestion?.(suggestion);
    onApplySuggestion(suggestion);
  }, [messages, onNewSuggestion, updateSuggestionStatus, onApplySuggestion]);

  // 拒绝建议
  const handleReject = useCallback((suggestionId: string) => {
    const messageWithSuggestion = messages.find(m => m.suggestion?.id === suggestionId);
    if (messageWithSuggestion) {
      updateSuggestionStatus(messageWithSuggestion.id, 'rejected');
    }
    onRejectSuggestion?.(suggestionId);
  }, [messages, onRejectSuggestion, updateSuggestionStatus]);

  // 重试消息
  const handleRetry = useCallback((messageId: string) => {
    retryMessage(messageId, context);
  }, [retryMessage, context]);

  return (
    <div className="h-full flex flex-col bg-gray-800 text-gray-100">
      {/* 头部 */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <span>💬</span> AI 对话助手
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-auto p-3 custom-scrollbar">
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm text-center">用自然语言描述你想要的修改</p>
            <p className="text-xs mt-2 text-center text-gray-600">
              例如："让第一条工作经历更突出成果"
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onAccept={handleAccept}
            onReject={handleReject}
            onRetry={() => handleRetry(message.id)}
          />
        ))}

        {/* 加载指示器 */}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-700 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="animate-pulse">🤖</span>
                <span>AI 正在思考...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 快捷操作 */}
      <QuickActions onSelect={handleQuickAction} />

      {/* 输入区 */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading}
      />
    </div>
  );
}

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
  
  const { messages, isLoading, sendMessage, retryMessage, updateSuggestionStatus } = useChatState();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const context: ChatContext = useMemo(() => ({
    resumeData,
    jdText: jdText || null,
  }), [resumeData, jdText]);

  const handleSend = useCallback((message: string) => {
    sendMessage(message, context);
  }, [sendMessage, context]);

  const handleQuickAction = useCallback((template: string) => {
    sendMessage(template, context);
  }, [sendMessage, context]);

  const handleAccept = useCallback((suggestion: EditSuggestion) => {
    const messageWithSuggestion = messages.find(m => m.suggestion?.id === suggestion.id);
    if (messageWithSuggestion) {
      updateSuggestionStatus(messageWithSuggestion.id, 'accepted');
    }
    onNewSuggestion?.(suggestion);
    onApplySuggestion(suggestion);
  }, [messages, onNewSuggestion, updateSuggestionStatus, onApplySuggestion]);

  const handleReject = useCallback((suggestionId: string) => {
    const messageWithSuggestion = messages.find(m => m.suggestion?.id === suggestionId);
    if (messageWithSuggestion) {
      updateSuggestionStatus(messageWithSuggestion.id, 'rejected');
    }
    onRejectSuggestion?.(suggestionId);
  }, [messages, onRejectSuggestion, updateSuggestionStatus]);

  const handleRetry = useCallback((messageId: string) => {
    retryMessage(messageId, context);
  }, [retryMessage, context]);

  return (
    <div className="h-full flex flex-col bg-[#111318] text-gray-100 border-l border-white/[0.06]">
      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
        <h3 className="text-sm font-medium flex items-center gap-2 text-gray-200">
          <span>💬</span> AI 对话助手
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors text-lg">✕</button>
      </div>

      <div className="flex-1 overflow-auto p-3 custom-scrollbar">
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm text-center">用自然语言描述你想要的修改</p>
            <p className="text-xs mt-2 text-center text-gray-600">例如："让第一条工作经历更突出成果"</p>
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

        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="animate-pulse">🤖</span>
                <span>AI 正在思考...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <QuickActions onSelect={handleQuickAction} />
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}

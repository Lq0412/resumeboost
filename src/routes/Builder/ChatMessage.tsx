/**
 * 聊天消息组件
 */
import type { ChatMessageData, EditSuggestion } from './types';

interface ChatMessageProps {
  message: ChatMessageData;
  onAccept?: (suggestion: EditSuggestion) => void;
  onReject?: (suggestionId: string) => void;
  onRetry?: () => void;
}

export function ChatMessage({ message, onAccept, onReject, onRetry }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const isSending = message.status === 'sending';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 ${
          isUser
            ? isError
              ? 'bg-red-900/50 border border-red-500'
              : 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-100'
        } ${isSending ? 'opacity-70' : ''}`}
      >
        {/* 消息内容 */}
        <p className="text-xs whitespace-pre-wrap">{message.content}</p>

        {/* 发送中状态 */}
        {isSending && (
          <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
            <span className="animate-spin">⏳</span>
            <span>发送中...</span>
          </div>
        )}

        {/* 错误状态 */}
        {isError && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-red-300">发送失败</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                重试
              </button>
            )}
          </div>
        )}

        {/* 修改建议 */}
        {message.suggestion && (
          <SuggestionBlock
            suggestion={message.suggestion}
            onAccept={onAccept}
            onReject={onReject}
          />
        )}
      </div>
    </div>
  );
}

/**
 * 建议块组件
 */
interface SuggestionBlockProps {
  suggestion: EditSuggestion;
  onAccept?: (suggestion: EditSuggestion) => void;
  onReject?: (suggestionId: string) => void;
}

function SuggestionBlock({ suggestion, onAccept, onReject }: SuggestionBlockProps) {
  const isPending = suggestion.status === 'pending';
  const isAccepted = suggestion.status === 'accepted';
  const isRejected = suggestion.status === 'rejected';

  return (
    <div
      className={`mt-3 p-2 rounded border ${
        isAccepted
          ? 'bg-green-900/30 border-green-600'
          : isRejected
          ? 'bg-gray-800/50 border-gray-600 opacity-50'
          : 'bg-gray-800 border-gray-600'
      }`}
    >
      {/* 原文 */}
      <div className="mb-2">
        <span className="text-xs text-gray-400">原文：</span>
        <p
          className={`text-xs mt-0.5 ${
            isAccepted ? 'line-through text-gray-500' : 'text-gray-300'
          }`}
        >
          {suggestion.original}
        </p>
      </div>

      {/* 建议 */}
      <div className="mb-2">
        <span className="text-xs text-gray-400">建议：</span>
        <p className={`text-xs mt-0.5 ${isAccepted ? 'text-green-400' : 'text-green-300'}`}>
          {suggestion.suggested}
        </p>
      </div>

      {/* 原因 */}
      <div className="mb-2">
        <p className="text-xs text-yellow-400/80 flex items-start gap-1">
          <span>💡</span>
          <span>{suggestion.reason}</span>
        </p>
      </div>

      {/* 状态标签 */}
      {isAccepted && (
        <div className="text-xs text-green-400 flex items-center gap-1">
          <span>✓</span> 已接受
        </div>
      )}
      {isRejected && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span>✗</span> 已拒绝
        </div>
      )}

      {/* 操作按钮 */}
      {isPending && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onAccept?.(suggestion)}
            className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex items-center justify-center gap-1"
          >
            <span>✓</span> 接受
          </button>
          <button
            onClick={() => onReject?.(suggestion.id)}
            className="flex-1 px-2 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors flex items-center justify-center gap-1"
          >
            <span>✗</span> 拒绝
          </button>
        </div>
      )}
    </div>
  );
}

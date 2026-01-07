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
        className={`max-w-[85%] rounded-xl px-3 py-2 ${
          isUser
            ? isError
              ? 'bg-red-500/20 border border-red-500/30'
              : 'bg-teal-500/90 text-white shadow-[0_1px_0_rgba(0,0,0,0.2)]'
            : 'bg-white/[0.04] border border-white/[0.08] text-gray-100'
        } ${isSending ? 'opacity-70' : ''}`}
      >
        <p className="text-xs whitespace-pre-wrap">{message.content}</p>

        {isSending && (
          <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
            <span className="animate-spin">⏳</span>
            <span>发送中...</span>
          </div>
        )}

        {isError && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-red-300">发送失败</span>
            {onRetry && (
              <button onClick={onRetry} className="text-xs text-teal-400 hover:text-teal-300 underline">
                重试
              </button>
            )}
          </div>
        )}

        {message.suggestion && (
          <SuggestionBlock suggestion={message.suggestion} onAccept={onAccept} onReject={onReject} />
        )}
      </div>
    </div>
  );
}

function SuggestionBlock({ suggestion, onAccept, onReject }: {
  suggestion: EditSuggestion;
  onAccept?: (suggestion: EditSuggestion) => void;
  onReject?: (suggestionId: string) => void;
}) {
  const isPending = suggestion.status === 'pending';
  const isAccepted = suggestion.status === 'accepted';
  const isRejected = suggestion.status === 'rejected';

  return (
    <div className={`mt-3 p-2.5 rounded-lg border ${
      isAccepted ? 'bg-emerald-500/10 border-emerald-500/30' :
      isRejected ? 'bg-white/[0.01] border-white/[0.04] opacity-50' :
      'bg-white/[0.02] border-white/[0.06]'
    }`}>
      <div className="mb-2">
        <span className="text-xs text-gray-500">原文：</span>
        <p className={`text-xs mt-0.5 ${isAccepted ? 'line-through text-gray-600' : 'text-gray-400'}`}>
          {suggestion.original}
        </p>
      </div>

      <div className="mb-2">
        <span className="text-xs text-gray-500">建议：</span>
        <p className={`text-xs mt-0.5 ${isAccepted ? 'text-emerald-400' : 'text-emerald-300'}`}>
          {suggestion.suggested}
        </p>
      </div>

      <div className="mb-2">
        <p className="text-xs text-amber-400/70 flex items-start gap-1">
          <span>💡</span>
          <span>{suggestion.reason}</span>
        </p>
      </div>

      {isAccepted && <div className="text-xs text-emerald-400 flex items-center gap-1"><span>✓</span> 已接受</div>}
      {isRejected && <div className="text-xs text-gray-600 flex items-center gap-1"><span>✗</span> 已拒绝</div>}

      {isPending && (
        <div className="flex gap-2 mt-2">
          <button onClick={() => onAccept?.(suggestion)} className="flex-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1">
            <span>✓</span> 接受
          </button>
          <button onClick={() => onReject?.(suggestion.id)} className="flex-1 px-2 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] text-gray-300 text-xs rounded-lg transition-colors flex items-center justify-center gap-1">
            <span>✗</span> 拒绝
          </button>
        </div>
      )}
    </div>
  );
}

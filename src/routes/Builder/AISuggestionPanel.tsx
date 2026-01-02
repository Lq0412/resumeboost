/**
 * AI 建议面板 - 显示在右侧，列出所有建议
 */
import type { AISuggestion } from './types';

interface AISuggestionPanelProps {
  suggestions: AISuggestion[];
  isLoading: boolean;
  jdText: string;
  onJdChange: (text: string) => void;
  onAnalyze: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onLocate: (suggestion: AISuggestion) => void;
  onClose: () => void;
}

export function AISuggestionPanel({
  suggestions,
  isLoading,
  jdText,
  onJdChange,
  onAnalyze,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  onLocate,
  onClose,
}: AISuggestionPanelProps) {
  const pendingCount = suggestions.filter(s => s.status === 'pending').length;
  const acceptedCount = suggestions.filter(s => s.status === 'accepted').length;
  const rejectedCount = suggestions.filter(s => s.status === 'rejected').length;

  return (
    <div className="h-full flex flex-col bg-gray-800 text-gray-100">
      {/* 头部 */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <span>✨</span> AI 智能改写
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* JD 输入区 */}
      <div className="p-3 border-b border-gray-700">
        <label className="text-xs text-gray-400 mb-1 block">目标职位 JD（可选）</label>
        <textarea
          value={jdText}
          onChange={(e) => onJdChange(e.target.value)}
          placeholder="粘贴职位描述，AI 将针对性优化..."
          className="w-full h-20 px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500"
        />
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span> 分析中...
            </>
          ) : (
            <>
              <span>🔍</span> 开始 AI 分析
            </>
          )}
        </button>
      </div>

      {/* 统计和批量操作 */}
      {suggestions.length > 0 && (
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-400">
              共 {suggestions.length} 条建议
            </span>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <span className="text-yellow-400">⏳ {pendingCount} 待处理</span>
              )}
              {acceptedCount > 0 && (
                <span className="text-green-400">✓ {acceptedCount}</span>
              )}
              {rejectedCount > 0 && (
                <span className="text-gray-500">✗ {rejectedCount}</span>
              )}
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="flex gap-2">
              <button
                onClick={onAcceptAll}
                className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
              >
                ✓ 全部接受
              </button>
              <button
                onClick={onRejectAll}
                className="flex-1 px-2 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
              >
                ✗ 全部拒绝
              </button>
            </div>
          )}
        </div>
      )}

      {/* 建议列表 */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {suggestions.length === 0 && !isLoading && (
          <div className="p-6 text-center text-gray-500">
            <div className="text-3xl mb-2">💡</div>
            <p className="text-sm">点击上方按钮开始 AI 分析</p>
            <p className="text-xs mt-1">AI 将为你的简历提供改进建议</p>
          </div>
        )}

        {isLoading && (
          <div className="p-6 text-center text-gray-400">
            <div className="text-3xl mb-2 animate-pulse">🤖</div>
            <p className="text-sm">AI 正在分析你的简历...</p>
            <p className="text-xs mt-1">这可能需要几秒钟</p>
          </div>
        )}

        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={onAccept}
            onReject={onReject}
            onLocate={onLocate}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 单条建议卡片
 */
interface SuggestionCardProps {
  suggestion: AISuggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onLocate: (suggestion: AISuggestion) => void;
}

function SuggestionCard({ suggestion, onAccept, onReject, onLocate }: SuggestionCardProps) {
  const isPending = suggestion.status === 'pending';
  const isAccepted = suggestion.status === 'accepted';
  const isRejected = suggestion.status === 'rejected';

  return (
    <div
      className={`p-3 border-b border-gray-700 transition-colors ${
        isAccepted ? 'bg-green-900/20' : isRejected ? 'bg-gray-900/50 opacity-50' : 'hover:bg-gray-700/50'
      }`}
    >
      {/* 位置标签 */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => onLocate(suggestion)}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <span>📍</span>
          {suggestion.sectionLabel}
          {suggestion.itemIndex !== undefined && ` #${suggestion.itemIndex + 1}`}
          {suggestion.bulletIndex !== undefined && ` · 描述${suggestion.bulletIndex + 1}`}
        </button>
        {isAccepted && <span className="text-xs text-green-400">✓ 已接受</span>}
        {isRejected && <span className="text-xs text-gray-500">✗ 已拒绝</span>}
      </div>

      {/* 原文 */}
      <div className="mb-2">
        <span className="text-xs text-gray-500">原文：</span>
        <p className={`text-xs mt-0.5 ${isAccepted ? 'line-through text-gray-500' : 'text-gray-300'}`}>
          {suggestion.original}
        </p>
      </div>

      {/* 建议 */}
      <div className="mb-2">
        <span className="text-xs text-gray-500">建议：</span>
        <p className={`text-xs mt-0.5 ${isAccepted ? 'text-green-400' : 'text-green-300'}`}>
          {suggestion.suggested}
        </p>
      </div>

      {/* 原因 */}
      <div className="mb-3">
        <p className="text-xs text-yellow-400/80 flex items-start gap-1">
          <span>💡</span>
          <span>{suggestion.reason}</span>
        </p>
      </div>

      {/* 操作按钮 */}
      {isPending && (
        <div className="flex gap-2">
          <button
            onClick={() => onAccept(suggestion.id)}
            className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex items-center justify-center gap-1"
          >
            <span>✓</span> 接受
          </button>
          <button
            onClick={() => onReject(suggestion.id)}
            className="flex-1 px-2 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors flex items-center justify-center gap-1"
          >
            <span>✗</span> 拒绝
          </button>
        </div>
      )}
    </div>
  );
}

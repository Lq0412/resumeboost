/**
 * AI 建议面板 - 显示在右侧，支持"建议"和"对话"两种模式
 */
import React from 'react';
import type { AISuggestion, EditSuggestion } from './types';
import { AIChatPanel } from './AIChatPanel';
import type { ChatContext } from './useChatState';
import { CompactTextarea } from './tabs/shared';

type AIMode = 'suggestions' | 'chat';

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
  resumeData?: ChatContext['resumeData'];
  onApplyChatSuggestion?: (suggestion: EditSuggestion) => void;
  onRegisterChatSuggestion?: (suggestion: EditSuggestion) => void;
  onRejectChatSuggestion?: (suggestionId: string) => void;
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
  resumeData,
  onApplyChatSuggestion,
  onRegisterChatSuggestion,
  onRejectChatSuggestion,
}: AISuggestionPanelProps) {
  const [mode, setMode] = React.useState<AIMode>('suggestions');
  const pendingCount = suggestions.filter(s => s.status === 'pending').length;
  const acceptedCount = suggestions.filter(s => s.status === 'accepted').length;
  const rejectedCount = suggestions.filter(s => s.status === 'rejected').length;

  if (mode === 'chat' && resumeData && onApplyChatSuggestion) {
    return (
      <div className="h-full flex flex-col bg-[#111318] text-gray-100 border-l border-white/[0.06]">
        <div className="flex border-b border-white/[0.06]">
          <button
            onClick={() => setMode('suggestions')}
            className="flex-1 px-3 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
          >
            ✨ 建议
          </button>
          <button
            onClick={() => setMode('chat')}
            className="flex-1 px-3 py-2.5 text-xs font-medium text-teal-400 bg-white/[0.02] border-b-2 border-teal-500"
          >
            💬 对话
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <AIChatPanel
            resumeData={resumeData}
            jdText={jdText}
            onApplySuggestion={onApplyChatSuggestion}
            onNewSuggestion={onRegisterChatSuggestion}
            onRejectSuggestion={onRejectChatSuggestion}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#111318] text-gray-100 border-l border-white/[0.06]">
      {resumeData && onApplyChatSuggestion && (
        <div className="flex border-b border-white/[0.06]">
          <button
            onClick={() => setMode('suggestions')}
            className="flex-1 px-3 py-2.5 text-xs font-medium text-teal-400 bg-white/[0.02] border-b-2 border-teal-500"
          >
            ✨ 建议
          </button>
          <button
            onClick={() => setMode('chat')}
            className="flex-1 px-3 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
          >
            💬 对话
          </button>
        </div>
      )}

      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
        <h3 className="text-sm font-medium flex items-center gap-2 text-gray-200">
          <span>✨</span> AI 智能改写
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors text-lg">
          ✕
        </button>
      </div>

      <div className="p-3 border-b border-white/[0.06]">
        <label className="text-xs text-gray-500 mb-1.5 block">目标职位 JD（可选）</label>
        <CompactTextarea
          value={jdText}
          onChange={onJdChange}
          placeholder="粘贴职位描述，AI 将针对性优化..."
          className="h-20"
          minHeightClass="min-h-[80px]"
        />
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="w-full mt-2.5 px-3 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 ring-1 ring-teal-400/30"
        >
          {isLoading ? (
            <><span className="animate-spin">⏳</span> 分析中...</>
          ) : (
            <><span>🔍</span> 开始 AI 分析</>
          )}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="p-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500">共 {suggestions.length} 条建议</span>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && <span className="text-amber-400">⏳ {pendingCount} 待处理</span>}
              {acceptedCount > 0 && <span className="text-emerald-400">✓ {acceptedCount}</span>}
              {rejectedCount > 0 && <span className="text-gray-600">✗ {rejectedCount}</span>}
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="flex gap-2">
              <button onClick={onAcceptAll} className="flex-1 px-2 py-1.5 bg-emerald-500/90 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors shadow-[0_1px_0_rgba(0,0,0,0.2)]">
                ✓ 全部接受
              </button>
              <button onClick={onRejectAll} className="flex-1 px-2 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 text-xs rounded-lg transition-colors">
                ✗ 全部拒绝
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto custom-scrollbar">
        {suggestions.length === 0 && !isLoading && (
          <div className="p-6 text-center text-gray-500">
            <div className="text-3xl mb-2">💡</div>
            <p className="text-sm">点击上方按钮开始 AI 分析</p>
            <p className="text-xs mt-1 text-gray-600">AI 将为你的简历提供改进建议</p>
          </div>
        )}

        {isLoading && (
          <div className="p-6 text-center text-gray-400">
            <div className="text-3xl mb-2 animate-pulse">🤖</div>
            <p className="text-sm">AI 正在分析你的简历...</p>
            <p className="text-xs mt-1 text-gray-600">这可能需要几秒钟</p>
          </div>
        )}

        {suggestions.map((suggestion) => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} onAccept={onAccept} onReject={onReject} onLocate={onLocate} />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion, onAccept, onReject, onLocate }: {
  suggestion: AISuggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onLocate: (suggestion: AISuggestion) => void;
}) {
  const isPending = suggestion.status === 'pending';
  const isAccepted = suggestion.status === 'accepted';
  const isRejected = suggestion.status === 'rejected';

  return (
    <div className={`p-3 border-b border-white/[0.06] transition-colors ${
      isAccepted ? 'bg-emerald-500/5' : isRejected ? 'bg-white/[0.01] opacity-50' : 'hover:bg-white/[0.03]'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => onLocate(suggestion)} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
          <span>📍</span>
          {suggestion.sectionLabel}
          {suggestion.itemIndex !== undefined && ` #${suggestion.itemIndex + 1}`}
          {suggestion.bulletIndex !== undefined && ` · 描述${suggestion.bulletIndex + 1}`}
        </button>
        {isAccepted && <span className="text-xs text-emerald-400">✓ 已接受</span>}
        {isRejected && <span className="text-xs text-gray-600">✗ 已拒绝</span>}
      </div>

      <div className="mb-2">
        <span className="text-xs text-gray-600">原文：</span>
        <p className={`text-xs mt-0.5 ${isAccepted ? 'line-through text-gray-600' : 'text-gray-400'}`}>{suggestion.original}</p>
      </div>

      <div className="mb-2">
        <span className="text-xs text-gray-600">建议：</span>
        <p className={`text-xs mt-0.5 ${isAccepted ? 'text-emerald-400' : 'text-emerald-300'}`}>{suggestion.suggested}</p>
      </div>

      <div className="mb-3">
        <p className="text-xs text-amber-400/70 flex items-start gap-1">
          <span>💡</span>
          <span>{suggestion.reason}</span>
        </p>
      </div>

      {isPending && (
        <div className="flex gap-2">
          <button onClick={() => onAccept(suggestion.id)} className="flex-1 px-2 py-1.5 bg-emerald-500/90 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
            <span>✓</span> 接受
          </button>
          <button onClick={() => onReject(suggestion.id)} className="flex-1 px-2 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 text-xs rounded-lg transition-colors flex items-center justify-center gap-1">
            <span>✗</span> 拒绝
          </button>
        </div>
      )}
    </div>
  );
}

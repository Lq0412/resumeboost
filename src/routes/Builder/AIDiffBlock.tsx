/**
 * AI Diff 块组件 - 在预览区显示原文和建议的对比
 */
import type { AISuggestion } from './types';

interface AIDiffBlockProps {
  suggestion: AISuggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function AIDiffBlock({ suggestion, onAccept, onReject }: AIDiffBlockProps) {
  if (suggestion.status !== 'pending') {
    // 已处理的建议，显示最终结果
    return (
      <span className={suggestion.status === 'accepted' ? 'text-green-700' : ''}>
        {suggestion.status === 'accepted' ? suggestion.suggested : suggestion.original}
      </span>
    );
  }

  return (
    <span className="relative inline">
      {/* 原文 - 红色删除线 */}
      <span className="bg-red-100 text-red-700 line-through decoration-red-400">
        {suggestion.original}
      </span>
      
      {/* 建议内容 - 绿色背景 */}
      <span className="bg-green-100 text-green-700 ml-1">
        {suggestion.suggested}
      </span>
      
      {/* 操作按钮 */}
      <span className="inline-flex items-center gap-1 ml-2 align-middle">
        <button
          onClick={(e) => { e.stopPropagation(); onAccept(suggestion.id); }}
          className="w-5 h-5 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded text-xs transition-colors"
          title="接受修改"
        >
          ✓
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onReject(suggestion.id); }}
          className="w-5 h-5 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded text-xs transition-colors"
          title="拒绝修改"
        >
          ✗
        </button>
      </span>
    </span>
  );
}

/**
 * 多行 Diff 块 - 用于较长的内容
 */
interface AIDiffBlockMultilineProps {
  suggestion: AISuggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function AIDiffBlockMultiline({ suggestion, onAccept, onReject }: AIDiffBlockMultilineProps) {
  if (suggestion.status !== 'pending') {
    return (
      <span className={suggestion.status === 'accepted' ? 'text-green-700' : ''}>
        {suggestion.status === 'accepted' ? suggestion.suggested : suggestion.original}
      </span>
    );
  }

  return (
    <div className="relative border-l-4 border-blue-400 pl-2 my-1 bg-blue-50/50 rounded-r">
      {/* 原文 */}
      <div className="flex items-start gap-2">
        <span className="text-red-500 font-mono text-xs mt-0.5">-</span>
        <span className="bg-red-100 text-red-700 line-through decoration-red-400 flex-1">
          {suggestion.original}
        </span>
      </div>
      
      {/* 建议 */}
      <div className="flex items-start gap-2 mt-1">
        <span className="text-green-500 font-mono text-xs mt-0.5">+</span>
        <span className="bg-green-100 text-green-700 flex-1">
          {suggestion.suggested}
        </span>
      </div>
      
      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-2 mt-2 pb-1">
        <button
          onClick={(e) => { e.stopPropagation(); onAccept(suggestion.id); }}
          className="px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs transition-colors flex items-center gap-1"
        >
          <span>✓</span> 接受
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onReject(suggestion.id); }}
          className="px-2 py-0.5 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs transition-colors flex items-center gap-1"
        >
          <span>✗</span> 拒绝
        </button>
      </div>
    </div>
  );
}

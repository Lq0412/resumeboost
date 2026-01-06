/**
 * 聊天输入组件
 */
import { useState, useCallback, type KeyboardEvent } from 'react';

// 最大输入长度
const MAX_INPUT_LENGTH = 500;

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');

  const trimmedValue = value.trim();
  const charCount = value.length;
  const isOverLimit = charCount > MAX_INPUT_LENGTH;
  const canSend = trimmedValue.length > 0 && !isOverLimit && !disabled;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(trimmedValue);
    setValue('');
  }, [canSend, trimmedValue, onSend]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="p-3 border-t border-gray-700">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || '描述你想要的修改，如：让第一条工作经历更突出成果'}
          className={`w-full h-16 px-3 py-2 pr-16 text-xs bg-gray-700 border rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            isOverLimit ? 'border-red-500' : 'border-gray-600'
          }`}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="absolute right-2 bottom-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
        >
          发送
        </button>
      </div>
      <div className={`text-right text-xs mt-1 ${isOverLimit ? 'text-red-400' : 'text-gray-500'}`}>
        {charCount}/{MAX_INPUT_LENGTH}
      </div>
    </div>
  );
}

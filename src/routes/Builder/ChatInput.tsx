/**
 * 聊天输入组件
 */
import { useState, useCallback, type KeyboardEvent } from 'react';
import { CompactTextarea } from './tabs/shared';

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
    <div className="p-3 border-t border-white/[0.04]">
      <div className="relative">
        <CompactTextarea
          value={value}
          onChange={setValue}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || '描述你想要的修改，如：让第一条工作经历更突出成果'}
          className={`h-16 pr-16 px-3 py-2 ${isOverLimit ? 'border-red-500/50' : 'border-white/[0.08]'}`}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="absolute right-2 bottom-2 px-3 py-1.5 bg-teal-500/90 hover:bg-teal-500 disabled:bg-white/[0.06] disabled:text-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors shadow-[0_1px_0_rgba(0,0,0,0.2)]"
        >
          发送
        </button>
      </div>
      <div className={`text-right text-xs mt-1 ${isOverLimit ? 'text-red-400' : 'text-gray-600'}`}>
        {charCount}/{MAX_INPUT_LENGTH}
      </div>
    </div>
  );
}

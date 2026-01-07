import type { ButtonHTMLAttributes, FocusEvent, FormEvent, KeyboardEvent, ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
}

type InlineButtonTone = 'primary' | 'danger' | 'muted';

const inlineButtonTone: Record<InlineButtonTone, string> = {
  primary: 'text-teal-400 hover:text-teal-300',
  danger: 'text-rose-400 hover:text-rose-300',
  muted: 'text-gray-500 hover:text-gray-300',
};

const inlineButtonSize = {
  xs: 'text-xs',
  sm: 'text-sm',
};

interface InlineButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: InlineButtonTone;
  size?: keyof typeof inlineButtonSize;
}

export function InlineButton({
  tone = 'primary',
  size = 'xs',
  className = '',
  type = 'button',
  ...props
}: InlineButtonProps) {
  return (
    <button
      type={type}
      className={`${inlineButtonSize[size]} ${inlineButtonTone[tone]} font-medium transition-colors ${className}`}
      {...props}
    />
  );
}

export function SectionHeader({ title, onAdd, addLabel = '+ 添加' }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs font-medium text-gray-300">{title}</span>
      {onAdd && <InlineButton onClick={onAdd}>{addLabel}</InlineButton>}
    </div>
  );
}

interface FormCardProps {
  children: ReactNode;
  className?: string;
}

export function FormCard({ children, className = '' }: FormCardProps) {
  return (
    <div className={`p-3 bg-white/[0.025] rounded-xl border border-white/[0.08] shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-white/[0.12] space-y-2 ${className}`}>
      {children}
    </div>
  );
}

interface FormCardHeaderProps {
  index: number;
  showRemove?: boolean;
  onRemove?: () => void;
}

export function FormCardHeader({ index, showRemove = true, onRemove }: FormCardHeaderProps) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-gray-600">#{index}</span>
      {showRemove && onRemove && (
        <InlineButton tone="danger" onClick={onRemove}>
          删除
        </InlineButton>
      )}
    </div>
  );
}

interface CompactTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onResize?: (event: FormEvent<HTMLTextAreaElement>) => void;
  onFocus?: (event: FocusEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  rows?: number;
  name?: string;
  id?: string;
  maxLength?: number;
  autoFocus?: boolean;
  placeholder?: string;
  minHeightClass?: string;
  className?: string;
}

export function CompactTextarea({
  value,
  onChange,
  onResize,
  onFocus,
  onKeyDown,
  disabled,
  rows,
  name,
  id,
  maxLength,
  autoFocus,
  placeholder,
  minHeightClass = 'min-h-[40px]',
  className = '',
}: CompactTextareaProps) {
  return (
    <textarea
      value={value}
      name={name}
      id={id}
      rows={rows}
      maxLength={maxLength}
      autoFocus={autoFocus}
      disabled={disabled}
      onChange={(event) => {
        onChange(event.target.value);
        onResize?.(event);
      }}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      className={`w-full px-2.5 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg resize-none ${minHeightClass} shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400/60 focus:bg-white/[0.06] transition-all placeholder:text-gray-500 text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      placeholder={placeholder}
    />
  );
}

interface EmptyStateProps {
  text?: string;
}

export function EmptyState({ text = '暂无' }: EmptyStateProps) {
  return <p className="text-xs text-gray-600 py-4 text-center">{text}</p>;
}

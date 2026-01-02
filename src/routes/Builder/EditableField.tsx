import { useState, useRef, useEffect } from 'react';

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  children: React.ReactNode;
}

export function EditableField({ 
  value, 
  onChange, 
  className = '', 
  placeholder = '点击编辑',
  multiline = false,
  children 
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const inputClass = `
      w-full px-2 py-1 text-inherit font-inherit 
      border-2 border-blue-500 rounded 
      bg-white shadow-lg outline-none
      ${className}
    `;

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={inputClass}
          style={{ minHeight: '60px', resize: 'vertical' }}
          placeholder={placeholder}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputClass}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span 
      onClick={handleClick}
      className={`
        cursor-pointer 
        hover:bg-blue-100 hover:outline hover:outline-2 hover:outline-blue-400 
        rounded px-0.5 -mx-0.5
        transition-all duration-150
        ${!value ? 'text-gray-400 italic' : ''}
        ${className}
      `}
      title="点击编辑"
    >
      {children || value || placeholder}
    </span>
  );
}

// 可编辑的列表项
interface EditableListItemProps {
  value: string;
  onChange: (value: string) => void;
  onDelete?: () => void;
  className?: string;
  placeholder?: string;
}

export function EditableListItem({
  value,
  onChange,
  onDelete,
  className = '',
  placeholder = '点击编辑'
}: EditableListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`
          w-full px-2 py-1 
          border-2 border-blue-500 rounded 
          bg-white shadow-lg outline-none
          ${className}
        `}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      className={`
        group relative inline-flex items-center gap-1
        cursor-pointer 
        hover:bg-blue-100 hover:outline hover:outline-2 hover:outline-blue-400 
        rounded px-0.5 -mx-0.5
        transition-all duration-150
        ${!value ? 'text-gray-400 italic' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsEditing(true)}
      title="点击编辑"
    >
      <span>{value || placeholder}</span>
      {isHovered && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-red-500 hover:text-red-700 bg-white rounded-full shadow text-xs"
        >
          ×
        </button>
      )}
    </span>
  );
}

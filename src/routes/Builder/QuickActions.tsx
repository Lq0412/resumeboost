/**
 * 快捷操作组件
 */
import type { QuickActionTemplate } from './types';

// 默认快捷操作
const DEFAULT_QUICK_ACTIONS: QuickActionTemplate[] = [
  {
    id: 'optimize-work',
    label: '优化工作经历',
    template: '帮我优化第一条工作经历的描述，让它更突出成果',
    icon: '💼',
  },
  {
    id: 'add-data',
    label: '添加量化数据',
    template: '帮我在工作经历中添加一些量化数据，让成果更有说服力',
    icon: '📊',
  },
  {
    id: 'professional',
    label: '更专业',
    template: '帮我让简历描述更专业、更有力',
    icon: '✨',
  },
  {
    id: 'simplify',
    label: '精简内容',
    template: '帮我精简一下简历内容，让它更简洁',
    icon: '✂️',
  },
];

interface QuickActionsProps {
  onSelect: (template: string) => void;
  actions?: QuickActionTemplate[];
}

export function QuickActions({ onSelect, actions = DEFAULT_QUICK_ACTIONS }: QuickActionsProps) {
  return (
    <div className="px-3 py-2 border-t border-gray-700 flex flex-wrap gap-1.5">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onSelect(action.template)}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-full transition-colors flex items-center gap-1"
        >
          {action.icon && <span>{action.icon}</span>}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

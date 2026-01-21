/**
 * 快捷操作组件
 */
import { Briefcase, BarChart3, Sparkles, Scissors } from 'lucide-react';
import type { QuickActionTemplate } from './types';

const DEFAULT_QUICK_ACTIONS: QuickActionTemplate[] = [
  { id: 'optimize-work', label: '优化工作经历', template: '帮我优化第一条工作经历的描述，让它更突出成果', icon: 'briefcase' },
  { id: 'add-data', label: '添加量化数据', template: '帮我在工作经历中添加一些量化数据，让成果更有说服力', icon: 'chart' },
  { id: 'professional', label: '更专业', template: '帮我让简历描述更专业、更有力', icon: 'sparkles' },
  { id: 'simplify', label: '精简内容', template: '帮我精简一下简历内容，让它更简洁', icon: 'scissors' },
];

const iconMap = {
  briefcase: Briefcase,
  chart: BarChart3,
  sparkles: Sparkles,
  scissors: Scissors,
};

interface QuickActionsProps {
  onSelect: (template: string) => void;
  actions?: QuickActionTemplate[];
}

export function QuickActions({ onSelect, actions = DEFAULT_QUICK_ACTIONS }: QuickActionsProps) {
  return (
    <div className="px-3 py-2 border-t border-white/[0.04] flex flex-wrap gap-1.5">
      {actions.map((action) => {
        const Icon = action.icon ? iconMap[action.icon as keyof typeof iconMap] : null;
        return (
          <button
            key={action.id}
            onClick={() => onSelect(action.template)}
            className="px-2.5 py-1 text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-400 hover:text-gray-200 rounded-full transition-colors flex items-center gap-1.5"
          >
            {Icon && <Icon className="w-3 h-3" />}
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}

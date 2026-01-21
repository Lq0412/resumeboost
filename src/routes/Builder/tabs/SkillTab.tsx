import type { FocusEvent, FormEvent } from 'react';
import { CompactTextarea } from './shared';

interface SkillTabProps {
  skills: string;
  onUpdateSkills: (value: string) => void;
  onResize: (event: FormEvent<HTMLTextAreaElement>) => void;
  onFocus: (event: FocusEvent<HTMLTextAreaElement>) => void;
}

export function SkillTab({
  skills,
  onUpdateSkills,
  onResize,
  onFocus,
}: SkillTabProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-300">专业技能</span>
      </div>
      <CompactTextarea
        value={skills}
        onChange={onUpdateSkills}
        onResize={onResize}
        onFocus={onFocus}
        placeholder="输入你的专业技能，支持换行..."
        minHeightClass="min-h-[120px]"
      />
      <p className="text-xs text-gray-600">提示：每行一个技能类别，如：前端开发：React, Vue, TypeScript</p>
    </div>
  );
}

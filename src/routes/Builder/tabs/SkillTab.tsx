import type { FocusEvent, FormEvent } from 'react';
import { CompactInput } from '../FormInputs';
import type { SkillCategory } from '../useBuilderForm';
import { CompactTextarea, FormCard, FormCardHeader, SectionHeader } from './shared';

interface SkillTabProps {
  skillCategories?: SkillCategory[];
  skills: string;
  onAddCategory: () => void;
  onRemoveCategory: (id: string) => void;
  onUpdateCategory: (id: string, field: keyof Omit<SkillCategory, 'id'>, value: string) => void;
  onUpdateSkills: (value: string) => void;
  onResize: (event: FormEvent<HTMLTextAreaElement>) => void;
  onFocus: (event: FocusEvent<HTMLTextAreaElement>) => void;
}

export function SkillTab({
  skillCategories,
  skills,
  onAddCategory,
  onRemoveCategory,
  onUpdateCategory,
  onUpdateSkills,
  onResize,
  onFocus,
}: SkillTabProps) {
  const categories = skillCategories ?? [];
  const hasCategories = categories.length > 0;

  return (
    <div className="space-y-2">
      <SectionHeader title="专业技能" onAdd={onAddCategory} />
      {categories.map((cat, idx) => (
        <FormCard key={cat.id}>
          <FormCardHeader
            index={idx + 1}
            showRemove={categories.length > 1}
            onRemove={() => onRemoveCategory(cat.id)}
          />
          <CompactInput value={cat.name} onChange={(value) => onUpdateCategory(cat.id, 'name', value)} placeholder="技能名称" />
          <CompactTextarea
            value={cat.description}
            onChange={(value) => onUpdateCategory(cat.id, 'description', value)}
            onResize={onResize}
            onFocus={onFocus}
            placeholder="技能详细描述"
          />
        </FormCard>
      ))}
      {!hasCategories && (
        <CompactTextarea
          value={skills}
          onChange={onUpdateSkills}
          onResize={onResize}
          onFocus={onFocus}
          placeholder="技能列表..."
          minHeightClass="min-h-[60px]"
        />
      )}
    </div>
  );
}

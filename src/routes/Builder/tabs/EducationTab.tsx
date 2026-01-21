import type { FocusEvent, FormEvent } from 'react';
import { CompactDateRange, CompactInput } from '../FormInputs';
import type { EducationEntry } from '../useBuilderForm';
import { FormCard, FormCardHeader, SectionHeader, CompactTextarea } from './shared';

interface EducationTabProps {
  education: EducationEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof Omit<EducationEntry, 'id'>, value: string) => void;
  onResize: (event: FormEvent<HTMLTextAreaElement>) => void;
  onFocus: (event: FocusEvent<HTMLTextAreaElement>) => void;
}

export function EducationTab({
  education,
  onAdd,
  onRemove,
  onUpdate,
  onResize,
  onFocus,
}: EducationTabProps) {
  return (
    <div className="space-y-2">
      <SectionHeader title="教育经历" onAdd={onAdd} />
      {education.map((edu, idx) => (
        <FormCard key={edu.id}>
          <FormCardHeader
            index={idx + 1}
            showRemove={education.length > 1}
            onRemove={() => onRemove(edu.id)}
          />
          <CompactInput value={edu.school} onChange={(value) => onUpdate(edu.id, 'school', value)} placeholder="学校" />
          <div className="flex gap-1">
            <CompactInput value={edu.major || ''} onChange={(value) => onUpdate(edu.id, 'major', value)} placeholder="专业" />
            <CompactInput value={edu.degree || ''} onChange={(value) => onUpdate(edu.id, 'degree', value)} placeholder="学历" />
          </div>
          <CompactInput value={edu.ranking || ''} onChange={(value) => onUpdate(edu.id, 'ranking', value)} placeholder="综合测评排名（如 1/120）" />
          <CompactDateRange
            startYear={edu.startYear}
            startMonth={edu.startMonth}
            endYear={edu.endYear}
            endMonth={edu.endMonth}
            onStartChange={(year, month) => {
              onUpdate(edu.id, 'startYear', year);
              onUpdate(edu.id, 'startMonth', month);
            }}
            onEndChange={(year, month) => {
              onUpdate(edu.id, 'endYear', year);
              onUpdate(edu.id, 'endMonth', month);
            }}
          />
          <CompactTextarea
            value={edu.description || ''}
            onChange={(value) => onUpdate(edu.id, 'description', value)}
            onResize={onResize}
            onFocus={onFocus}
            placeholder="校园经历、获奖情况等"
          />
        </FormCard>
      ))}
    </div>
  );
}

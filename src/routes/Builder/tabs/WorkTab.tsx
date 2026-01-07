import type { FocusEvent, FormEvent } from 'react';
import { CompactDateRange, CompactInput } from '../FormInputs';
import type { ExperienceEntry } from '../useBuilderForm';
import { CompactTextarea, EmptyState, FormCard, FormCardHeader, InlineButton, SectionHeader } from './shared';

interface WorkTabProps {
  experience: ExperienceEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof Omit<ExperienceEntry, 'id' | 'bullets'>, value: string) => void;
  onUpdateBullet: (id: string, index: number, value: string) => void;
  onAddBullet: (id: string) => void;
  onRemoveBullet: (id: string, index: number) => void;
  onResize: (event: FormEvent<HTMLTextAreaElement>) => void;
  onFocus: (event: FocusEvent<HTMLTextAreaElement>) => void;
}

export function WorkTab({
  experience,
  onAdd,
  onRemove,
  onUpdate,
  onUpdateBullet,
  onAddBullet,
  onRemoveBullet,
  onResize,
  onFocus,
}: WorkTabProps) {
  return (
    <div className="space-y-2">
      <SectionHeader title="工作经历" onAdd={onAdd} />
      {experience.length === 0 && <EmptyState />}
      {experience.map((exp, idx) => (
        <FormCard key={exp.id}>
          <FormCardHeader index={idx + 1} onRemove={() => onRemove(exp.id)} />
          <div className="flex gap-1">
            <CompactInput value={exp.company} onChange={(value) => onUpdate(exp.id, 'company', value)} placeholder="公司" />
            <CompactInput value={exp.position} onChange={(value) => onUpdate(exp.id, 'position', value)} placeholder="职位" />
          </div>
          <CompactInput value={exp.location || ''} onChange={(value) => onUpdate(exp.id, 'location', value)} placeholder="地点" />
          <CompactDateRange
            startYear={exp.startYear}
            startMonth={exp.startMonth}
            endYear={exp.endYear}
            endMonth={exp.endMonth}
            onStartChange={(year, month) => {
              onUpdate(exp.id, 'startYear', year);
              onUpdate(exp.id, 'startMonth', month);
            }}
            onEndChange={(year, month) => {
              onUpdate(exp.id, 'endYear', year);
              onUpdate(exp.id, 'endMonth', month);
            }}
            showPresent
          />
          {exp.bullets.map((bullet, bulletIndex) => (
            <div key={bulletIndex} className="flex gap-1">
              <CompactTextarea
                value={bullet}
                onChange={(value) => onUpdateBullet(exp.id, bulletIndex, value)}
                onResize={onResize}
                onFocus={onFocus}
                placeholder={`工作内容 ${bulletIndex + 1}`}
                className="flex-1"
              />
              {exp.bullets.length > 1 && (
                <InlineButton
                  tone="danger"
                  onClick={() => onRemoveBullet(exp.id, bulletIndex)}
                  className="px-1"
                  aria-label={`删除工作内容 ${bulletIndex + 1}`}
                >
                  ×
                </InlineButton>
              )}
            </div>
          ))}
          {exp.bullets.length < 5 && (
            <InlineButton onClick={() => onAddBullet(exp.id)}>+ 描述</InlineButton>
          )}
        </FormCard>
      ))}
    </div>
  );
}

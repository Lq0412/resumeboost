import type { FocusEvent, FormEvent } from 'react';
import { CompactDateRange, CompactInput } from '../FormInputs';
import type { ProjectEntry } from '../useBuilderForm';
import { CompactTextarea, EmptyState, FormCard, FormCardHeader, InlineButton, SectionHeader } from './shared';

interface ProjectTabProps {
  projects: ProjectEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof Omit<ProjectEntry, 'id' | 'bullets'>, value: string) => void;
  onUpdateBullet: (id: string, index: number, value: string) => void;
  onAddBullet: (id: string) => void;
  onRemoveBullet: (id: string, index: number) => void;
  onResize: (event: FormEvent<HTMLTextAreaElement>) => void;
  onFocus: (event: FocusEvent<HTMLTextAreaElement>) => void;
}

export function ProjectTab({
  projects,
  onAdd,
  onRemove,
  onUpdate,
  onUpdateBullet,
  onAddBullet,
  onRemoveBullet,
  onResize,
  onFocus,
}: ProjectTabProps) {
  return (
    <div className="space-y-2">
      <SectionHeader title="项目经历" onAdd={onAdd} />
      {projects.length === 0 && <EmptyState />}
      {projects.map((proj, idx) => (
        <FormCard key={proj.id}>
          <FormCardHeader index={idx + 1} onRemove={() => onRemove(proj.id)} />
          <div className="flex gap-1">
            <CompactInput value={proj.name} onChange={(value) => onUpdate(proj.id, 'name', value)} placeholder="项目名" />
            <CompactInput value={proj.role || ''} onChange={(value) => onUpdate(proj.id, 'role', value)} placeholder="角色" />
          </div>
          <CompactInput value={proj.link || ''} onChange={(value) => onUpdate(proj.id, 'link', value)} placeholder="链接" />
          <CompactDateRange
            startYear={proj.startYear}
            startMonth={proj.startMonth}
            endYear={proj.endYear}
            endMonth={proj.endMonth}
            onStartChange={(year, month) => {
              onUpdate(proj.id, 'startYear', year);
              onUpdate(proj.id, 'startMonth', month);
            }}
            onEndChange={(year, month) => {
              onUpdate(proj.id, 'endYear', year);
              onUpdate(proj.id, 'endMonth', month);
            }}
          />
          {proj.bullets.map((bullet, bulletIndex) => (
            <div key={bulletIndex} className="flex gap-1">
              <CompactTextarea
                value={bullet}
                onChange={(value) => onUpdateBullet(proj.id, bulletIndex, value)}
                onResize={onResize}
                onFocus={onFocus}
                placeholder={`描述 ${bulletIndex + 1}`}
                className="flex-1"
              />
              {proj.bullets.length > 1 && (
                <InlineButton
                  tone="danger"
                  onClick={() => onRemoveBullet(proj.id, bulletIndex)}
                  className="px-1"
                  aria-label={`删除项目描述 ${bulletIndex + 1}`}
                >
                  ×
                </InlineButton>
              )}
            </div>
          ))}
          {proj.bullets.length < 5 && (
            <InlineButton onClick={() => onAddBullet(proj.id)}>+ 描述</InlineButton>
          )}
        </FormCard>
      ))}
    </div>
  );
}

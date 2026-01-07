import { CompactInput } from '../FormInputs';
import type { Award } from '../useBuilderForm';
import { EmptyState, InlineButton, SectionHeader } from './shared';

interface AwardTabProps {
  awards?: Award[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof Omit<Award, 'id'>, value: string) => void;
}

export function AwardTab({ awards, onAdd, onRemove, onUpdate }: AwardTabProps) {
  return (
    <div className="space-y-2">
      <SectionHeader title="荣誉奖项" onAdd={onAdd} />
      {(!awards || awards.length === 0) && <EmptyState />}
      {awards?.map((award) => (
        <div key={award.id} className="flex gap-1.5 items-center">
          <CompactInput value={award.name} onChange={(value) => onUpdate(award.id, 'name', value)} placeholder="奖项" />
          <input
            value={award.time || ''}
            onChange={(event) => onUpdate(award.id, 'time', event.target.value)}
            className="w-16 px-2 py-1.5 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-gray-300 placeholder:text-gray-600"
            placeholder="时间"
          />
          <InlineButton
            tone="danger"
            onClick={() => onRemove(award.id)}
            aria-label={`删除奖项 ${award.name || ''}`}
          >
            ×
          </InlineButton>
        </div>
      ))}
    </div>
  );
}

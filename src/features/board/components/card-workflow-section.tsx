import { CircleCheck, Play, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import Select from '@/core/components/atoms/select';
import type BoardList from '@/features/board/entities/board-list';
import type CardTriggers from '@/features/board/entities/card-triggers';
import {
  isTriggerFlagged,
  type CardTriggerKind,
  type CardTriggerTarget,
} from '@/features/board/entities/card-triggers';

const DONT_MOVE_VALUE = '';
const DELETED_COLUMN_VALUE = 'deleted-column';

type CardWorkflowSectionProps = {
  triggers: CardTriggers | null;
  lists: readonly BoardList[];
  onChangeTrigger: (triggerKind: CardTriggerKind, listId: string | null) => void;
};

const TRIGGER_ROWS: readonly { kind: CardTriggerKind; label: string; icon: ReactNode }[] = [
  { kind: 'started', label: 'When started, move to', icon: <Play /> },
  { kind: 'finished', label: 'When finished, move to', icon: <CircleCheck /> },
];

const selectValueOf = (triggerTarget: CardTriggerTarget | null): string => {
  if (triggerTarget === null) return DONT_MOVE_VALUE;
  return triggerTarget.listId ?? DELETED_COLUMN_VALUE;
};

type TriggerRowProps = {
  kind: CardTriggerKind;
  label: string;
  icon: ReactNode;
  triggerTarget: CardTriggerTarget | null;
  lists: readonly BoardList[];
  isLoading: boolean;
  onChangeTrigger: CardWorkflowSectionProps['onChangeTrigger'];
};

const TriggerRow = ({
  kind,
  label,
  icon,
  triggerTarget,
  lists,
  isLoading,
  onChangeTrigger,
}: TriggerRowProps) => {
  const selectId = `card-trigger-${kind}`;
  const isFlagged = isTriggerFlagged(triggerTarget);
  return (
    <div className="grid gap-1.5 sm:grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)] sm:items-center sm:gap-3">
      <label
        htmlFor={selectId}
        className="flex items-center gap-1.5 text-[13px] text-muted-foreground [&_svg]:size-3.5"
      >
        {icon}
        {label}
      </label>
      <div className="grid min-w-0 gap-1.5">
        <Select
          key={`${kind}-${selectValueOf(triggerTarget)}`}
          id={selectId}
          defaultValue={selectValueOf(triggerTarget)}
          disabled={isLoading}
          aria-invalid={isFlagged}
          aria-describedby={isFlagged ? `${selectId}-flag` : undefined}
          onChange={(changeEvent) => {
            const chosenValue = changeEvent.currentTarget.value;
            onChangeTrigger(kind, chosenValue === DONT_MOVE_VALUE ? null : chosenValue);
          }}
          className="h-9 aria-invalid:border-warning"
        >
          <option value={DONT_MOVE_VALUE}>Don’t move</option>
          {isFlagged ? (
            <option value={DELETED_COLUMN_VALUE} disabled>
              A deleted column
            </option>
          ) : null}
          {lists.map((boardList) => (
            <option key={boardList.id} value={boardList.id}>
              {boardList.name}
            </option>
          ))}
        </Select>
        {isFlagged ? (
          <p
            id={`${selectId}-flag`}
            className="flex items-center gap-1.5 text-xs font-medium text-warning"
          >
            <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            Its column was deleted. Pick another.
          </p>
        ) : null}
      </div>
    </div>
  );
};

const CardWorkflowSection = ({ triggers, lists, onChangeTrigger }: CardWorkflowSectionProps) => (
  <section className="grid gap-3" aria-labelledby="card-workflow-heading">
    <div className="grid gap-0.5">
      <h3 id="card-workflow-heading" className="text-[13px] font-semibold text-foreground">
        Workflow
      </h3>
      <p className="text-xs text-muted-foreground">
        Moves this card by itself when work on it starts, and when its last task is done.
      </p>
    </div>
    <div className="grid gap-3 sm:gap-2">
      {TRIGGER_ROWS.map((triggerRow) => (
        <TriggerRow
          key={triggerRow.kind}
          kind={triggerRow.kind}
          label={triggerRow.label}
          icon={triggerRow.icon}
          triggerTarget={triggers?.[triggerRow.kind] ?? null}
          lists={lists}
          isLoading={triggers === null}
          onChangeTrigger={onChangeTrigger}
        />
      ))}
    </div>
  </section>
);

export default CardWorkflowSection;

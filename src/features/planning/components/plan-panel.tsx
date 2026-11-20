import { AlertTriangle, Check, Pin, X } from 'lucide-react';
import Badge from '@/core/components/atoms/badge';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import joinClassNames from '@/core/class-names';
import { formatInZone } from '@/core/zoned-time';
import { formatClock } from '@/features/calendar/entities/event-time';
import { UNPLACED_REASON_LABELS, type Plan } from '@/features/planning/entities/plan';

type PlanPanelProps = {
  plan: Plan;
  timeZone: string;
  selectedTaskId: string | null;
  isAskingPlan: boolean;
  isAcceptingPlan: boolean;
  onSelectBlock: (taskId: string) => void;
  onAcceptBlock: (taskId: string) => void;
  onRejectBlock: (taskId: string) => void;
  onAcceptAll: () => void;
  onDiscard: () => void;
};

const PlanPanel = ({
  plan,
  timeZone,
  selectedTaskId,
  isAskingPlan,
  isAcceptingPlan,
  onSelectBlock,
  onAcceptBlock,
  onRejectBlock,
  onAcceptAll,
  onDiscard,
}: PlanPanelProps) => {
  const isBusy = isAskingPlan || isAcceptingPlan;

  return (
    <section
      aria-label="Plan"
      aria-busy={isBusy}
      className="grid gap-4 rounded-2xl border-2 border-dashed border-primary/50 bg-background p-4 shadow-soft"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 className="text-sm font-semibold text-foreground">
            Plan · {plan.dayCount === 7 ? 'Next 7 days' : 'Today'}
          </h2>
          <p className="text-[13px] text-muted-foreground">
            {isAskingPlan
              ? 'Finding times…'
              : plan.blocks.length === 0
                ? 'Nothing fits right now.'
                : `${plan.blocks.length} ${plan.blocks.length === 1 ? 'block' : 'blocks'}, not saved yet. Drag one to move it.`}
          </p>
        </div>
      </div>
      {plan.blocks.length === 0 ? null : (
        <ul className="grid gap-1" aria-label="Proposed blocks">
          {plan.blocks.map((proposedBlock) => (
            <li
              key={proposedBlock.taskId}
              className={joinClassNames(
                'flex items-center gap-2 rounded-[10px] px-2 py-1.5 transition-colors duration-150 hover:bg-surface',
                selectedTaskId === proposedBlock.taskId &&
                  'bg-primary-soft/50 hover:bg-primary-soft/60',
              )}
            >
              <button
                type="button"
                onClick={() => onSelectBlock(proposedBlock.taskId)}
                className="grid min-w-0 flex-1 rounded-md text-left focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:outline-none"
              >
                <span className="truncate text-sm font-medium text-foreground">
                  {proposedBlock.taskName}
                </span>
                <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="shrink-0 font-mono tabular-nums">
                    {formatInZone(proposedBlock.startsAt, timeZone, {
                      weekday: 'short',
                    })}{' '}
                    {formatClock(proposedBlock.startsAt, timeZone)}–
                    {formatClock(proposedBlock.endsAt, timeZone)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{proposedBlock.groupName}</span>
                </span>
              </button>
              {proposedBlock.isPinned ? (
                <Pin aria-label="Moved" className="size-3.5 shrink-0 text-muted-foreground" />
              ) : null}
              {proposedBlock.isLate ? <Badge tone="warning">Late</Badge> : null}
              <IconButton
                label={`Accept ${proposedBlock.taskName}`}
                disabled={isBusy}
                onClick={() => onAcceptBlock(proposedBlock.taskId)}
                className="text-success hover:bg-success-soft hover:text-success"
              >
                <Check />
              </IconButton>
              <IconButton
                label={`Reject ${proposedBlock.taskName}`}
                disabled={isBusy}
                onClick={() => onRejectBlock(proposedBlock.taskId)}
              >
                <X />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      {plan.unplaced.length === 0 ? null : (
        <div className="grid gap-2 border-t border-border pt-3">
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
            <AlertTriangle aria-hidden="true" className="size-3.5 text-muted-foreground" />
            Not planned
          </h3>
          <ul className="grid gap-1.5" aria-label="Not planned">
            {plan.unplaced.map((unplacedTask) => (
              <li key={unplacedTask.taskId} className="flex items-center gap-2 text-[13px]">
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {unplacedTask.taskName}
                  <span className="text-muted-foreground"> · {unplacedTask.groupName}</span>
                </span>
                <Badge>{UNPLACED_REASON_LABELS[unplacedTask.reason]}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <Button variant="ghost" size="sm" onClick={onDiscard}>
          Discard
        </Button>
        <Button size="sm" disabled={isBusy || plan.blocks.length === 0} onClick={onAcceptAll}>
          <Check />
          Accept all
        </Button>
      </div>
    </section>
  );
};

export default PlanPanel;

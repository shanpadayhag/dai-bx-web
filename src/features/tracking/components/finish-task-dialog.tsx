'use client';

import { CalendarCheck2, Clock3, Hourglass, PencilLine } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import Button from '@/core/components/atoms/button';
import Checkbox from '@/core/components/atoms/checkbox';
import Input from '@/core/components/atoms/input';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import joinClassNames from '@/core/class-names';
import type RunningItem from '@/features/tracking/entities/running-item';

type EndTimeChoice = 'last-check-in' | 'now' | 'custom';

type EndTimeOptionProps = {
  choice: EndTimeChoice;
  selectedChoice: EndTimeChoice;
  onSelect: (choice: EndTimeChoice) => void;
  icon: ReactNode;
  title: ReactNode;
  detail: string;
  children?: ReactNode;
};

const EndTimeOption = ({
  choice,
  selectedChoice,
  onSelect,
  icon,
  title,
  detail,
  children,
}: EndTimeOptionProps) => {
  const isSelected = choice === selectedChoice;
  return (
    <label
      className={joinClassNames(
        'grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border p-3 transition-colors duration-150',
        isSelected
          ? 'border-primary bg-primary-soft/60'
          : 'border-border hover:border-border-strong',
      )}
    >
      <span
        className={joinClassNames(
          'mt-0.5 inline-flex size-8 items-center justify-center rounded-lg [&_svg]:size-4',
          isSelected
            ? 'bg-primary text-primary-foreground'
            : 'bg-surface-strong text-muted-foreground',
        )}
      >
        {icon}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-[13px] text-muted-foreground">{detail}</span>
        {children}
      </span>
      <input
        type="radio"
        name="end-time"
        checked={isSelected}
        onChange={() => onSelect(choice)}
        className="mt-1 size-4 accent-primary"
      />
    </label>
  );
};

const formatClock = (moment: Date): string =>
  `${String(moment.getHours()).padStart(2, '0')}:${String(moment.getMinutes()).padStart(2, '0')}`;

const dateInputValue = (moment: Date): string =>
  `${moment.getFullYear()}-${String(moment.getMonth() + 1).padStart(2, '0')}-${String(moment.getDate()).padStart(2, '0')}`;

type FinishTaskDialogProps = {
  runningItem: RunningItem;
  now: Date;
  missedCheckInSince: Date | null;
};

const FinishTaskDialog = ({ runningItem, now, missedCheckInSince }: FinishTaskDialogProps) => {
  const lastAnsweredAt = runningItem.lastAnsweredAt;
  const [selectedChoice, setSelectedChoice] = useState<EndTimeChoice>(
    missedCheckInSince !== null && lastAnsweredAt !== null ? 'last-check-in' : 'now',
  );
  const [isMarkingDone, setIsMarkingDone] = useState(true);
  const isTask = runningItem.sourceKind === 'task';
  const submitLabel = isTask && isMarkingDone ? 'Finish task' : 'Stop';

  return (
    <PopoverPanel id="finish-task-dialog" label={`Finish ${runningItem.title}`}>
      <div className="grid gap-5 p-5">
        <div className="grid gap-1">
          <p className="text-xs font-medium text-muted-foreground">
            {isTask ? 'Task' : 'Card'} · {runningItem.sourceName}
          </p>
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-foreground">
            {runningItem.title}
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Started at{' '}
            <span className="font-mono tabular-nums">{formatClock(runningItem.startedAt)}</span>.
            Pick when it really ended, and the calendar event closes there.
          </p>
        </div>
        {missedCheckInSince === null ? null : (
          <p className="flex items-start gap-2 rounded-xl bg-warning-soft px-3 py-2.5 text-[13px] text-warning">
            <Hourglass className="mt-0.5 size-4 shrink-0" />
            You didn’t answer the check-in since {formatClock(missedCheckInSince)}, so you may have
            stepped away.
          </p>
        )}
        <fieldset className="grid gap-2">
          <legend className="sr-only">End time</legend>
          {lastAnsweredAt === null ? null : (
            <EndTimeOption
              choice="last-check-in"
              selectedChoice={selectedChoice}
              onSelect={setSelectedChoice}
              icon={<Clock3 />}
              title={
                <>
                  Your last check-in ·{' '}
                  <span className="font-mono tabular-nums">{formatClock(lastAnsweredAt)}</span>
                </>
              }
              detail="The last time you said you were on it."
            />
          )}
          <EndTimeOption
            choice="now"
            selectedChoice={selectedChoice}
            onSelect={setSelectedChoice}
            icon={<CalendarCheck2 />}
            title={
              <>
                Now · <span className="font-mono tabular-nums">{formatClock(now)}</span>
              </>
            }
            detail="Use this if you were on it the whole time."
          />
          <EndTimeOption
            choice="custom"
            selectedChoice={selectedChoice}
            onSelect={setSelectedChoice}
            icon={<PencilLine />}
            title="Set it myself"
            detail="Any moment between the start and now."
          >
            <span className="mt-2 grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-2">
              <Input
                type="date"
                defaultValue={dateInputValue(now)}
                aria-label="End day"
                className="h-9"
                onFocus={() => setSelectedChoice('custom')}
              />
              <Input
                type="time"
                defaultValue={formatClock(now)}
                aria-label="End time"
                className="h-9"
                onFocus={() => setSelectedChoice('custom')}
              />
            </span>
          </EndTimeOption>
        </fieldset>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          {isTask ? (
            <Checkbox
              id="finish-mark-done"
              label="Mark it done"
              checked={isMarkingDone}
              onChange={(changeEvent) => setIsMarkingDone(changeEvent.target.checked)}
            />
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" popoverTarget="finish-task-dialog" popoverTargetAction="hide">
              Keep it running
            </Button>
            <Button>{submitLabel}</Button>
          </div>
        </div>
      </div>
    </PopoverPanel>
  );
};

export default FinishTaskDialog;

import { CalendarCheck2, Clock3, Hourglass, PencilLine } from 'lucide-react';
import type { ReactNode } from 'react';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import joinClassNames from '@/core/class-names';
import TaskSession from '@/features/tracking/entities/task-session';

type EndTimeOptionProps = {
  icon: ReactNode;
  title: string;
  detail: string;
  isSelected?: boolean;
  children?: ReactNode;
};

const EndTimeOption = ({
  icon,
  title,
  detail,
  isSelected = false,
  children,
}: EndTimeOptionProps) => (
  <label
    className={joinClassNames(
      'grid cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-3 rounded-xl border p-3 transition-colors duration-150',
      isSelected ? 'border-primary bg-primary-soft/60' : 'border-border hover:border-border-strong',
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
    <span className="grid gap-0.5">
      <span className="text-sm font-medium text-foreground">{title}</span>
      <span className="text-[13px] text-muted-foreground">{detail}</span>
      {children}
    </span>
    <input
      type="radio"
      name="end-time"
      defaultChecked={isSelected}
      className="mt-1 size-4 accent-primary"
    />
  </label>
);

type FinishTaskDialogProps = {
  taskSession: TaskSession;
};

const FinishTaskDialog = ({ taskSession }: FinishTaskDialogProps) => (
  <PopoverPanel id="finish-task-dialog" label="Finish task">
    <div className="grid gap-5 p-5">
      <div className="grid gap-1">
        <p className="text-xs font-medium text-muted-foreground">Finishing</p>
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-foreground">
          {taskSession.taskName}
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Started at <span className="font-mono tabular-nums">{taskSession.startedAt}</span>. Pick
          when it really ended, and the calendar event closes there.
        </p>
      </div>
      {taskSession.missedCheckInAt ? (
        <p className="flex items-start gap-2 rounded-xl bg-warning-soft px-3 py-2.5 text-[13px] text-warning">
          <Hourglass className="mt-0.5 size-4 shrink-0" />
          You didn’t answer the {taskSession.missedCheckInAt} check-in, so you may have stepped
          away.
        </p>
      ) : null}
      <fieldset className="grid gap-2">
        <legend className="sr-only">End time</legend>
        <EndTimeOption
          icon={<Clock3 />}
          title={`Your last check-in · ${taskSession.lastCheckInAt}`}
          detail="Suggested: the last time you said you were on it."
          isSelected
        />
        <EndTimeOption
          icon={<CalendarCheck2 />}
          title={`Now · ${taskSession.currentTime}`}
          detail="Use this if you were working the whole time."
        />
        <EndTimeOption
          icon={<PencilLine />}
          title="Set it myself"
          detail="Pick the exact end time."
        >
          <Input
            isFullWidth={false}
            type="time"
            defaultValue="17:35"
            aria-label="End time"
            className="mt-2 h-9 w-32"
          />
        </EndTimeOption>
      </fieldset>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" popoverTarget="finish-task-dialog" popoverTargetAction="hide">
          Keep it running
        </Button>
        <Button>Finish task</Button>
      </div>
    </div>
  </PopoverPanel>
);

export default FinishTaskDialog;

import { ArrowDown, CalendarClock, CalendarDays, Flag, Play } from 'lucide-react';
import { useState } from 'react';
import Badge from '@/core/components/atoms/badge';
import CompletionCircle from '@/core/components/atoms/completion-circle';
import IconButton from '@/core/components/atoms/icon-button';
import { formatClockInZone } from '@/core/time-zone';
import { formatEstimate } from '@/features/tasks/entities/estimate';
import { formatDue, isDuePast } from '@/features/tasks/entities/task-planning';
import type UpNextTask from '@/features/today/entities/up-next-task';

const UP_NEXT_SHOWN_COUNT = 5;

type UpNextListProps = {
  upNextTasks: readonly UpNextTask[] | null;
  timeZone: string;
  todayDate: string;
  runningSourceIds: ReadonlySet<string>;
  onStartTask: (taskId: string) => void;
  onTickTask: (taskId: string) => void;
};

const UpNextList = ({
  upNextTasks,
  timeZone,
  todayDate,
  runningSourceIds,
  onStartTask,
  onTickTask,
}: UpNextListProps) => {
  const [isShowingAll, setIsShowingAll] = useState(false);
  const shownTasks =
    upNextTasks === null || isShowingAll ? upNextTasks : upNextTasks.slice(0, UP_NEXT_SHOWN_COUNT);
  const hiddenCount = upNextTasks === null ? 0 : upNextTasks.length - UP_NEXT_SHOWN_COUNT;

  return (
    <section
      aria-labelledby="today-up-next-title"
      className="grid gap-2 rounded-2xl border border-border bg-background p-3 shadow-soft"
    >
      <h2
        id="today-up-next-title"
        className="px-2 pt-1.5 text-[13px] font-semibold text-foreground"
      >
        Up next
      </h2>
      {shownTasks === null ? (
        <p className="px-2 pb-2 text-[13px] text-muted-foreground">Loading…</p>
      ) : shownTasks.length === 0 ? (
        <p className="px-2 pb-2 text-[13px] text-muted-foreground">
          Nothing due right now. Tasks show up here when their group is due or a block is planned
          for today.
        </p>
      ) : (
        <ul className="grid gap-0.5">
          {shownTasks.map((upNextTask) => {
            const plannedBlock = upNextTask.plannedBlock;
            return (
              <li
                key={upNextTask.taskId}
                className="group/row flex min-h-11 items-center gap-3 rounded-[10px] px-2 py-1.5 transition-colors duration-150 hover:bg-surface"
              >
                <CompletionCircle
                  isDone={false}
                  label={`Mark ${upNextTask.name} as done`}
                  onToggle={() => onTickTask(upNextTask.taskId)}
                />
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className="truncate text-sm text-foreground">{upNextTask.name}</span>
                  <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="truncate">{upNextTask.groupName}</span>
                    {plannedBlock === null ? null : (
                      <Badge
                        tone={upNextTask.isMissed ? 'warning' : 'primary'}
                        className="font-mono tabular-nums"
                      >
                        <CalendarClock aria-hidden="true" />
                        {upNextTask.isMissed ? <span className="font-sans">Missed</span> : null}
                        {formatClockInZone(plannedBlock.startsAt, timeZone)}–
                        {formatClockInZone(plannedBlock.endsAt, timeZone)}
                      </Badge>
                    )}
                    {upNextTask.due === null ? null : (
                      <Badge tone={isDuePast(upNextTask.due, todayDate) ? 'warning' : 'neutral'}>
                        <CalendarDays aria-hidden="true" />
                        <span className="sr-only">Due </span>
                        {formatDue(upNextTask.due, todayDate)}
                      </Badge>
                    )}
                    {upNextTask.priority === 'high' ? (
                      <Badge tone="danger">
                        <Flag aria-hidden="true" />
                        High
                      </Badge>
                    ) : null}
                    {upNextTask.priority === 'low' ? (
                      <Badge>
                        <ArrowDown aria-hidden="true" />
                        Low
                      </Badge>
                    ) : null}
                  </span>
                </span>
                {upNextTask.estimateMinutes === null ? null : (
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {formatEstimate(upNextTask.estimateMinutes)}
                  </span>
                )}
                <IconButton
                  label={`Start ${upNextTask.name}`}
                  tone="primary"
                  disabled={runningSourceIds.has(upNextTask.taskId)}
                  onClick={() => onStartTask(upNextTask.taskId)}
                >
                  <Play className="fill-current" />
                </IconButton>
              </li>
            );
          })}
        </ul>
      )}
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setIsShowingAll((currentlyShowingAll) => !currentlyShowingAll)}
          className="mx-2 mb-1 justify-self-start rounded-md text-xs text-primary hover:underline focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:outline-none"
        >
          {isShowingAll ? 'Show fewer' : `Show all (${upNextTasks?.length ?? 0})`}
        </button>
      ) : null}
    </section>
  );
};

export default UpNextList;

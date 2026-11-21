import { Check, Play } from 'lucide-react';
import Link from 'next/link';
import { categoryColorStyle } from '@/core/category';
import joinClassNames from '@/core/class-names';
import IconButton from '@/core/components/atoms/icon-button';
import { formatClockInZone } from '@/core/time-zone';
import { calendarPath } from '@/features/calendar/entities/calendar-address';
import type AgendaRow from '@/features/today/entities/agenda-row';

type TodayAgendaProps = {
  agendaRows: readonly AgendaRow[] | null;
  timeZone: string;
  todayDate: string;
  runningSourceIds: ReadonlySet<string>;
  onStartTask: (taskId: string) => void;
};

const kindLabels = {
  planned: 'Planned',
  tracked: 'Tracked',
  running: 'Running',
} as const;

const TodayAgenda = ({
  agendaRows,
  timeZone,
  todayDate,
  runningSourceIds,
  onStartTask,
}: TodayAgendaProps) => (
  <section
    aria-labelledby="today-agenda-title"
    className="grid gap-4 rounded-2xl border border-border bg-background p-5 shadow-soft"
  >
    <div className="flex items-center justify-between">
      <h2 id="today-agenda-title" className="text-[13px] font-semibold text-foreground">
        On the calendar
      </h2>
      <Link href={calendarPath('day', todayDate)} className="text-xs text-primary hover:underline">
        Day view
      </Link>
    </div>
    {agendaRows === null ? (
      <p className="text-[13px] text-muted-foreground">Loading…</p>
    ) : agendaRows.length === 0 ? (
      <p className="text-[13px] text-muted-foreground">Nothing on the calendar today.</p>
    ) : (
      <ol className="grid">
        {agendaRows.map((agendaRow, agendaIndex) => {
          const linkedTask = agendaRow.linkedTask;
          return (
            <li
              key={agendaRow.id}
              className="relative grid grid-cols-[44px_14px_1fr_auto] items-start gap-3 pb-3 last:pb-0"
            >
              <span
                className={joinClassNames(
                  'pt-px font-mono text-xs tabular-nums',
                  agendaRow.isPast ? 'text-muted-foreground/70' : 'text-muted-foreground',
                )}
              >
                {formatClockInZone(agendaRow.startsAt, timeZone)}
              </span>
              <span className="relative flex justify-center pt-1">
                <span
                  style={
                    agendaRow.category === null ? undefined : categoryColorStyle(agendaRow.category)
                  }
                  className={joinClassNames(
                    'relative z-[1] size-2.5 rounded-full',
                    agendaRow.category === null
                      ? 'bg-border-strong'
                      : agendaRow.kind === 'planned'
                        ? 'category-soft'
                        : 'category-swatch',
                    agendaRow.kind === 'running' && 'ring-4 ring-foreground/10',
                    agendaRow.isPast && 'opacity-50',
                  )}
                />
                {agendaIndex < agendaRows.length - 1 ? (
                  <span aria-hidden="true" className="absolute top-4 -bottom-3 w-px bg-border" />
                ) : null}
              </span>
              <span className="grid min-w-0 gap-0.5">
                <span
                  className={joinClassNames(
                    'truncate text-sm',
                    agendaRow.kind === 'running' && 'font-medium text-foreground',
                    agendaRow.kind !== 'running' &&
                      (agendaRow.isPast ? 'text-muted-foreground/80' : 'text-foreground'),
                  )}
                >
                  {agendaRow.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {kindLabels[agendaRow.kind]}
                  {agendaRow.endsAt === null
                    ? null
                    : ` · until ${formatClockInZone(agendaRow.endsAt, timeZone)}`}
                </span>
              </span>
              {linkedTask === null ? null : linkedTask.isDone ? (
                <span className="inline-flex h-8 items-center gap-1 px-1 text-xs text-success">
                  <Check aria-hidden="true" className="size-3.5" />
                  Done
                </span>
              ) : runningSourceIds.has(linkedTask.id) ? null : (
                <IconButton
                  label={`Start ${agendaRow.title}`}
                  tone="primary"
                  onClick={() => onStartTask(linkedTask.id)}
                >
                  <Play className="fill-current" />
                </IconButton>
              )}
            </li>
          );
        })}
      </ol>
    )}
  </section>
);

export default TodayAgenda;

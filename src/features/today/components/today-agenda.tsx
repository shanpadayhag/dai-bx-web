import Link from 'next/link';
import joinClassNames from '@/core/class-names';
import AgendaItem from '@/features/today/entities/agenda-item';

const kindDotClassNames: Record<AgendaItem['kind'], string> = {
  tracked: 'bg-primary',
  running: 'bg-primary ring-4 ring-primary/20',
  planned: 'border-2 border-primary/50 bg-background',
};

type TodayAgendaProps = {
  agendaItems: AgendaItem[];
};

const TodayAgenda = ({ agendaItems }: TodayAgendaProps) => (
  <section className="grid gap-4 rounded-2xl border border-border bg-background p-5 shadow-soft">
    <div className="flex items-center justify-between">
      <h2 className="text-[13px] font-semibold text-foreground">On the calendar</h2>
      <Link href="/calendar" className="text-xs text-primary hover:underline">
        Week view
      </Link>
    </div>
    <ol className="grid">
      {agendaItems.map((agendaItem, agendaIndex) => (
        <li
          key={agendaItem.id}
          className="relative grid grid-cols-[44px_14px_1fr] items-start gap-3 pb-4 last:pb-0"
        >
          <span className="pt-px font-mono text-xs text-muted-foreground tabular-nums">
            {agendaItem.timeLabel}
          </span>
          <span className="relative flex justify-center pt-1">
            <span
              className={joinClassNames(
                'relative z-[1] size-2.5 rounded-full',
                kindDotClassNames[agendaItem.kind],
              )}
            />
            {agendaIndex < agendaItems.length - 1 ? (
              <span aria-hidden="true" className="absolute top-4 -bottom-4 w-px bg-border" />
            ) : null}
          </span>
          <span
            className={joinClassNames(
              'text-sm',
              agendaItem.kind === 'running'
                ? 'font-medium text-foreground'
                : 'text-muted-foreground',
            )}
          >
            {agendaItem.title}
          </span>
        </li>
      ))}
    </ol>
  </section>
);

export default TodayAgenda;

import {
  CalendarDays,
  Check,
  ChevronRight,
  KanbanSquare,
  ListTree,
  Play,
  Square,
  Sun,
} from 'lucide-react';

const previewTasks = [
  { name: 'Design the marketing site', isDone: true, depth: 1 },
  { name: 'Build the changelog', isDone: false, depth: 1 },
  { name: 'Write the v3 changelog', isDone: false, depth: 2, isTracking: true },
  { name: 'Add the past releases', isDone: true, depth: 2 },
  { name: 'Design the calendar week view', isDone: false, depth: 1 },
] as const;

const previewHours = ['15:00', '16:00', '17:00', '18:00', '19:00'] as const;

const HeroProductPreview = () => (
  <div className="relative mx-auto w-full max-w-5xl">
    <div
      aria-hidden="true"
      className="absolute inset-x-10 -bottom-10 h-40 rounded-full bg-glow/50 blur-[80px]"
    />
    <div
      role="img"
      aria-label="DaiBX: a nested task list where Write the v3 changelog is being tracked, beside a calendar where its event grows in real time"
      className="relative overflow-hidden rounded-[22px] border border-border bg-background/90 p-1.5 shadow-[0_40px_120px_-40px_rgb(36_86_240/0.45),0_1px_0_rgb(255_255_255/0.6)_inset] backdrop-blur"
    >
      <div className="flex items-center gap-1.5 px-3 py-2.5">
        <span className="size-2.5 rounded-full bg-border-strong" />
        <span className="size-2.5 rounded-full bg-border-strong" />
        <span className="size-2.5 rounded-full bg-border-strong" />
        <span className="ml-3 hidden h-6 flex-1 items-center rounded-md bg-surface px-3 font-mono text-[11px] text-muted-foreground sm:flex">
          app.daibx.dev/tasks
        </span>
      </div>
      <div className="grid overflow-hidden rounded-2xl border border-border bg-surface md:grid-cols-[170px_1fr_220px]">
        <div className="hidden gap-0.5 border-r border-border p-3 md:grid md:content-start">
          {[
            { label: 'Today', icon: Sun },
            { label: 'Tasks', icon: ListTree, isActive: true },
            { label: 'Board', icon: KanbanSquare },
            { label: 'Calendar', icon: CalendarDays },
          ].map((previewLink) => (
            <span
              key={previewLink.label}
              className={
                previewLink.isActive
                  ? 'flex h-8 items-center gap-2 rounded-lg bg-background px-2 text-[13px] font-medium text-foreground shadow-soft'
                  : 'flex h-8 items-center gap-2 rounded-lg px-2 text-[13px] text-muted-foreground'
              }
            >
              <previewLink.icon
                className={previewLink.isActive ? 'size-4 text-primary' : 'size-4'}
              />
              {previewLink.label}
            </span>
          ))}
        </div>
        <div className="grid content-start gap-1 bg-background p-3 sm:p-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-semibold text-foreground">Ship the v3 frontend</span>
            <span className="text-xs text-muted-foreground tabular-nums">2/5</span>
          </div>
          {previewTasks.map((previewTask) => (
            <div
              key={previewTask.name}
              className={
                'isTracking' in previewTask
                  ? 'flex h-10 items-center gap-2.5 rounded-lg bg-primary-soft px-2'
                  : 'flex h-10 items-center gap-2.5 rounded-lg px-2'
              }
              style={{ marginLeft: (previewTask.depth - 1) * 22 }}
            >
              {previewTask.name === 'Build the changelog' ? (
                <ChevronRight className="size-3.5 rotate-90 text-muted-foreground" />
              ) : (
                <span className="size-3.5" />
              )}
              <span
                className={
                  previewTask.isDone
                    ? 'inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground'
                    : 'size-4 rounded-full border-[1.5px] border-border-strong'
                }
              >
                {previewTask.isDone ? <Check className="size-2.5" strokeWidth={3.5} /> : null}
              </span>
              <span
                className={
                  previewTask.isDone
                    ? 'flex-1 truncate text-[13px] text-muted-foreground line-through'
                    : 'flex-1 truncate text-[13px] text-foreground'
                }
              >
                {previewTask.name}
              </span>
              {'isTracking' in previewTask ? (
                <span className="inline-flex h-6 items-center gap-1.5 rounded-md bg-primary px-2 text-[11px] font-medium text-primary-foreground">
                  <Square className="size-2.5 fill-current" />
                  <span className="font-mono tabular-nums">1:42:08</span>
                </span>
              ) : previewTask.isDone ? null : (
                <Play className="size-3.5 fill-current text-primary/70" />
              )}
            </div>
          ))}
        </div>
        <div className="hidden border-l border-border bg-background p-3 md:block">
          <div className="flex items-baseline justify-between pb-2">
            <span className="text-[13px] font-semibold text-foreground">Thu 22</span>
            <span className="text-[11px] text-muted-foreground">Calendar</span>
          </div>
          <div className="relative grid">
            {previewHours.map((previewHour) => (
              <div key={previewHour} className="h-12 border-t border-border">
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                  {previewHour}
                </span>
              </div>
            ))}
            <div className="absolute top-[64px] right-0 left-10 h-[86px]">
              <div className="absolute inset-x-0 top-0 animate-track-grow overflow-hidden rounded-lg bg-primary px-2 py-1.5 text-primary-foreground shadow-glow">
                <p className="truncate text-[11px] font-medium">Write the v3 changelog</p>
                <p className="font-mono text-[10px] tabular-nums opacity-80">16:20 – now</p>
              </div>
            </div>
            <div className="absolute top-[150px] right-0 left-8 flex items-center">
              <span className="size-1.5 rounded-full bg-danger" />
              <span className="h-px flex-1 bg-danger" />
            </div>
            <div className="absolute top-[200px] right-0 left-10 rounded-lg border border-primary/35 bg-primary-soft/70 px-2 py-1.5">
              <p className="truncate text-[11px] font-medium text-primary-soft-foreground">
                Review AFK flow
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default HeroProductPreview;

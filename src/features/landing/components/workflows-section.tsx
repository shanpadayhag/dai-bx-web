import { CalendarPlus, ClipboardCheck, History, MoveRight } from 'lucide-react';
import AccentWords from '@/features/landing/components/accent-words';
import SectionHeading from '@/features/landing/components/section-heading';

const workflowSteps = [
  { icon: ClipboardCheck, label: 'Reset the checklist' },
  { icon: MoveRight, label: 'Move the card to To do' },
  { icon: CalendarPlus, label: 'Block Saturday 14:00' },
  { icon: History, label: 'Record how long it took' },
] as const;

const pastRuns = [
  { date: 'Oct 17', duration: '1h 18m', width: '78%' },
  { date: 'Oct 10', duration: '1h 41m', width: '100%' },
  { date: 'Oct 3', duration: '52m', width: '52%' },
  { date: 'Sep 19', duration: '1h 26m', width: '85%' },
] as const;

const WorkflowsSection = () => (
  <section
    id="workflows"
    className="mx-auto grid max-w-6xl scroll-mt-24 items-center gap-14 px-4 py-24 sm:py-32 lg:grid-cols-[1fr_1.1fr]"
  >
    <SectionHeading
      align="start"
      title={
        <>
          Routines that <AccentWords>reset themselves</AccentWords>
        </>
      }
      description="Turn anything you repeat into a workflow. On schedule it clears the checklist, puts the card back in To do and blocks the time, then keeps a history of how long each run took."
    />
    <div className="grid gap-4 rounded-3xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <p className="text-lg font-medium tracking-[-0.02em] text-foreground">Clean room</p>
        <p className="text-[13px] text-muted-foreground">Every Saturday at 14:00</p>
      </div>
      <ol className="grid gap-2 sm:grid-cols-2">
        {workflowSteps.map((workflowStep) => (
          <li
            key={workflowStep.label}
            className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-soft"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <workflowStep.icon className="size-4" />
            </span>
            <span className="text-[13px] font-medium text-foreground">{workflowStep.label}</span>
          </li>
        ))}
      </ol>
      <div className="grid gap-2.5 rounded-2xl border border-border bg-background p-4">
        <p className="text-xs font-medium text-muted-foreground">Past runs</p>
        {pastRuns.map((pastRun) => (
          <div key={pastRun.date} className="grid grid-cols-[52px_1fr_56px] items-center gap-3">
            <span className="text-xs text-muted-foreground">{pastRun.date}</span>
            <span className="h-2 overflow-hidden rounded-full bg-surface-strong">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: pastRun.width }}
              />
            </span>
            <span className="text-right font-mono text-xs text-foreground tabular-nums">
              {pastRun.duration}
            </span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WorkflowsSection;

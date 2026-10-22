import { ArrowLeft, CalendarClock, Pause, Play } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Button from '@/core/components/atoms/button';
import CompletionCircle from '@/core/components/atoms/completion-circle';
import WorkflowRunHistory from '@/features/workflows/components/workflow-run-history';
import WorkflowSteps from '@/features/workflows/components/workflow-steps';
import sampleWorkflowSource from '@/features/workflows/data_sources/sample/workflow-source';
import Workflow from '@/features/workflows/entities/workflow';

type WorkflowDetailPageProps = {
  workflowId: Workflow['id'];
};

const WorkflowDetailPage = ({ workflowId }: WorkflowDetailPageProps) => {
  const workflow = sampleWorkflowSource.findById(workflowId);
  if (!workflow) {
    notFound();
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <Link
        href="/workflows"
        className="inline-flex items-center gap-1.5 justify-self-start text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Workflows
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1.5">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {workflow.name}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock className="size-4" />
            {workflow.triggerLabel} · usually takes{' '}
            <span className="font-mono text-foreground tabular-nums">
              {workflow.averageDurationLabel}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Pause />
            Pause
          </Button>
          <Button>
            <Play className="fill-current" />
            Run now
          </Button>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="grid content-start gap-6">
          <section className="grid gap-4 rounded-2xl border border-border bg-background p-5 shadow-soft">
            <h2 className="text-[13px] font-semibold text-foreground">Each run</h2>
            <WorkflowSteps workflowSteps={sampleWorkflowSource.findSteps()} />
          </section>
          <section className="grid gap-3 rounded-2xl border border-border bg-background p-5 shadow-soft">
            <h2 className="text-[13px] font-semibold text-foreground">Checklist it resets</h2>
            <ul className="grid gap-1">
              {sampleWorkflowSource.findChecklist().map((checklistItem) => (
                <li key={checklistItem} className="flex items-center gap-3 py-1.5">
                  <CompletionCircle
                    isDone={false}
                    label={`Mark ${checklistItem} as done`}
                    size="sm"
                  />
                  <span className="text-sm text-foreground">{checklistItem}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <section className="grid content-start gap-4 rounded-2xl border border-border bg-background p-5 shadow-soft">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[13px] font-semibold text-foreground">History</h2>
            <p className="text-xs text-muted-foreground">
              Durations come from tracked calendar events
            </p>
          </div>
          <WorkflowRunHistory workflowRuns={sampleWorkflowSource.findRuns()} />
        </section>
      </div>
    </div>
  );
};

export default WorkflowDetailPage;

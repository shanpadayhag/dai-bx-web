import { ChevronRight, Repeat2 } from 'lucide-react';
import Link from 'next/link';
import Badge from '@/core/components/atoms/badge';
import joinClassNames from '@/core/class-names';
import Workflow from '@/features/workflows/entities/workflow';

type WorkflowListProps = {
  workflows: Workflow[];
};

const WorkflowList = ({ workflows }: WorkflowListProps) => (
  <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-soft">
    <div className="hidden grid-cols-[1fr_200px_120px_100px_24px] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-muted-foreground md:grid">
      <span>Workflow</span>
      <span>Runs</span>
      <span>Next run</span>
      <span>Usually takes</span>
      <span />
    </div>
    <ul className="divide-y divide-border">
      {workflows.map((workflow) => (
        <li key={workflow.id}>
          <Link
            href={`/workflows/${workflow.id}`}
            className="grid gap-3 px-5 py-4 transition-colors duration-150 hover:bg-surface md:grid-cols-[1fr_200px_120px_100px_24px] md:items-center md:gap-4"
          >
            <span className="flex items-start gap-3">
              <span
                className={joinClassNames(
                  'mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl',
                  workflow.isPaused
                    ? 'bg-surface-strong text-muted-foreground'
                    : 'bg-primary-soft text-primary',
                )}
              >
                <Repeat2 className="size-4" />
              </span>
              <span className="grid gap-0.5">
                <span className="text-sm font-medium text-foreground">{workflow.name}</span>
                <span className="text-[13px] text-muted-foreground">{workflow.description}</span>
              </span>
            </span>
            <span className="text-[13px] text-foreground">{workflow.triggerLabel}</span>
            <span>
              {workflow.isPaused ? (
                <Badge>Paused</Badge>
              ) : (
                <span className="text-[13px] text-foreground">{workflow.nextRunLabel}</span>
              )}
            </span>
            <span className="font-mono text-[13px] text-muted-foreground tabular-nums">
              {workflow.averageDurationLabel}
            </span>
            <ChevronRight className="hidden size-4 text-muted-foreground md:block" />
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default WorkflowList;

import { CalendarPlus, ClipboardCheck, History, MoveRight } from 'lucide-react';
import type { ReactNode } from 'react';
import WorkflowStep, { WorkflowStepKind } from '@/features/workflows/entities/workflow-step';

const stepIcons: Record<WorkflowStepKind, ReactNode> = {
  'reset-checklist': <ClipboardCheck />,
  'move-card': <MoveRight />,
  'schedule-event': <CalendarPlus />,
  'record-run': <History />,
};

type WorkflowStepsProps = {
  workflowSteps: WorkflowStep[];
};

const WorkflowSteps = ({ workflowSteps }: WorkflowStepsProps) => (
  <ol className="grid">
    {workflowSteps.map((workflowStep, stepIndex) => (
      <li key={workflowStep.id} className="relative flex gap-3 pb-5 last:pb-0">
        {stepIndex < workflowSteps.length - 1 ? (
          <span aria-hidden="true" className="absolute top-9 bottom-1 left-[17px] w-px bg-border" />
        ) : null}
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary shadow-soft [&_svg]:size-4">
          {stepIcons[workflowStep.kind]}
        </span>
        <span className="grid gap-0.5 pt-1">
          <span className="text-sm font-medium text-foreground">{workflowStep.name}</span>
          <span className="text-[13px] text-muted-foreground">{workflowStep.detail}</span>
        </span>
      </li>
    ))}
  </ol>
);

export default WorkflowSteps;

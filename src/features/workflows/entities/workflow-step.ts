type WorkflowStepKind = 'reset-checklist' | 'move-card' | 'schedule-event' | 'record-run';

type WorkflowStep = {
  id: string;
  kind: WorkflowStepKind;
  name: string;
  detail: string;
};

export type { WorkflowStepKind };
export default WorkflowStep;

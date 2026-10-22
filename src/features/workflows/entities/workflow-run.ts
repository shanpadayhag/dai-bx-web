type WorkflowRunOutcome = 'completed' | 'skipped' | 'partial';

type WorkflowRun = {
  id: string;
  dateLabel: string;
  durationLabel: string;
  checklistLabel: string;
  outcome: WorkflowRunOutcome;
  note: string | null;
};

export type { WorkflowRunOutcome };
export default WorkflowRun;

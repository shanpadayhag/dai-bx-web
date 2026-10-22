import Workflow from '@/features/workflows/entities/workflow';
import WorkflowRun from '@/features/workflows/entities/workflow-run';
import WorkflowStep from '@/features/workflows/entities/workflow-step';

const workflows: Workflow[] = [
  {
    id: 'clean-room',
    name: 'Clean room',
    description: 'Reset the cleaning checklist and block time for it.',
    triggerLabel: 'Every Saturday at 14:00',
    nextRunLabel: 'Sat, Oct 24',
    stepCount: 4,
    checklistItemCount: 6,
    averageDurationLabel: '1h 24m',
    isPaused: false,
  },
  {
    id: 'chinese-cards',
    name: 'Chinese – daily cards',
    description: 'Bring the study card back to To do and track the session.',
    triggerLabel: 'Every day at 13:00',
    nextRunLabel: 'Tomorrow',
    stepCount: 3,
    checklistItemCount: 3,
    averageDurationLabel: '22m',
    isPaused: false,
  },
  {
    id: 'plan-day',
    name: 'Plan the day',
    description: 'Pull today’s cards into Doing before the shift starts.',
    triggerLabel: 'Weekdays at 15:30',
    nextRunLabel: 'Fri, Oct 23',
    stepCount: 3,
    checklistItemCount: 4,
    averageDurationLabel: '12m',
    isPaused: false,
  },
  {
    id: 'market-session',
    name: 'Saturday market session',
    description: 'Open the trade journal checklist for the weekly review.',
    triggerLabel: 'Every Saturday at 20:00',
    nextRunLabel: 'Paused',
    stepCount: 2,
    checklistItemCount: 5,
    averageDurationLabel: '58m',
    isPaused: true,
  },
];

const cleanRoomSteps: WorkflowStep[] = [
  {
    id: 's1',
    kind: 'reset-checklist',
    name: 'Reset the checklist',
    detail: 'All 6 items go back to unchecked.',
  },
  {
    id: 's2',
    kind: 'move-card',
    name: 'Move the card to To do',
    detail: 'Personal board · To do, at the top.',
  },
  {
    id: 's3',
    kind: 'schedule-event',
    name: 'Block time on the calendar',
    detail: 'Saturday 14:00, for 1h 30m.',
  },
  {
    id: 's4',
    kind: 'record-run',
    name: 'Record the run',
    detail: 'Duration comes from the tracked event.',
  },
];

const cleanRoomChecklist = [
  'Sweep',
  'Mop',
  'Organize the desk',
  'Organize clothes',
  'Clean the bathroom',
  'Empty the trash',
];

const cleanRoomRuns: WorkflowRun[] = [
  {
    id: 'r1',
    dateLabel: 'Sat, Oct 17',
    durationLabel: '1h 18m',
    checklistLabel: '6/6',
    outcome: 'completed',
    note: null,
  },
  {
    id: 'r2',
    dateLabel: 'Sat, Oct 10',
    durationLabel: '1h 41m',
    checklistLabel: '6/6',
    outcome: 'completed',
    note: 'Ended at the last check-in',
  },
  {
    id: 'r3',
    dateLabel: 'Sat, Oct 3',
    durationLabel: '52m',
    checklistLabel: '4/6',
    outcome: 'partial',
    note: 'Skipped the bathroom',
  },
  {
    id: 'r4',
    dateLabel: 'Sat, Sep 26',
    durationLabel: '—',
    checklistLabel: '0/6',
    outcome: 'skipped',
    note: 'Out of town',
  },
  {
    id: 'r5',
    dateLabel: 'Sat, Sep 19',
    durationLabel: '1h 26m',
    checklistLabel: '6/6',
    outcome: 'completed',
    note: null,
  },
];

const sampleWorkflowSource = {
  findAll: (): Workflow[] => workflows,
  findById: (workflowId: Workflow['id']): Workflow | undefined =>
    workflows.find((workflow) => workflow.id === workflowId),
  findSteps: (): WorkflowStep[] => cleanRoomSteps,
  findChecklist: (): string[] => cleanRoomChecklist,
  findRuns: (): WorkflowRun[] => cleanRoomRuns,
};

export default sampleWorkflowSource;

type Workflow = {
  id: string;
  name: string;
  description: string;
  triggerLabel: string;
  nextRunLabel: string;
  stepCount: number;
  checklistItemCount: number;
  averageDurationLabel: string;
  isPaused: boolean;
};

export default Workflow;

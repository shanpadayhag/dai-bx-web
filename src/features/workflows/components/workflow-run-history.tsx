import Badge from '@/core/components/atoms/badge';
import WorkflowRun, { WorkflowRunOutcome } from '@/features/workflows/entities/workflow-run';

const outcomeBadges: Record<
  WorkflowRunOutcome,
  { label: string; tone: 'success' | 'warning' | 'neutral' }
> = {
  completed: { label: 'Completed', tone: 'success' },
  partial: { label: 'Partly done', tone: 'warning' },
  skipped: { label: 'Skipped', tone: 'neutral' },
};

type WorkflowRunHistoryProps = {
  workflowRuns: WorkflowRun[];
};

const WorkflowRunHistory = ({ workflowRuns }: WorkflowRunHistoryProps) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[520px] text-left text-[13px]">
      <thead>
        <tr className="border-b border-border text-xs text-muted-foreground">
          <th scope="col" className="py-2 pr-4 font-medium">
            Run
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Took
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Checklist
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Outcome
          </th>
          <th scope="col" className="py-2 font-medium">
            Note
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {workflowRuns.map((workflowRun) => (
          <tr key={workflowRun.id}>
            <td className="py-3 pr-4 text-foreground">{workflowRun.dateLabel}</td>
            <td className="py-3 pr-4 font-mono text-foreground tabular-nums">
              {workflowRun.durationLabel}
            </td>
            <td className="py-3 pr-4 font-mono text-muted-foreground tabular-nums">
              {workflowRun.checklistLabel}
            </td>
            <td className="py-3 pr-4">
              <Badge tone={outcomeBadges[workflowRun.outcome].tone}>
                {outcomeBadges[workflowRun.outcome].label}
              </Badge>
            </td>
            <td className="py-3 text-muted-foreground">{workflowRun.note ?? ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default WorkflowRunHistory;

import { ListPlus } from 'lucide-react';
import TaskGroup from '@/features/tasks/entities/task-group';

type EmptyGroupStateProps = {
  taskGroup: TaskGroup;
};

const EmptyGroupState = ({ taskGroup }: EmptyGroupStateProps) => (
  <div className="grid justify-items-center gap-2 px-6 py-10 text-center">
    <span className="inline-flex size-9 items-center justify-center rounded-xl bg-surface-strong text-muted-foreground">
      <ListPlus className="size-4.5" />
    </span>
    <p className="text-sm font-medium text-foreground">{taskGroup.name} has no tasks yet</p>
    <p className="max-w-[34ch] text-[13px] text-muted-foreground">
      Type the first one in the field above and press Enter. Subtasks come from each task’s +
      button.
    </p>
  </div>
);

export default EmptyGroupState;

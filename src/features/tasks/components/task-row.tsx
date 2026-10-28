import {
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import Badge from '@/core/components/atoms/badge';
import CompletionCircle from '@/core/components/atoms/completion-circle';
import IconButton from '@/core/components/atoms/icon-button';
import joinClassNames from '@/core/class-names';
import Task from '@/features/tasks/entities/task';

type TaskRowProps = {
  task: Task;
};

const TaskRow = ({ task }: TaskRowProps) => {
  const hasSubtasks = task.tasks.length > 0;
  const doneSubtaskCount = task.tasks.filter((subtask) => subtask.isDone).length;

  return (
    <div
      className={joinClassNames(
        'group/row flex min-h-11 items-center gap-1.5 rounded-[10px] pr-1.5 pl-0.5 transition-colors duration-150 focus-within:bg-surface hover:bg-surface',
        task.isTracking && 'bg-primary-soft/60 hover:bg-primary-soft/70',
      )}
    >
      <span
        aria-hidden="true"
        title="Drag to reorder"
        className="hidden h-6 w-3.5 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/70 opacity-0 transition-opacity duration-150 group-focus-within/row:opacity-100 group-hover/row:opacity-100 active:cursor-grabbing sm:inline-flex"
      >
        <GripVertical className="size-3.5" />
      </span>
      <span className="inline-flex size-6 shrink-0 items-center justify-center">
        {hasSubtasks ? (
          <button
            type="button"
            aria-expanded={task.isOpen}
            aria-label={task.isOpen ? `Collapse ${task.name}` : `Expand ${task.name}`}
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-strong hover:text-foreground"
          >
            <ChevronRight
              className={joinClassNames(
                'size-3.5 transition-transform duration-150',
                task.isOpen && 'rotate-90',
              )}
            />
          </button>
        ) : null}
      </span>
      <CompletionCircle isDone={task.isDone} label={`Mark ${task.name} as done`} />
      <span
        className={joinClassNames(
          'min-w-0 flex-1 truncate text-sm',
          task.isDone
            ? 'text-muted-foreground line-through decoration-border-strong'
            : 'text-foreground',
        )}
      >
        {task.name}
      </span>
      <span className="flex items-center gap-1.5">
        {hasSubtasks ? (
          <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
            {doneSubtaskCount}/{task.tasks.length}
          </span>
        ) : null}
        {task.isTracking ? (
          <Badge tone="primary">
            <span className="size-1.5 rounded-full bg-primary" />
            Tracking
          </Badge>
        ) : null}
        {task.estimate && !task.isTracking ? (
          <span className="hidden font-mono text-xs text-muted-foreground tabular-nums sm:inline">
            {task.estimate}
          </span>
        ) : null}
      </span>
      <span className="flex items-center opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-focus-within/row:opacity-100 sm:group-hover/row:opacity-100">
        {!task.isDone && !task.isTracking ? (
          <IconButton
            label={`Start ${task.name}`}
            title="Starting a task arrives with the calendar"
            aria-disabled="true"
            className="cursor-not-allowed text-muted-foreground/50 hover:bg-transparent hover:text-muted-foreground/50"
          >
            <Play className="fill-current" />
          </IconButton>
        ) : null}
        <IconButton label={`Add a subtask to ${task.name}`} className="hidden sm:inline-flex">
          <Plus />
        </IconButton>
        <IconButton label={`Rename ${task.name}`} className="hidden sm:inline-flex">
          <Pencil />
        </IconButton>
        <IconButton
          label={`Delete ${task.name}`}
          tone="danger"
          popoverTarget="delete-task-dialog"
          className="hidden sm:inline-flex"
        >
          <Trash2 />
        </IconButton>
        <IconButton label={`More actions for ${task.name}`} popoverTarget="task-actions-menu">
          <MoreHorizontal />
        </IconButton>
      </span>
    </div>
  );
};

export default TaskRow;

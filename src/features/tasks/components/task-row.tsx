import {
  ChevronRight,
  GripVertical,
  KanbanSquare,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import Badge from '@/core/components/atoms/badge';
import CompletionCircle from '@/core/components/atoms/completion-circle';
import IconButton from '@/core/components/atoms/icon-button';
import joinClassNames from '@/core/class-names';
import { formatEstimate } from '@/features/tasks/entities/estimate';
import Task from '@/features/tasks/entities/task';

export const DRAGGED_TASK_DATA_TYPE = 'application/x-daibx-task';

export type TaskRowCallbacks = {
  onOpenTaskActions: (taskId: string) => void;
  onDropTask: (draggedTaskId: string, targetTaskId: string) => void;
  onToggleTaskDone: (taskId: string, isDone: boolean) => void;
  onToggleTaskExpanded: (taskId: string) => void;
  onStartAddingSubtask: (taskId: string) => void;
  onStartEditingTask: (taskId: string) => void;
  onRequestDeleteTask: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  runningListId: string;
};

type TaskRowProps = TaskRowCallbacks & {
  task: Task;
};

const TaskRow = ({
  task,
  onToggleTaskDone,
  onToggleTaskExpanded,
  onStartAddingSubtask,
  onStartEditingTask,
  onRequestDeleteTask,
  onOpenTaskActions,
  onDropTask,
  onStartTask,
  runningListId,
}: TaskRowProps) => {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const hasSubtasks = task.tasks.length > 0;
  const doneSubtaskCount = task.tasks.filter((subtask) => subtask.isDone).length;

  return (
    <div
      className={joinClassNames(
        'group/row relative flex min-h-11 items-center gap-1.5 rounded-[10px] pr-1.5 pl-0.5 transition-colors duration-150 focus-within:bg-surface hover:bg-surface',
        task.isTracking && 'bg-primary-soft/60 hover:bg-primary-soft/70',
        isDropTarget && 'bg-primary-soft/50 ring-2 ring-primary/40',
      )}
      onDragOver={(dragEvent) => {
        dragEvent.preventDefault();
        dragEvent.dataTransfer.dropEffect = 'move';
        setIsDropTarget(true);
      }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(dropEvent) => {
        dropEvent.preventDefault();
        setIsDropTarget(false);
        const draggedTaskId = dropEvent.dataTransfer.getData(DRAGGED_TASK_DATA_TYPE);
        if (draggedTaskId !== '') onDropTask(draggedTaskId, task.id);
      }}
    >
      <span
        aria-hidden="true"
        title="Drag to reorder"
        draggable
        onDragStart={(dragEvent) => {
          dragEvent.dataTransfer.setData(DRAGGED_TASK_DATA_TYPE, task.id);
          dragEvent.dataTransfer.effectAllowed = 'move';
        }}
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
            onClick={() => onToggleTaskExpanded(task.id)}
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
      <CompletionCircle
        isDone={task.isDone}
        label={`Mark ${task.name} as done`}
        onToggle={() => onToggleTaskDone(task.id, !task.isDone)}
      />
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className={joinClassNames(
            'min-w-0 truncate text-sm',
            task.isDone
              ? 'text-muted-foreground line-through decoration-border-strong'
              : 'text-foreground',
          )}
        >
          {task.name}
        </span>
        {task.card === null ? null : (
          <Link
            href={`/board?board=${task.card.boardId}&card=${task.card.id}`}
            aria-label={`Card: ${task.card.title}`}
            title={`Open the card “${task.card.title}”`}
            className="inline-flex h-5.5 max-w-[45%] shrink-0 items-center gap-1 rounded-md bg-surface-strong px-1.5 text-xs text-muted-foreground transition-colors duration-150 hover:bg-primary-soft hover:text-primary-soft-foreground focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:outline-none"
          >
            <KanbanSquare aria-hidden="true" className="size-3 shrink-0" />
            <span className="truncate">{task.card.title}</span>
          </Link>
        )}
      </span>
      <span className="flex items-center gap-1.5">
        {hasSubtasks ? (
          <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
            {doneSubtaskCount}/{task.tasks.length}
          </span>
        ) : null}
        {task.isTracking ? (
          <button
            type="button"
            popoverTarget={runningListId}
            aria-label={`${task.name} is running: show what’s running`}
            className="rounded-md focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:outline-none"
          >
            <Badge tone="primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Running
            </Badge>
          </button>
        ) : null}
        {task.estimateMinutes !== null && !task.isTracking ? (
          <span className="hidden font-mono text-xs text-muted-foreground tabular-nums sm:inline">
            {formatEstimate(task.estimateMinutes)}
          </span>
        ) : null}
      </span>
      <span className="flex items-center opacity-100 transition-opacity duration-150 sm:pointer-events-none sm:absolute sm:top-1/2 sm:right-1.5 sm:-translate-y-1/2 sm:rounded-lg sm:bg-surface sm:pl-1 sm:opacity-0 sm:group-focus-within/row:pointer-events-auto sm:group-focus-within/row:opacity-100 sm:group-hover/row:pointer-events-auto sm:group-hover/row:opacity-100">
        {task.parentId === null && !task.isDone && !task.isTracking ? (
          <IconButton
            label={`Start ${task.name}`}
            onClick={() => onStartTask(task.id)}
            className="text-primary hover:bg-primary-soft hover:text-primary-soft-foreground"
          >
            <Play className="fill-current" />
          </IconButton>
        ) : null}
        <IconButton
          label={`Add a subtask to ${task.name}`}
          className="hidden sm:inline-flex"
          onClick={() => onStartAddingSubtask(task.id)}
        >
          <Plus />
        </IconButton>
        <IconButton
          label={`Rename ${task.name}`}
          className="hidden sm:inline-flex"
          onClick={() => onStartEditingTask(task.id)}
        >
          <Pencil />
        </IconButton>
        <IconButton
          label={`Delete ${task.name}`}
          tone="danger"
          className="hidden sm:inline-flex"
          onClick={() => onRequestDeleteTask(task.id)}
        >
          <Trash2 />
        </IconButton>
        <IconButton
          label={`More actions for ${task.name}`}
          popoverTarget="task-actions-menu"
          onClick={() => onOpenTaskActions(task.id)}
        >
          <MoreHorizontal />
        </IconButton>
      </span>
    </div>
  );
};

export default TaskRow;

import { Plus, Upload } from 'lucide-react';
import { categoryColorStyle } from '@/core/category';
import joinClassNames from '@/core/class-names';
import TaskGroup from '@/features/tasks/entities/task-group';

type TaskGroupListProps = {
  taskGroups: readonly TaskGroup[];
  selectedTaskGroupId: TaskGroup['id'] | null;
  newGroupDialogId: string;
  onSelectTaskGroup: (taskGroupId: TaskGroup['id']) => void;
};

const TaskGroupList = ({
  taskGroups,
  selectedTaskGroupId,
  newGroupDialogId,
  onSelectTaskGroup,
}: TaskGroupListProps) => (
  <nav
    aria-label="Task groups"
    className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:content-start lg:px-0"
  >
    <div className="hidden items-center justify-between px-2.5 pb-1 lg:flex">
      <p className="text-xs font-medium text-muted-foreground">Groups</p>
      <span className="flex items-center gap-0.5">
        <button
          type="button"
          aria-label="Import a group"
          title="Import a group"
          popoverTarget="import-group-dialog"
          className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-strong hover:text-foreground"
        >
          <Upload className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="New group"
          title="New group"
          popoverTarget={newGroupDialogId}
          className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-strong hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </span>
    </div>
    {taskGroups.map((taskGroup) => {
      const isSelected = taskGroup.id === selectedTaskGroupId;
      return (
        <button
          key={taskGroup.id}
          type="button"
          aria-current={isSelected ? 'true' : undefined}
          onClick={() => onSelectTaskGroup(taskGroup.id)}
          className={joinClassNames(
            'flex h-9 shrink-0 items-center gap-2.5 rounded-[10px] px-2.5 text-left text-sm transition-colors duration-150',
            isSelected
              ? 'bg-background font-medium text-foreground shadow-soft'
              : 'text-muted-foreground hover:bg-surface-strong hover:text-foreground',
          )}
        >
          {taskGroup.category ? (
            <span
              style={categoryColorStyle(taskGroup.category)}
              className="category-swatch size-2 rounded-full"
            />
          ) : (
            <span className="size-2 rounded-full border border-border-strong" />
          )}
          <span className="flex-1 truncate">{taskGroup.name}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {taskGroup.openTaskCount}
          </span>
        </button>
      );
    })}
    <span className="flex shrink-0 items-center gap-1 lg:hidden">
      <button
        type="button"
        aria-label="New group"
        popoverTarget={newGroupDialogId}
        className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm text-muted-foreground hover:bg-surface-strong hover:text-foreground"
      >
        <Plus className="size-4" />
        New
      </button>
      <button
        type="button"
        popoverTarget="import-group-dialog"
        className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm text-muted-foreground hover:bg-surface-strong hover:text-foreground"
      >
        <Upload className="size-4" />
        Import
      </button>
    </span>
  </nav>
);

export default TaskGroupList;

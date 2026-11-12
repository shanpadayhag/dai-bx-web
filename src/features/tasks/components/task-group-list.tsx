import { CalendarClock, Plus, Upload } from 'lucide-react';
import joinClassNames from '@/core/class-names';
import SegmentedControl from '@/core/components/molecules/segmented-control';
import {
  describeGroupAvailability,
  type GroupView,
} from '@/features/tasks/entities/group-schedule';
import TaskGroup from '@/features/tasks/entities/task-group';

const GROUP_VIEW_LABELS: Record<GroupView, string> = { due: 'Due now', all: 'All groups' };

type TaskGroupListProps = {
  taskGroups: readonly TaskGroup[];
  selectedTaskGroupId: TaskGroup['id'] | null;
  newGroupDialogId: string;
  groupView: GroupView;
  now: Date;
  timeZone: string;
  onSelectTaskGroup: (taskGroupId: TaskGroup['id']) => void;
  onChooseGroupView: (groupView: GroupView) => void;
};

const TaskGroupList = ({
  taskGroups,
  selectedTaskGroupId,
  newGroupDialogId,
  groupView,
  now,
  timeZone,
  onSelectTaskGroup,
  onChooseGroupView,
}: TaskGroupListProps) => {
  const shownTaskGroups =
    groupView === 'due' ? taskGroups.filter((taskGroup) => taskGroup.timetable.dueNow) : taskGroups;

  return (
    <div className="grid min-w-0 content-start gap-3">
      <SegmentedControl
        label="Which groups to show"
        options={[GROUP_VIEW_LABELS.due, GROUP_VIEW_LABELS.all]}
        selectedOption={GROUP_VIEW_LABELS[groupView]}
        onSelectOption={(chosenLabel) =>
          onChooseGroupView(chosenLabel === GROUP_VIEW_LABELS.due ? 'due' : 'all')
        }
        className="w-full sm:w-auto lg:w-full [&>button]:flex-1"
      />
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
        {shownTaskGroups.length === 0 ? (
          <div className="grid shrink-0 justify-items-start gap-1.5 rounded-[10px] px-2.5 py-2 lg:py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarClock className="size-4 text-muted-foreground" />
              Nothing due now
            </p>
            <button
              type="button"
              onClick={() => onChooseGroupView('all')}
              className="text-[13px] font-medium text-primary underline-offset-4 hover:underline"
            >
              Show all groups
            </button>
          </div>
        ) : null}
        {shownTaskGroups.map((taskGroup) => {
          const isSelected = taskGroup.id === selectedTaskGroupId;
          const availabilityNote = describeGroupAvailability(taskGroup, now, timeZone);
          return (
            <button
              key={taskGroup.id}
              type="button"
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => onSelectTaskGroup(taskGroup.id)}
              className={joinClassNames(
                'flex min-h-9 shrink-0 items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 text-left text-sm transition-colors duration-150',
                isSelected
                  ? 'bg-background font-medium text-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-surface-strong hover:text-foreground',
              )}
            >
              <span className="grid min-w-0 flex-1">
                <span className="truncate">{taskGroup.name}</span>
                {availabilityNote === null ? null : (
                  <span className="truncate text-xs font-normal text-muted-foreground tabular-nums">
                    {availabilityNote}
                  </span>
                )}
              </span>
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
    </div>
  );
};

export default TaskGroupList;

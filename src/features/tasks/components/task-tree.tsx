import TaskEditorRow from '@/features/tasks/components/task-editor-row';
import TaskRow, { type TaskRowCallbacks } from '@/features/tasks/components/task-row';
import { formatEstimate } from '@/features/tasks/entities/estimate';
import type Task from '@/features/tasks/entities/task';

type TaskTreeProps = TaskRowCallbacks & {
  tasks: Task[];
  editingTaskId: Task['id'] | null;
  addingSubtaskToId: Task['id'] | null;
  onSaveTaskEdit: (taskId: string, enteredName: string, estimateText: string) => void;
  onAddSubtask: (enteredName: string, parentTaskId: string) => void;
  onCancelTaskEditor: () => void;
  depth?: number;
};

const TaskTree = ({
  tasks,
  editingTaskId,
  addingSubtaskToId,
  onSaveTaskEdit,
  onAddSubtask,
  onCancelTaskEditor,
  depth = 0,
  ...taskRowCallbacks
}: TaskTreeProps) => (
  <ul
    aria-label={depth === 0 ? 'Tasks' : undefined}
    className={
      depth === 0
        ? 'grid grid-cols-[minmax(0,1fr)] gap-0.5'
        : 'ml-[21px] grid grid-cols-[minmax(0,1fr)] gap-0.5 border-l border-border pl-2 sm:ml-[41px]'
    }
  >
    {tasks.map((task) => (
      <li key={task.id}>
        {task.id === editingTaskId ? (
          <TaskEditorRow
            defaultName={task.name}
            defaultEstimate={formatEstimate(task.estimateMinutes)}
            isEstimateShown
            placeholder="Task name"
            submitLabel="Save"
            onSubmitTask={(enteredName, estimateText) =>
              onSaveTaskEdit(task.id, enteredName, estimateText)
            }
            onCancel={onCancelTaskEditor}
          />
        ) : (
          <TaskRow task={task} {...taskRowCallbacks} />
        )}
        {task.isOpen && (task.tasks.length > 0 || task.id === addingSubtaskToId) ? (
          <div className="mt-0.5 grid gap-0.5">
            {task.tasks.length > 0 ? (
              <TaskTree
                tasks={task.tasks}
                editingTaskId={editingTaskId}
                addingSubtaskToId={addingSubtaskToId}
                onSaveTaskEdit={onSaveTaskEdit}
                onAddSubtask={onAddSubtask}
                onCancelTaskEditor={onCancelTaskEditor}
                depth={depth + 1}
                {...taskRowCallbacks}
              />
            ) : null}
            {task.id === addingSubtaskToId ? (
              <div className="ml-[21px] border-l border-border pl-2 sm:ml-[41px]">
                <TaskEditorRow
                  isEstimateShown={false}
                  placeholder="New subtask"
                  submitLabel="Add"
                  onSubmitTask={(enteredName) => onAddSubtask(enteredName, task.id)}
                  onCancel={onCancelTaskEditor}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </li>
    ))}
  </ul>
);

export default TaskTree;

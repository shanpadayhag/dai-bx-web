import Task from '@/features/tasks/entities/task';
import TaskEditorRow from '@/features/tasks/components/task-editor-row';
import TaskRow from '@/features/tasks/components/task-row';

type TaskTreeProps = {
  tasks: Task[];
  editingTaskId?: Task['id'];
  addingSubtaskToId?: Task['id'];
  depth?: number;
};

const TaskTree = ({ tasks, editingTaskId, addingSubtaskToId, depth = 0 }: TaskTreeProps) => (
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
          <TaskEditorRow defaultName={task.name} placeholder="Task name" submitLabel="Save" />
        ) : (
          <TaskRow task={task} />
        )}
        {task.isOpen && (task.tasks.length > 0 || task.id === addingSubtaskToId) ? (
          <div className="mt-0.5 grid gap-0.5">
            {task.tasks.length > 0 ? (
              <TaskTree
                tasks={task.tasks}
                editingTaskId={editingTaskId}
                addingSubtaskToId={addingSubtaskToId}
                depth={depth + 1}
              />
            ) : null}
            {task.id === addingSubtaskToId ? (
              <div className="ml-[21px] border-l border-border pl-2 sm:ml-[41px]">
                <TaskEditorRow placeholder="New subtask" submitLabel="Add" />
              </div>
            ) : null}
          </div>
        ) : null}
      </li>
    ))}
  </ul>
);

export default TaskTree;

import { Plus, Settings2 } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import CategoryChip from '@/core/components/atoms/category-chip';
import IconButton from '@/core/components/atoms/icon-button';
import sampleCategories from '@/core/sample-categories';
import Input from '@/core/components/atoms/input';
import PageHeader from '@/core/components/molecules/page-header';
import SegmentedControl from '@/core/components/molecules/segmented-control';
import DeleteGroupDialog from '@/features/tasks/components/delete-group-dialog';
import DeleteTaskDialog from '@/features/tasks/components/delete-task-dialog';
import GroupSettingsDialog from '@/features/tasks/components/group-settings-dialog';
import ImportGroupDialog from '@/features/tasks/components/import-group-dialog';
import MoveTaskDialog from '@/features/tasks/components/move-task-dialog';
import TaskActionsMenu from '@/features/tasks/components/task-actions-menu';
import TaskGroupList from '@/features/tasks/components/task-group-list';
import TaskTree from '@/features/tasks/components/task-tree';
import sampleTaskSource from '@/features/tasks/data_sources/sample/task-source';

const TasksPage = () => {
  const taskGroups = sampleTaskSource.findGroups();
  const taskTree = sampleTaskSource.findTree();
  const selectedTaskGroup = taskGroups.find((taskGroup) => taskGroup.id === 'daibx');
  const movingTask = taskTree.find((task) => task.id === 'plan-backend');

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
      <TaskGroupList taskGroups={taskGroups} selectedTaskGroupId="daibx" />
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6">
        <PageHeader
          title="DaiBX"
          titleAddon={
            <span className="flex items-center gap-1">
              <CategoryChip category={sampleCategories.goals} />
              <IconButton label="Group settings" popoverTarget="group-settings-dialog">
                <Settings2 />
              </IconButton>
            </span>
          }
          description="9 open · 5 done · nested up to any depth"
          actions={
            <>
              <SegmentedControl
                label="Which tasks to show"
                options={['Open', 'All']}
                selectedOption="All"
              />
              <Button>
                <Plus />
                New task
              </Button>
            </>
          }
        />
        <section className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-2xl border border-border bg-background p-2 shadow-soft sm:p-3">
          <form className="flex items-center gap-2 border-b border-border px-3 pb-2">
            <Plus className="size-4 text-primary" />
            <Input
              placeholder="Add a task to DaiBX"
              aria-label="Add a task to DaiBX"
              className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </form>
          <TaskTree
            tasks={taskTree}
            editingTaskId="calendar-week"
            addingSubtaskToId="plan-backend"
          />
        </section>
      </div>
      <DeleteTaskDialog />
      <TaskActionsMenu />
      <ImportGroupDialog
        id="import-group-dialog"
        importPreview={sampleTaskSource.findImportPreview()}
      />
      <ImportGroupDialog
        id="import-group-problem-dialog"
        importProblem={sampleTaskSource.findImportProblem()}
      />
      {selectedTaskGroup ? (
        <>
          <GroupSettingsDialog
            taskGroup={selectedTaskGroup}
            categories={Object.values(sampleCategories)}
          />
          <DeleteGroupDialog taskGroup={selectedTaskGroup} />
        </>
      ) : null}
      {movingTask ? (
        <MoveTaskDialog
          task={movingTask}
          taskGroups={taskGroups}
          selectedTaskGroupId="daibx"
          moveTargets={sampleTaskSource.findMoveTargets()}
          selectedParentTaskId="ship-frontend"
        />
      ) : null}
    </div>
  );
};

export default TasksPage;

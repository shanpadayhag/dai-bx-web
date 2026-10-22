import { Plus } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import PageHeader from '@/core/components/molecules/page-header';
import SegmentedControl from '@/core/components/molecules/segmented-control';
import DeleteTaskDialog from '@/features/tasks/components/delete-task-dialog';
import TaskGroupList from '@/features/tasks/components/task-group-list';
import TaskTree from '@/features/tasks/components/task-tree';
import sampleTaskSource from '@/features/tasks/data_sources/sample/task-source';

const TasksPage = () => {
  const taskGroups = sampleTaskSource.findGroups();
  const taskTree = sampleTaskSource.findTree();

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
      <TaskGroupList taskGroups={taskGroups} selectedTaskGroupId="daibx" />
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6">
        <PageHeader
          title="DaiBX"
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
    </div>
  );
};

export default TasksPage;

import type { Metadata } from 'next';
import RenameEventsPreview from '@/features/tasks/components/rename-events-preview';
import TasksPage from '@/features/tasks/pages/tasks-page';

export const metadata: Metadata = { title: 'Tasks' };

type TasksRouteProps = {
  searchParams: Promise<{ preview?: string }>;
};

const TasksRoute = async ({ searchParams }: TasksRouteProps) => {
  const { preview } = await searchParams;
  return (
    <>
      <TasksPage />
      {preview === 'rename-events' ? <RenameEventsPreview /> : null}
    </>
  );
};

export default TasksRoute;

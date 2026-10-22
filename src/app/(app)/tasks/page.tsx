import type { Metadata } from 'next';
import TasksPage from '@/features/tasks/pages/tasks-page';

export const metadata: Metadata = { title: 'Tasks' };

const TasksRoute = () => <TasksPage />;

export default TasksRoute;

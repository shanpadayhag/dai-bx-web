import type { Metadata } from 'next';
import WorkflowsPage from '@/features/workflows/pages/workflows-page';

export const metadata: Metadata = { title: 'Workflows' };

const WorkflowsRoute = () => <WorkflowsPage />;

export default WorkflowsRoute;

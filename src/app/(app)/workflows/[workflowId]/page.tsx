import type { Metadata } from 'next';
import WorkflowDetailPage from '@/features/workflows/pages/workflow-detail-page';
import sampleWorkflowSource from '@/features/workflows/data_sources/sample/workflow-source';

type WorkflowRouteProps = {
  params: Promise<{ workflowId: string }>;
};

export const generateStaticParams = () =>
  sampleWorkflowSource.findAll().map((workflow) => ({ workflowId: workflow.id }));

export const generateMetadata = async ({ params }: WorkflowRouteProps): Promise<Metadata> => {
  const { workflowId } = await params;
  return { title: sampleWorkflowSource.findById(workflowId)?.name ?? 'Workflow' };
};

const WorkflowRoute = async ({ params }: WorkflowRouteProps) => {
  const { workflowId } = await params;
  return <WorkflowDetailPage workflowId={workflowId} />;
};

export default WorkflowRoute;

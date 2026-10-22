import { Plus } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import PageHeader from '@/core/components/molecules/page-header';
import WorkflowList from '@/features/workflows/components/workflow-list';
import sampleWorkflowSource from '@/features/workflows/data_sources/sample/workflow-source';

const WorkflowsPage = () => (
  <div className="mx-auto grid max-w-6xl gap-6">
    <PageHeader
      title="Workflows"
      description="Routines that reset a checklist, move a card and block time, on a schedule."
      actions={
        <Button>
          <Plus />
          New workflow
        </Button>
      }
    />
    <WorkflowList workflows={sampleWorkflowSource.findAll()} />
  </div>
);

export default WorkflowsPage;

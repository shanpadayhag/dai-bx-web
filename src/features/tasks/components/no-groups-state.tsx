import { FolderPlus, Plus, Upload } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import EmptyState from '@/core/components/molecules/empty-state';

const NoGroupsState = () => (
  <EmptyState
    icon={<FolderPlus />}
    title="No groups yet"
    description="A group holds one list of tasks, like a project or a day. Start one by hand, or bring in today’s plan from a file."
    action={
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm">
          <Plus />
          New group
        </Button>
        <Button variant="secondary" size="sm" popoverTarget="import-group-dialog">
          <Upload />
          Import a group
        </Button>
      </div>
    }
  />
);

export default NoGroupsState;

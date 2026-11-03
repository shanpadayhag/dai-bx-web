import { Columns3, Plus } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import EmptyState from '@/core/components/molecules/empty-state';

type NoListsStateProps = {
  newListDialogId: string;
};

const NoListsState = ({ newListDialogId }: NoListsStateProps) => (
  <EmptyState
    icon={<Columns3 />}
    title="This board has no lists"
    description="Lists are the stages a card goes through, like Backlog, To do, Doing and Done."
    action={
      <Button size="sm" popoverTarget={newListDialogId}>
        <Plus />
        Add a list
      </Button>
    }
  />
);

export default NoListsState;

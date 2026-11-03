import { LayoutGrid, Plus } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import EmptyState from '@/core/components/molecules/empty-state';

type NoBoardsStateProps = {
  newBoardDialogId: string;
};

const NoBoardsState = ({ newBoardDialogId }: NoBoardsStateProps) => (
  <EmptyState
    icon={<LayoutGrid />}
    title="No boards yet"
    description="A board holds the bigger picture: lists like Backlog or Doing, and cards that move between them."
    action={
      <Button size="sm" popoverTarget={newBoardDialogId}>
        <Plus />
        New board
      </Button>
    }
  />
);

export default NoBoardsState;

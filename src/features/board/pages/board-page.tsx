import { Filter, Plus } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import PageHeader from '@/core/components/molecules/page-header';
import BoardColumn from '@/features/board/components/board-column';
import CardDetailDialog from '@/features/board/components/card-detail-dialog';
import sampleBoardSource from '@/features/board/data_sources/sample/board-source';

const BoardPage = () => {
  const boardLists = sampleBoardSource.findLists();
  const checklistItems = sampleBoardSource.findChecklist();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Personal"
        description="Cards move left to right. Recurring cards come back to To do on their own."
        actions={
          <>
            <Button variant="secondary">
              <Filter />
              Filter
            </Button>
            <Button>
              <Plus />
              New list
            </Button>
          </>
        }
      />
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-start gap-3">
          {boardLists.map((boardList) => (
            <BoardColumn key={boardList.id} boardList={boardList} />
          ))}
          <button
            type="button"
            className="flex h-11 w-[264px] shrink-0 items-center gap-2 rounded-2xl border border-dashed border-border-strong px-4 text-sm text-muted-foreground transition-colors duration-150 hover:border-primary/50 hover:text-foreground"
          >
            <Plus className="size-4" />
            Add another list
          </button>
        </div>
      </div>
      <CardDetailDialog checklistItems={checklistItems} />
    </div>
  );
};

export default BoardPage;

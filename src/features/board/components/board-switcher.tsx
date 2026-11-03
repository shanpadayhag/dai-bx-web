import { Check, ChevronsUpDown, LayoutGrid, Plus } from 'lucide-react';
import MenuItem from '@/core/components/molecules/menu-item';
import PopoverMenu, { MenuSeparator } from '@/core/components/molecules/popover-menu';
import type Board from '@/features/board/entities/board';

type BoardSwitcherProps = {
  menuId: string;
  boards: readonly Board[];
  currentBoard: Board;
  newBoardDialogId: string;
  onSelectBoard: (boardId: string) => void;
};

const BoardSwitcher = ({
  menuId,
  boards,
  currentBoard,
  newBoardDialogId,
  onSelectBoard,
}: BoardSwitcherProps) => (
  <>
    <button
      type="button"
      popoverTarget={menuId}
      aria-label={`Board: ${currentBoard.name}. Switch board`}
      className="-ml-2 inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-lg px-2 py-0.5 text-2xl font-semibold tracking-[-0.02em] text-foreground transition-colors duration-150 hover:bg-surface-strong focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none"
    >
      <span className="truncate">{currentBoard.name}</span>
      <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
    </button>
    <PopoverMenu id={menuId} label="Boards" placement="start" className="w-64">
      <p className="px-2.5 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">Boards</p>
      <div className="grid max-h-72 overflow-y-auto overscroll-contain">
        {boards.map((board) => {
          const isCurrent = board.id === currentBoard.id;
          return (
            <a
              key={board.id}
              role="menuitem"
              href={`/board?board=${board.id}`}
              aria-current={isCurrent ? 'true' : undefined}
              onClick={(clickEvent) => {
                if (
                  clickEvent.button !== 0 ||
                  clickEvent.metaKey ||
                  clickEvent.ctrlKey ||
                  clickEvent.shiftKey ||
                  clickEvent.altKey
                ) {
                  return;
                }
                clickEvent.preventDefault();
                onSelectBoard(board.id);
              }}
              className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-foreground transition-colors duration-150 hover:bg-surface-strong focus-visible:bg-surface-strong focus-visible:outline-none aria-[current]:font-medium [&_svg]:size-4 [&_svg]:shrink-0"
            >
              <LayoutGrid className="text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{board.name}</span>
              {isCurrent ? <Check className="text-primary" /> : null}
            </a>
          );
        })}
      </div>
      <MenuSeparator />
      <MenuItem icon={<Plus />} label="New board" popoverTarget={newBoardDialogId} />
    </PopoverMenu>
  </>
);

export default BoardSwitcher;

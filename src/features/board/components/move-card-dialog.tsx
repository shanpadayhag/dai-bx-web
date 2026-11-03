import { MoveRight } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import type BoardCard from '@/features/board/entities/board-card';
import type BoardList from '@/features/board/entities/board-list';

type MoveCardDialogProps = {
  dialogId: string;
  card: BoardCard;
  lists: readonly BoardList[];
  chosenListId: BoardList['id'];
};

const optionClassName =
  'flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-[13px] text-foreground transition-colors duration-150 hover:bg-surface has-checked:bg-primary-soft/70 has-checked:font-medium has-focus-visible:ring-4 has-focus-visible:ring-primary/15';

const MoveCardDialog = ({ dialogId, card, lists, chosenListId }: MoveCardDialogProps) => {
  const chosenList = lists.find((boardList) => boardList.id === chosenListId);
  const otherCards = (chosenList?.cards ?? []).filter((listCard) => listCard.id !== card.id);

  return (
    <PopoverPanel id={dialogId} label={`Move ${card.title}`}>
      <form className="grid gap-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
            <MoveRight className="size-5" />
          </span>
          <div className="grid min-w-0 gap-1">
            <h2 className="text-base font-semibold text-balance text-foreground">
              Move “{card.title}”
            </h2>
            <p className="text-sm text-muted-foreground">Pick a list on this board, then a spot.</p>
          </div>
        </div>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-[13px] font-medium text-foreground">List</legend>
          <div className="flex flex-wrap gap-2">
            {lists.map((boardList) => (
              <label
                key={boardList.id}
                className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 text-[13px] font-medium text-foreground transition-colors duration-150 hover:border-border-strong has-checked:border-primary has-checked:bg-primary-soft/60 has-focus-visible:ring-4 has-focus-visible:ring-primary/15"
              >
                <input
                  type="radio"
                  name="move-list"
                  value={boardList.id}
                  defaultChecked={boardList.id === chosenListId}
                  className="sr-only"
                />
                {boardList.name}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-[13px] font-medium text-foreground">Put it</legend>
          <div className="grid max-h-64 grid-cols-[minmax(0,1fr)] gap-0.5 overflow-y-auto overscroll-contain rounded-xl border border-border p-1.5">
            <label className={optionClassName}>
              <input type="radio" name="move-position" value="0" className="sr-only" />
              At the top of {chosenList?.name ?? 'the list'}
            </label>
            {otherCards.map((listCard, cardIndex) => (
              <label key={listCard.id} className={optionClassName}>
                <input
                  type="radio"
                  name="move-position"
                  value={cardIndex + 1}
                  defaultChecked={cardIndex === otherCards.length - 1}
                  className="sr-only"
                />
                <span className="truncate">After {listCard.title}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" popoverTarget={dialogId} popoverTargetAction="hide">
            Cancel
          </Button>
          <Button type="submit">Move card</Button>
        </div>
      </form>
    </PopoverPanel>
  );
};

export default MoveCardDialog;

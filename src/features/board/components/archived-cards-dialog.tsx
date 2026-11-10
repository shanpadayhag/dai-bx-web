import { Archive, ArchiveRestore, Trash2, X } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import {
  archiveHowLabels,
  formatArchiveDay,
  type ArchivedCard,
} from '@/features/board/entities/card-archive';

type ArchivedCardsDialogProps = {
  dialogId: string;
  deleteDialogId: string;
  boardName: string;
  archivedCards: readonly ArchivedCard[] | null;
  hasOlderCards: boolean;
  calendarTimeZone: string;
  onRestoreCard: (cardId: string) => void;
  onStartDeleteCard: (cardId: string) => void;
  onLoadOlderCards: () => void;
};

const ArchivedCardsDialog = ({
  dialogId,
  deleteDialogId,
  boardName,
  archivedCards,
  hasOlderCards,
  calendarTimeZone,
  onRestoreCard,
  onStartDeleteCard,
  onLoadOlderCards,
}: ArchivedCardsDialogProps) => (
  <PopoverPanel id={dialogId} label="Archived cards" className="w-[min(560px,calc(100vw-2rem))]">
    <div className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)]">
      <div className="flex items-start gap-3 p-5 pb-4 sm:px-6 sm:pt-6">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
          <Archive className="size-5" />
        </span>
        <div className="grid flex-1 gap-1">
          <h2 className="text-base font-semibold text-foreground">Archived cards</h2>
          <p className="text-sm text-muted-foreground">
            Off the {boardName} board, newest first. Restore puts a card back at the top of the
            column it left.
          </p>
        </div>
        <IconButton
          label="Close archived cards"
          popoverTarget={dialogId}
          popoverTargetAction="hide"
        >
          <X />
        </IconButton>
      </div>
      <div className="grid content-start gap-2 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
        {archivedCards === null ? (
          <p role="status" className="text-[13px] text-muted-foreground">
            Loading archived cards…
          </p>
        ) : archivedCards.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-strong px-4 py-5 text-center text-[13px] text-muted-foreground">
            No archived cards.
          </p>
        ) : (
          <ul className="grid divide-y divide-border rounded-xl border border-border">
            {archivedCards.map((archivedCard) => (
              <li
                key={archivedCard.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5"
              >
                <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
                  <p className="truncate text-sm font-medium text-foreground">
                    {archivedCard.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    From {archivedCard.fromListName ?? 'a deleted column'} ·{' '}
                    <time dateTime={archivedCard.archivedAt.toISOString()} className="tabular-nums">
                      {formatArchiveDay(archivedCard.archivedAt, calendarTimeZone)}
                    </time>
                    , {archiveHowLabels[archivedCard.how]}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Restore ${archivedCard.title}`}
                    onClick={() => onRestoreCard(archivedCard.id)}
                  >
                    <ArchiveRestore />
                    Restore
                  </Button>
                  <IconButton
                    label={`Delete ${archivedCard.title}`}
                    tone="danger"
                    popoverTarget={deleteDialogId}
                    onClick={() => onStartDeleteCard(archivedCard.id)}
                    className="size-8"
                  >
                    <Trash2 />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
        {hasOlderCards ? (
          <Button
            variant="ghost"
            size="sm"
            className="justify-self-start"
            onClick={onLoadOlderCards}
          >
            Show older archived cards
          </Button>
        ) : null}
      </div>
    </div>
  </PopoverPanel>
);

export default ArchivedCardsDialog;

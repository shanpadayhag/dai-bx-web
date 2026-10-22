import { CalendarClock, Play, Repeat2, X } from 'lucide-react';
import Badge from '@/core/components/atoms/badge';
import Button from '@/core/components/atoms/button';
import CategoryChip from '@/core/components/atoms/category-chip';
import sampleCategories from '@/core/sample-categories';
import CompletionCircle from '@/core/components/atoms/completion-circle';
import IconButton from '@/core/components/atoms/icon-button';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import ChecklistItem from '@/features/board/entities/checklist-item';

type CardDetailDialogProps = {
  checklistItems: ChecklistItem[];
};

const CardDetailDialog = ({ checklistItems }: CardDetailDialogProps) => {
  const doneItemCount = checklistItems.filter((checklistItem) => checklistItem.isDone).length;
  const donePercentage = Math.round((doneItemCount / checklistItems.length) * 100);

  return (
    <PopoverPanel
      id="card-detail-dialog"
      label="Card details"
      className="w-[min(640px,calc(100vw-2rem))]"
    >
      <div className="grid gap-6 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid flex-1 gap-2">
            <p className="text-xs text-muted-foreground">
              Personal board · <span className="text-foreground">Doing</span>
            </p>
            <h2 className="text-xl font-semibold tracking-[-0.01em] text-foreground">
              Ship the v3 frontend
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <CategoryChip category={sampleCategories.goals} />
              <Badge tone="warning">Release</Badge>
              <Badge>
                <CalendarClock />
                Due Oct 24
              </Badge>
            </div>
          </div>
          <IconButton
            label="Close card"
            popoverTarget="card-detail-dialog"
            popoverTargetAction="hide"
          >
            <X />
          </IconButton>
        </div>
        <section className="grid gap-2">
          <h3 className="text-[13px] font-semibold text-foreground">Notes</h3>
          <p className="rounded-xl bg-surface px-3.5 py-3 text-sm leading-relaxed text-muted-foreground">
            Every page of the app and the marketing site, in the blue theme, with nothing wired in
            yet. Functionality lands once the Axum API is up.
          </p>
        </section>
        <section className="grid gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-foreground">Checklist</h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              {doneItemCount} of {checklistItems.length}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-strong">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${donePercentage}%` }}
            />
          </div>
          <ul className="grid gap-1">
            {checklistItems.map((checklistItem) => (
              <li key={checklistItem.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                <CompletionCircle
                  isDone={checklistItem.isDone}
                  label={`Mark ${checklistItem.name} as done`}
                  size="sm"
                />
                <span
                  className={
                    checklistItem.isDone
                      ? 'text-sm text-muted-foreground line-through'
                      : 'text-sm text-foreground'
                  }
                >
                  {checklistItem.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button variant="ghost" size="sm">
            <Repeat2 />
            Make it recurring
          </Button>
          <Button size="sm">
            <Play className="fill-current" />
            Start and track it
          </Button>
        </div>
      </div>
    </PopoverPanel>
  );
};

export default CardDetailDialog;

'use client';

import { CalendarClock } from 'lucide-react';
import { useEffect, useRef } from 'react';
import Button from '@/core/components/atoms/button';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import type { RenameEventsAnswer, RenameEventsRequest } from '@/core/rename-events';

type RenameEventsDialogProps = {
  id: string;
  renameRequest: RenameEventsRequest | null;
  onAnswer: (renameAnswer: RenameEventsAnswer) => void;
};

const describeEventCount = (eventCount: number) =>
  `${eventCount} calendar event${eventCount === 1 ? '' : 's'}`;

const RenameEventsDialog = ({ id, renameRequest, onAnswer }: RenameEventsDialogProps) => {
  const renameAllButtonRef = useRef<HTMLButtonElement>(null);
  const chosenAnswerRef = useRef<RenameEventsAnswer>('cancel');
  const onAnswerRef = useRef(onAnswer);

  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  useEffect(() => {
    const dialogElement = document.getElementById(id);
    const answerOnToggle = (toggleEvent: Event) => {
      if ((toggleEvent as ToggleEvent).newState === 'open') {
        chosenAnswerRef.current = 'cancel';
        renameAllButtonRef.current?.focus();
        return;
      }
      onAnswerRef.current(chosenAnswerRef.current);
    };
    dialogElement?.addEventListener('toggle', answerOnToggle);
    return () => dialogElement?.removeEventListener('toggle', answerOnToggle);
  }, [id]);

  const eventCountLabel = describeEventCount(renameRequest?.eventCount ?? 0);

  return (
    <PopoverPanel
      id={id}
      label={`Rename ${eventCountLabel} too?`}
      className="w-[min(400px,calc(100vw-2rem))]"
    >
      <div className="grid gap-4 p-5">
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <CalendarClock className="size-4.5" />
        </span>
        <div className="grid gap-1.5">
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-foreground">
            Rename {eventCountLabel} too?
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Time you tracked still says{' '}
            <span className="font-medium text-foreground">“{renameRequest?.previousName}”</span>.
            Rename it to{' '}
            <span className="font-medium text-foreground">“{renameRequest?.nextName}”</span>, or
            keep the old name on past events.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button
            variant="secondary"
            popoverTarget={id}
            popoverTargetAction="hide"
            onClick={() => {
              chosenAnswerRef.current = 'keep-old-names';
            }}
          >
            Keep old names
          </Button>
          <Button
            ref={renameAllButtonRef}
            popoverTarget={id}
            popoverTargetAction="hide"
            onClick={() => {
              chosenAnswerRef.current = 'rename-all';
            }}
          >
            Rename all
          </Button>
        </div>
      </div>
    </PopoverPanel>
  );
};

export default RenameEventsDialog;

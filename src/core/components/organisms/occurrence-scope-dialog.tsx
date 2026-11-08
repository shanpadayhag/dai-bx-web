'use client';

import { Repeat } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Button from '@/core/components/atoms/button';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import type {
  OccurrenceScope,
  OccurrenceScopeAnswer,
  OccurrenceScopeRequest,
} from '@/core/occurrence-scope';

type OccurrenceScopeDialogProps = {
  id: string;
  scopeRequest: OccurrenceScopeRequest | null;
  onAnswer: (scopeAnswer: OccurrenceScopeAnswer) => void;
};

const SCOPE_CHOICES: readonly { scope: OccurrenceScope; label: string }[] = [
  { scope: 'this', label: 'This event' },
  { scope: 'following', label: 'This and following events' },
  { scope: 'all', label: 'All events' },
];

const OccurrenceScopeDialog = ({ id, scopeRequest, onAnswer }: OccurrenceScopeDialogProps) => {
  const [pickedScope, setPickedScope] = useState<OccurrenceScope>('this');
  const chosenAnswerRef = useRef<OccurrenceScopeAnswer>('cancel');
  const firstChoiceRef = useRef<HTMLInputElement>(null);
  const onAnswerRef = useRef(onAnswer);

  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  useEffect(() => {
    const dialogElement = document.getElementById(id);
    const answerOnToggle = (toggleEvent: Event) => {
      if ((toggleEvent as ToggleEvent).newState === 'open') {
        chosenAnswerRef.current = 'cancel';
        setPickedScope('this');
        firstChoiceRef.current?.focus();
        return;
      }
      onAnswerRef.current(chosenAnswerRef.current);
    };
    dialogElement?.addEventListener('toggle', answerOnToggle);
    return () => dialogElement?.removeEventListener('toggle', answerOnToggle);
  }, [id]);

  const isDelete = scopeRequest?.action === 'delete';
  const heading = isDelete ? 'Delete repeating event' : 'Change repeating event';

  return (
    <PopoverPanel id={id} label={heading} className="w-[min(380px,calc(100vw-2rem))]">
      <div className="grid gap-4 p-5">
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Repeat className="size-4.5" />
        </span>
        <div className="grid gap-1.5">
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-foreground">{heading}</h2>
          <p className="text-[13px] text-muted-foreground">
            <span className="font-medium text-foreground">“{scopeRequest?.eventTitle}”</span>{' '}
            repeats. Which of its events should {isDelete ? 'go' : 'change'}?
          </p>
        </div>
        <fieldset className="grid gap-0.5">
          <legend className="sr-only">Events to {isDelete ? 'delete' : 'change'}</legend>
          {SCOPE_CHOICES.map((scopeChoice, choiceIndex) => (
            <label
              key={scopeChoice.scope}
              className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-foreground transition-colors duration-150 hover:bg-surface has-checked:bg-primary-soft has-checked:text-primary-soft-foreground [&_input]:size-4 [&_input]:accent-primary"
            >
              <input
                ref={choiceIndex === 0 ? firstChoiceRef : undefined}
                type="radio"
                name={`${id}-scope`}
                checked={pickedScope === scopeChoice.scope}
                onChange={() => setPickedScope(scopeChoice.scope)}
              />
              {scopeChoice.label}
            </label>
          ))}
        </fieldset>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button variant="ghost" popoverTarget={id} popoverTargetAction="hide">
            Cancel
          </Button>
          <Button
            variant={isDelete ? 'danger' : 'primary'}
            popoverTarget={id}
            popoverTargetAction="hide"
            onClick={() => {
              chosenAnswerRef.current = pickedScope;
            }}
          >
            {isDelete ? 'Delete' : 'Save'}
          </Button>
        </div>
      </div>
    </PopoverPanel>
  );
};

export default OccurrenceScopeDialog;

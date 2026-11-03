import Button from '@/core/components/atoms/button';

type CardComposerProps = {
  listId: string;
  listName: string;
  onAddCard: (cardTitle: string) => boolean;
  onCancel: () => void;
};

const CardComposer = ({ listId, listName, onAddCard, onCancel }: CardComposerProps) => {
  const titleInputId = `new-card-title-${listId}`;

  return (
    <form
      className="grid gap-2"
      onSubmit={(submitEvent) => {
        submitEvent.preventDefault();
        const composerForm = submitEvent.currentTarget;
        const enteredTitle = new FormData(composerForm).get('cardTitle');
        if (typeof enteredTitle === 'string' && onAddCard(enteredTitle)) composerForm.reset();
      }}
    >
      <label className="sr-only" htmlFor={titleInputId}>
        New card title in {listName}
      </label>
      <textarea
        id={titleInputId}
        name="cardTitle"
        rows={2}
        maxLength={500}
        autoFocus
        placeholder="What’s the card about?"
        onKeyDown={(keyEvent) => {
          if (keyEvent.key === 'Escape') {
            keyEvent.preventDefault();
            onCancel();
          } else if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
            keyEvent.preventDefault();
            keyEvent.currentTarget.form?.requestSubmit();
          }
        }}
        className="field-sizing-content min-h-16 w-full resize-none rounded-xl border border-primary bg-background p-3 text-sm leading-snug text-foreground shadow-soft ring-4 ring-primary/15 placeholder:text-muted-foreground focus-visible:outline-none"
      />
      <div className="flex items-center gap-1.5">
        <Button size="sm" type="submit">
          Add card
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default CardComposer;

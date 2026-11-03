import Button from '@/core/components/atoms/button';

type CardComposerProps = {
  listName: string;
};

const CardComposer = ({ listName }: CardComposerProps) => (
  <form className="grid gap-2">
    <label className="sr-only" htmlFor={`new-card-title-${listName}`}>
      New card title in {listName}
    </label>
    <textarea
      id={`new-card-title-${listName}`}
      rows={2}
      maxLength={500}
      placeholder="What’s the card about?"
      className="field-sizing-content min-h-16 w-full resize-none rounded-xl border border-primary bg-background p-3 text-sm leading-snug text-foreground shadow-soft ring-4 ring-primary/15 placeholder:text-muted-foreground focus-visible:outline-none"
    />
    <div className="flex items-center gap-1.5">
      <Button size="sm" type="submit">
        Add card
      </Button>
      <Button size="sm" variant="ghost">
        Cancel
      </Button>
    </div>
  </form>
);

export default CardComposer;

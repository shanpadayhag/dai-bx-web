import type { FormEvent } from 'react';
import type { Category } from '@/core/category';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import CategoryPicker from '@/core/components/molecules/category-picker';
import Field from '@/core/components/molecules/field';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import DateTimeField from '@/features/calendar/components/date-time-field';
import type { EventTimes } from '@/features/calendar/entities/calendar-drag';

type NewEventDialogProps = {
  dialogId: string;
  fieldPrefix: string;
  categories: readonly Category[];
  draftTimes: EventTimes | null;
  isSaving: boolean;
  onSubmit: (submitEvent: FormEvent<HTMLFormElement>) => void;
};

const NewEventDialog = ({
  dialogId,
  fieldPrefix,
  categories,
  draftTimes,
  isSaving,
  onSubmit,
}: NewEventDialogProps) => (
  <PopoverPanel id={dialogId} label="New event">
    <form
      noValidate
      key={draftTimes === null ? 'empty' : draftTimes.startsAt.toISOString()}
      className="grid gap-5 p-5"
      onSubmit={onSubmit}
    >
      <h2 className="text-lg font-semibold tracking-[-0.01em] text-foreground">New event</h2>
      <Field label="Title" htmlFor={`${fieldPrefix}-title`}>
        <Input id={`${fieldPrefix}-title`} name="title" maxLength={200} placeholder="Gym" />
      </Field>
      <CategoryPicker
        name={`${fieldPrefix}-category`}
        legend="Category"
        categories={categories}
        selectedCategoryId={null}
      />
      <div className="grid gap-3">
        <DateTimeField
          label="Starts"
          idPrefix={`${fieldPrefix}-starts`}
          moment={draftTimes?.startsAt ?? null}
          minuteStep={15}
        />
        <DateTimeField
          label="Ends"
          idPrefix={`${fieldPrefix}-ends`}
          moment={draftTimes?.endsAt ?? null}
          minuteStep={15}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" popoverTarget={dialogId} popoverTargetAction="hide">
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Adding…' : 'Add event'}
        </Button>
      </div>
    </form>
  </PopoverPanel>
);

export default NewEventDialog;

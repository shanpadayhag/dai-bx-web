import type { Category } from '@/core/category';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import CategoryPicker from '@/core/components/molecules/category-picker';
import DateTimeField from '@/features/calendar/components/date-time-field';

type NewEventDialogProps = {
  categories: readonly Category[];
  defaultStartsAt: Date;
  defaultEndsAt: Date;
};

const NewEventDialog = ({ categories, defaultStartsAt, defaultEndsAt }: NewEventDialogProps) => (
  <PopoverPanel id="new-event-dialog" label="New event">
    <div className="grid gap-5 p-5">
      <h2 className="text-lg font-semibold tracking-[-0.01em] text-foreground">New event</h2>
      <Field label="Title" htmlFor="new-event-title">
        <Input id="new-event-title" maxLength={200} placeholder="Gym" />
      </Field>
      <CategoryPicker
        name="new-event-category"
        legend="Category"
        categories={categories}
        selectedCategoryId={null}
      />
      <div className="grid gap-3">
        <DateTimeField
          label="Starts"
          idPrefix="new-event-starts"
          moment={defaultStartsAt}
          minuteStep={15}
        />
        <DateTimeField
          label="Ends"
          idPrefix="new-event-ends"
          moment={defaultEndsAt}
          minuteStep={15}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" popoverTarget="new-event-dialog" popoverTargetAction="hide">
          Cancel
        </Button>
        <Button>Add event</Button>
      </div>
    </div>
  </PopoverPanel>
);

export default NewEventDialog;

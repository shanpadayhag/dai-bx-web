import { useState, type FormEvent } from 'react';
import type { Category } from '@/core/category';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import CategoryPicker from '@/core/components/molecules/category-picker';
import Field from '@/core/components/molecules/field';
import MoreOptions from '@/core/components/molecules/more-options';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import TimeZoneField from '@/core/components/molecules/time-zone-field';
import RepeatPicker from '@/core/components/organisms/repeat-picker';
import { partsInZone } from '@/core/zoned-time';
import DateTimeField from '@/features/calendar/components/date-time-field';
import type { EventTimes } from '@/features/calendar/entities/calendar-drag';

type NewEventDialogProps = {
  dialogId: string;
  fieldPrefix: string;
  categories: readonly Category[];
  draftTimes: EventTimes | null;
  isSaving: boolean;
  calendarTimeZone: string;
  now: Date;
  onSubmit: (submitEvent: FormEvent<HTMLFormElement>) => void;
};

const NewEventForm = ({
  dialogId,
  fieldPrefix,
  categories,
  draftTimes,
  isSaving,
  calendarTimeZone,
  now,
  onSubmit,
}: NewEventDialogProps) => {
  const draftDate = partsInZone(draftTimes?.startsAt ?? now, calendarTimeZone).calendarDate;
  const [typedStartDate, setTypedStartDate] = useState('');

  return (
    <form noValidate className="grid gap-5 p-5" onSubmit={onSubmit}>
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
          timeZone={calendarTimeZone}
          minuteStep={15}
          onChangeDate={setTypedStartDate}
        />
        <DateTimeField
          label="Ends"
          idPrefix={`${fieldPrefix}-ends`}
          moment={draftTimes?.endsAt ?? null}
          timeZone={calendarTimeZone}
          minuteStep={15}
        />
      </div>
      <RepeatPicker
        idPrefix={`${fieldPrefix}-repeat`}
        name="repeat"
        firstDate={typedStartDate === '' ? draftDate : typedStartDate}
        initialRule={null}
      />
      <MoreOptions>
        <TimeZoneField
          id={`${fieldPrefix}-time-zone`}
          name="timeZone"
          label="Time zone"
          hint="The event keeps its time in this zone, even across daylight saving."
          selectedTimeZone={calendarTimeZone}
          now={now}
        />
      </MoreOptions>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" popoverTarget={dialogId} popoverTargetAction="hide">
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Adding…' : 'Add event'}
        </Button>
      </div>
    </form>
  );
};

const NewEventDialog = (dialogProps: NewEventDialogProps) => (
  <PopoverPanel id={dialogProps.dialogId} label="New event">
    <NewEventForm
      key={
        dialogProps.draftTimes === null ? 'empty' : dialogProps.draftTimes.startsAt.toISOString()
      }
      {...dialogProps}
    />
  </PopoverPanel>
);

export default NewEventDialog;

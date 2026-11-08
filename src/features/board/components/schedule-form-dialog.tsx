'use client';

import { useState, type FormEvent } from 'react';
import type { Category } from '@/core/category';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Select from '@/core/components/atoms/select';
import Switch from '@/core/components/atoms/switch';
import CategoryPicker from '@/core/components/molecules/category-picker';
import Field from '@/core/components/molecules/field';
import MoreOptions from '@/core/components/molecules/more-options';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import SegmentedControl from '@/core/components/molecules/segmented-control';
import TimeZoneField from '@/core/components/molecules/time-zone-field';
import RepeatPicker from '@/core/components/organisms/repeat-picker';
import localCalendarDate from '@/core/local-date';
import hidePopover from '@/core/popover';
import { repeatPresetsFor } from '@/core/repeat-rule';
import type BoardList from '@/features/board/entities/board-list';
import type CardSchedule from '@/features/board/entities/card-schedule';
import { formatClock, type CardScheduleKind } from '@/features/board/entities/card-schedule';

const KIND_LABELS: Record<CardScheduleKind, string> = { once: 'Once', repeating: 'Repeating' };
const BLOCK_LENGTH_MINUTES = [15, 30, 45, 60, 90, 120, 180] as const;
const DEFAULT_BLOCK_MINUTES = 60;

const blockLengthLabel = (lengthMinutes: number): string => {
  if (lengthMinutes < 60) return `${lengthMinutes} minutes`;
  const hours = lengthMinutes / 60;
  return hours === 1 ? '1 hour' : `${hours} hours`;
};

type ScheduleFormDialogProps = {
  id: string;
  cardTitle: string;
  editedSchedule: CardSchedule | null;
  formResetCount: number;
  lists: readonly BoardList[];
  categories: readonly Category[];
  calendarTimeZone: string;
  now: Date;
};

const ScheduleFormDialog = ({
  id,
  editedSchedule,
  formResetCount,
  ...formProps
}: ScheduleFormDialogProps) => (
  <PopoverPanel
    id={id}
    label={editedSchedule === null ? 'Add schedule' : 'Edit schedule'}
    className="w-[min(440px,calc(100vw-2rem))]"
  >
    {formResetCount > 0 && (
      <ScheduleForm
        key={`${editedSchedule?.id ?? 'new'}-${formResetCount}`}
        dialogId={id}
        editedSchedule={editedSchedule}
        {...formProps}
      />
    )}
  </PopoverPanel>
);

type ScheduleFormProps = Omit<ScheduleFormDialogProps, 'id' | 'formResetCount'> & {
  dialogId: string;
};

const ScheduleForm = ({
  dialogId,
  cardTitle,
  editedSchedule,
  lists,
  categories,
  calendarTimeZone,
  now,
}: ScheduleFormProps) => {
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);
  const startsAt = editedSchedule?.firstAt ?? nextHour;
  const [scheduleKind, setScheduleKind] = useState<CardScheduleKind>(
    editedSchedule?.kind ?? 'once',
  );
  const [pickedDate, setPickedDate] = useState(localCalendarDate(startsAt));
  const [isBlockingTime, setIsBlockingTime] = useState(editedSchedule?.calendarBlock != null);
  const isRepeating = scheduleKind === 'repeating';
  const fieldPrefix = `${dialogId}-field`;
  const weeklyRule =
    repeatPresetsFor(pickedDate).find((repeatPreset) => repeatPreset.key === 'weekly')?.rule ??
    null;

  const submitSchedule = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    hidePopover(dialogId);
  };

  return (
    <form
      noValidate
      className="grid max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto p-5"
      onSubmit={submitSchedule}
    >
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-foreground">
          {editedSchedule === null ? 'Add schedule' : 'Edit schedule'}
        </h2>
        <p className="truncate text-[13px] text-muted-foreground">
          Moves <span className="font-medium text-foreground">{cardTitle}</span> by itself.
        </p>
      </div>
      <div>
        <SegmentedControl
          label="How often"
          options={[KIND_LABELS.once, KIND_LABELS.repeating]}
          selectedOption={KIND_LABELS[scheduleKind]}
          onSelectOption={(chosenLabel) =>
            setScheduleKind(chosenLabel === KIND_LABELS.repeating ? 'repeating' : 'once')
          }
        />
      </div>
      <Field label="Move to" htmlFor={`${fieldPrefix}-list`}>
        <Select
          id={`${fieldPrefix}-list`}
          name="targetListId"
          defaultValue={
            editedSchedule === null ? (lists[0]?.id ?? '') : (editedSchedule.targetListId ?? '')
          }
        >
          {editedSchedule !== null && editedSchedule.targetListId === null ? (
            <option value="" disabled>
              Pick a column
            </option>
          ) : null}
          {lists.map((boardList) => (
            <option key={boardList.id} value={boardList.id}>
              {boardList.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-3">
        <Field label={isRepeating ? 'First date' : 'Date'} htmlFor={`${fieldPrefix}-date`}>
          <Input
            id={`${fieldPrefix}-date`}
            name="date"
            type="date"
            value={pickedDate}
            onChange={(changeEvent) => setPickedDate(changeEvent.currentTarget.value)}
            className="tabular-nums"
          />
        </Field>
        <Field label="Time" htmlFor={`${fieldPrefix}-time`}>
          <Input
            id={`${fieldPrefix}-time`}
            name="time"
            type="time"
            step={300}
            defaultValue={formatClock(startsAt)}
            className="tabular-nums"
          />
        </Field>
      </div>
      {isRepeating ? (
        <>
          <RepeatPicker
            idPrefix={`${fieldPrefix}-repeat`}
            name="repeat"
            firstDate={pickedDate}
            initialRule={editedSchedule?.repeatRule ?? weeklyRule}
            isRepeatRequired
          />
          <div className="grid gap-3 rounded-xl bg-surface p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-0.5">
                <span className="text-[13px] font-medium text-foreground">Block calendar time</span>
                <span className="text-xs text-muted-foreground">
                  Each run adds a planned event named after the card.
                </span>
              </div>
              <Switch
                isOn={isBlockingTime}
                label="Block calendar time"
                onToggle={() => setIsBlockingTime((wasBlocking) => !wasBlocking)}
              />
            </div>
            {isBlockingTime ? (
              <>
                <Field label="Length" htmlFor={`${fieldPrefix}-block-length`}>
                  <Select
                    id={`${fieldPrefix}-block-length`}
                    name="blockMinutes"
                    defaultValue={
                      editedSchedule?.calendarBlock?.lengthMinutes ?? DEFAULT_BLOCK_MINUTES
                    }
                  >
                    {BLOCK_LENGTH_MINUTES.map((lengthMinutes) => (
                      <option key={lengthMinutes} value={lengthMinutes}>
                        {blockLengthLabel(lengthMinutes)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <CategoryPicker
                  name={`${fieldPrefix}-block-category`}
                  legend="Category"
                  categories={categories}
                  selectedCategoryId={editedSchedule?.calendarBlock?.categoryId ?? null}
                />
              </>
            ) : null}
          </div>
        </>
      ) : null}
      <MoreOptions>
        <TimeZoneField
          id={`${fieldPrefix}-time-zone`}
          name="timeZone"
          label="Time zone"
          hint="The schedule runs at this time in this zone, even across daylight saving."
          selectedTimeZone={editedSchedule?.timeZone ?? calendarTimeZone}
          now={now}
        />
      </MoreOptions>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" popoverTarget={dialogId} popoverTargetAction="hide">
          Cancel
        </Button>
        <Button type="submit">{editedSchedule === null ? 'Add schedule' : 'Save'}</Button>
      </div>
    </form>
  );
};

export default ScheduleFormDialog;

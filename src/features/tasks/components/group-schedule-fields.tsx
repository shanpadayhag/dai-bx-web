'use client';

import { useState } from 'react';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import RepeatPicker from '@/core/components/organisms/repeat-picker';
import type { RepeatRule } from '@/core/repeat-rule';
import type { GroupShows, GroupUnchecks } from '@/features/tasks/entities/group-schedule';

type GroupScheduleFieldsProps = {
  idPrefix: string;
  firstDate: string;
  initialShows: GroupShows | null;
  initialUnchecks: GroupUnchecks | null;
};

const DEFAULT_UNCHECK_TIME = '00:00';

const GroupScheduleFields = ({
  idPrefix,
  firstDate,
  initialShows,
  initialUnchecks,
}: GroupScheduleFieldsProps) => {
  const [chosenShowRule, setChosenShowRule] = useState<RepeatRule | null>(
    initialShows?.repeat ?? null,
  );
  const [chosenUncheckRule, setChosenUncheckRule] = useState<RepeatRule | null>(
    initialUnchecks?.repeat ?? null,
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-xl bg-surface p-3.5">
        <RepeatPicker
          idPrefix={`${idPrefix}-shows`}
          name="showRule"
          label="Shows"
          noRepeatLabel="Always"
          firstDate={firstDate}
          initialRule={initialShows?.repeat ?? null}
          onChooseRule={setChosenShowRule}
        />
        {chosenShowRule === null ? (
          <p className="text-xs text-muted-foreground">In Due now every day, all day.</p>
        ) : (
          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-[13px] font-medium text-foreground">Between</legend>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <Input
                id={`${idPrefix}-window-start`}
                name="windowStart"
                type="time"
                step={300}
                aria-label="Shows from"
                defaultValue={initialShows?.windowStart ?? ''}
                className="tabular-nums"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                id={`${idPrefix}-window-end`}
                name="windowEnd"
                type="time"
                step={300}
                aria-label="Shows until"
                defaultValue={initialShows?.windowEnd ?? ''}
                className="tabular-nums"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty for all day. An end before the start runs past midnight.
            </p>
          </fieldset>
        )}
      </div>
      <div className="grid gap-3 rounded-xl bg-surface p-3.5">
        <RepeatPicker
          idPrefix={`${idPrefix}-unchecks`}
          name="uncheckRule"
          label="Unchecks"
          noRepeatLabel="Never"
          firstDate={firstDate}
          initialRule={initialUnchecks?.repeat ?? null}
          onChooseRule={setChosenUncheckRule}
        />
        {chosenUncheckRule === null ? (
          <p className="text-xs text-muted-foreground">Ticked tasks stay ticked.</p>
        ) : (
          <Field
            label="At"
            htmlFor={`${idPrefix}-uncheck-time`}
            hint="Every task in the group shows unticked again from this time."
          >
            <Input
              id={`${idPrefix}-uncheck-time`}
              name="uncheckTime"
              type="time"
              step={300}
              defaultValue={initialUnchecks?.time ?? DEFAULT_UNCHECK_TIME}
              className="w-32 tabular-nums"
            />
          </Field>
        )}
      </div>
    </div>
  );
};

export default GroupScheduleFields;

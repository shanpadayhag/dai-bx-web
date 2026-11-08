'use client';

import { useMemo } from 'react';
import Select from '@/core/components/atoms/select';
import Field from '@/core/components/molecules/field';
import { timeZoneLabel, timeZoneNames } from '@/core/time-zone';

type TimeZoneFieldProps = {
  id: string;
  name: string;
  label: string;
  hint?: string;
  selectedTimeZone: string;
  now: Date;
  onChangeTimeZone?: (chosenTimeZone: string) => void;
};

const TimeZoneField = ({
  id,
  name,
  label,
  hint,
  selectedTimeZone,
  now,
  onChangeTimeZone,
}: TimeZoneFieldProps) => {
  const zoneOptions = useMemo(
    () =>
      timeZoneNames(selectedTimeZone).map((zoneName) => ({
        zoneName,
        zoneLabel: timeZoneLabel(zoneName, now),
      })),
    [now, selectedTimeZone],
  );

  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <Select
        id={id}
        name={name}
        defaultValue={selectedTimeZone}
        onChange={
          onChangeTimeZone === undefined
            ? undefined
            : (changeEvent) => onChangeTimeZone(changeEvent.currentTarget.value)
        }
      >
        {zoneOptions.map((zoneOption) => (
          <option key={zoneOption.zoneName} value={zoneOption.zoneName}>
            {zoneOption.zoneLabel}
          </option>
        ))}
      </Select>
    </Field>
  );
};

export default TimeZoneField;

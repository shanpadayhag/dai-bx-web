'use client';

import { useMemo } from 'react';
import Switch from '@/core/components/atoms/switch';
import TimeZoneField from '@/core/components/molecules/time-zone-field';
import { deviceTimeZone, timeZoneLabel } from '@/core/time-zone';
import SettingRow from '@/features/settings/components/setting-row';

type CalendarTimeZoneSettingProps = {
  calendarTimeZone: string | null;
  resetCount: number;
  onChooseTimeZone: (chosenTimeZone: string | null) => void;
};

const CalendarTimeZoneSetting = ({
  calendarTimeZone,
  resetCount,
  onChooseTimeZone,
}: CalendarTimeZoneSettingProps) => {
  const now = useMemo(() => new Date(), []);
  const deviceZone = useMemo(() => deviceTimeZone(), []);
  const isUsingDeviceZone = calendarTimeZone === null;

  return (
    <>
      <SettingRow
        title="Use device time zone"
        description={`This device is on ${timeZoneLabel(deviceZone, now)}.`}
        control={
          <Switch
            isOn={isUsingDeviceZone}
            label="Use device time zone"
            onToggle={() => onChooseTimeZone(isUsingDeviceZone ? deviceZone : null)}
          />
        }
      />
      {isUsingDeviceZone ? null : (
        <TimeZoneField
          key={`${calendarTimeZone}-${resetCount}`}
          id="calendar-time-zone"
          name="calendarTimeZone"
          label="Calendar time zone"
          hint="New events and schedules start in this zone too. You can change each one under More options."
          selectedTimeZone={calendarTimeZone}
          now={now}
          onChangeTimeZone={onChooseTimeZone}
        />
      )}
    </>
  );
};

export default CalendarTimeZoneSetting;

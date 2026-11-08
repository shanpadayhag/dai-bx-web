'use client';

import { useMemo, useState } from 'react';
import Switch from '@/core/components/atoms/switch';
import TimeZoneField from '@/core/components/molecules/time-zone-field';
import { deviceTimeZone, timeZoneLabel } from '@/core/time-zone';
import SettingRow from '@/features/settings/components/setting-row';

const CalendarTimeZoneSetting = () => {
  const now = useMemo(() => new Date(), []);
  const deviceZone = useMemo(() => deviceTimeZone(), []);
  const [isUsingDeviceZone, setIsUsingDeviceZone] = useState(true);

  return (
    <>
      <SettingRow
        title="Use device time zone"
        description={`This device is on ${timeZoneLabel(deviceZone, now)}.`}
        control={
          <Switch
            isOn={isUsingDeviceZone}
            label="Use device time zone"
            onToggle={() => setIsUsingDeviceZone((wasUsingDeviceZone) => !wasUsingDeviceZone)}
          />
        }
      />
      {isUsingDeviceZone ? null : (
        <TimeZoneField
          id="calendar-time-zone"
          name="calendarTimeZone"
          label="Calendar time zone"
          hint="New events and schedules start in this zone too. You can change each one under More options."
          selectedTimeZone={deviceZone}
          now={now}
        />
      )}
    </>
  );
};

export default CalendarTimeZoneSetting;

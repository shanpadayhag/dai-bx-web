import Input from '@/core/components/atoms/input';
import Switch from '@/core/components/atoms/switch';
import SettingRow from '@/features/settings/components/setting-row';
import {
  PLANNING_WEEKDAY_NAMES,
  type PlanningDayField,
  type PlanningWeek,
} from '@/features/tracking/entities/planning-hours';

type PlanningHoursSettingProps = {
  planningHours: PlanningWeek | null;
  resetCount: number;
  onToggleSameAsWorkingHours: () => void;
  onToggleDayOff: (dayIndex: number) => void;
  onCommitDayTime: (dayIndex: number, dayField: PlanningDayField, clockText: string) => void;
};

const PlanningHoursSetting = ({
  planningHours,
  resetCount,
  onToggleSameAsWorkingHours,
  onToggleDayOff,
  onCommitDayTime,
}: PlanningHoursSettingProps) => (
  <div className="grid gap-4 border-t border-border pt-5">
    <SettingRow
      title="Plan in my working hours"
      description="Plan puts tasks only inside these hours. Turn this off to set each day."
      control={
        <Switch
          isOn={planningHours === null}
          label="Plan in my working hours"
          onToggle={onToggleSameAsWorkingHours}
        />
      }
    />
    {planningHours === null ? null : (
      <ul className="grid gap-1" aria-label="Planning hours">
        {PLANNING_WEEKDAY_NAMES.map((weekdayName, dayIndex) => {
          const planningDay = planningHours[dayIndex] ?? null;
          return (
            <li
              key={weekdayName}
              className="grid grid-cols-[6.5rem_auto_minmax(0,1fr)] items-center gap-3 rounded-[10px] py-1.5 sm:grid-cols-[7.5rem_auto_minmax(0,1fr)]"
            >
              <span className="text-sm font-medium text-foreground">{weekdayName}</span>
              <Switch
                isOn={planningDay !== null}
                label={`Plan on ${weekdayName}`}
                onToggle={() => onToggleDayOff(dayIndex)}
              />
              {planningDay === null ? (
                <span className="text-sm text-muted-foreground">Off</span>
              ) : (
                <span className="flex min-w-0 items-center gap-2">
                  <Input
                    key={`${planningDay.start}-${resetCount}`}
                    aria-label={`${weekdayName} starts`}
                    type="time"
                    defaultValue={planningDay.start}
                    onBlur={(blurEvent) => {
                      if (blurEvent.currentTarget.value === planningDay.start) return;
                      onCommitDayTime(dayIndex, 'start', blurEvent.currentTarget.value);
                    }}
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    key={`${planningDay.end}-${resetCount}`}
                    aria-label={`${weekdayName} ends`}
                    type="time"
                    defaultValue={planningDay.end}
                    onBlur={(blurEvent) => {
                      if (blurEvent.currentTarget.value === planningDay.end) return;
                      onCommitDayTime(dayIndex, 'end', blurEvent.currentTarget.value);
                    }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

export default PlanningHoursSetting;

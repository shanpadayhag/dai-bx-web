import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import { wallClockInZone } from '@/core/zoned-time';

type DateTimeFieldProps = {
  label: string;
  idPrefix: string;
  moment: Date | null;
  timeZone: string;
  minuteStep?: number;
  onChangeDate?: (dateValue: string) => void;
};

const DateTimeField = ({
  label,
  idPrefix,
  moment,
  timeZone,
  minuteStep,
  onChangeDate,
}: DateTimeFieldProps) => {
  const [dateValue = '', timeValue = ''] =
    moment === null ? [] : wallClockInZone(moment, timeZone).split('T');
  return (
    <Field label={label} htmlFor={`${idPrefix}-day`}>
      <div className="@container">
        <div className="grid gap-2 @[20rem]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Input
            id={`${idPrefix}-day`}
            name={`${idPrefix}-day`}
            type="date"
            defaultValue={dateValue}
            onChange={
              onChangeDate === undefined
                ? undefined
                : (changeEvent) => onChangeDate(changeEvent.currentTarget.value)
            }
          />
          <Input
            id={`${idPrefix}-time`}
            name={`${idPrefix}-time`}
            type="time"
            step={minuteStep === undefined ? undefined : minuteStep * 60}
            aria-label={`${label} time`}
            defaultValue={timeValue}
          />
        </div>
      </div>
    </Field>
  );
};

export default DateTimeField;

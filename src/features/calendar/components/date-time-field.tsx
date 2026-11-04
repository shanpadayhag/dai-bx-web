import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';

type DateTimeFieldProps = {
  label: string;
  idPrefix: string;
  moment: Date | null;
  minuteStep?: number;
};

const dateInputValue = (moment: Date): string =>
  `${moment.getFullYear()}-${String(moment.getMonth() + 1).padStart(2, '0')}-${String(moment.getDate()).padStart(2, '0')}`;

const timeInputValue = (moment: Date): string =>
  `${String(moment.getHours()).padStart(2, '0')}:${String(moment.getMinutes()).padStart(2, '0')}`;

const DateTimeField = ({ label, idPrefix, moment, minuteStep }: DateTimeFieldProps) => (
  <Field label={label} htmlFor={`${idPrefix}-day`}>
    <div className="@container">
      <div className="grid gap-2 @[20rem]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Input
          id={`${idPrefix}-day`}
          type="date"
          defaultValue={moment === null ? '' : dateInputValue(moment)}
        />
        <Input
          id={`${idPrefix}-time`}
          type="time"
          step={minuteStep === undefined ? undefined : minuteStep * 60}
          aria-label={`${label} time`}
          defaultValue={moment === null ? '' : timeInputValue(moment)}
        />
      </div>
    </div>
  </Field>
);

export default DateTimeField;

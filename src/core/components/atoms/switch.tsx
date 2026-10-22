import joinClassNames from '@/core/class-names';

type SwitchProps = {
  isOn: boolean;
  label: string;
};

const Switch = ({ isOn, label }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={isOn}
    aria-label={label}
    className={joinClassNames(
      'relative inline-flex h-5.5 w-9.5 shrink-0 items-center rounded-full transition-colors duration-150',
      isOn ? 'bg-primary' : 'bg-border-strong',
    )}
  >
    <span
      className={joinClassNames(
        'size-4.5 rounded-full bg-white shadow-soft transition-transform duration-150',
        isOn ? 'translate-x-[18px]' : 'translate-x-0.5',
      )}
    />
  </button>
);

export default Switch;

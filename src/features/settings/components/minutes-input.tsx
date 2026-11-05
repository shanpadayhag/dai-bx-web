import Input from '@/core/components/atoms/input';

type MinutesInputProps = {
  id: string;
  defaultMinutes: number;
  onCommitMinutes: (minutesText: string) => void;
};

const MinutesInput = ({ id, defaultMinutes, onCommitMinutes }: MinutesInputProps) => (
  <div className="relative">
    <Input
      id={id}
      type="number"
      inputMode="numeric"
      min={5}
      max={240}
      step={5}
      defaultValue={defaultMinutes}
      onBlur={(blurEvent) => {
        if (blurEvent.currentTarget.value !== String(defaultMinutes)) {
          onCommitMinutes(blurEvent.currentTarget.value);
        }
      }}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === 'Enter') keyEvent.currentTarget.blur();
      }}
      className="pr-12 font-mono tabular-nums"
    />
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
      min
    </span>
  </div>
);

export default MinutesInput;

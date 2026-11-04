import Input from '@/core/components/atoms/input';

type MinutesInputProps = {
  id: string;
  defaultMinutes: number;
};

const MinutesInput = ({ id, defaultMinutes }: MinutesInputProps) => (
  <div className="relative">
    <Input
      id={id}
      type="number"
      min={5}
      max={240}
      step={5}
      defaultValue={defaultMinutes}
      className="pr-12 font-mono tabular-nums"
    />
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
      min
    </span>
  </div>
);

export default MinutesInput;

import type { ReactNode } from 'react';

type SettingRowProps = {
  title: string;
  description: string;
  control: ReactNode;
};

const SettingRow = ({ title, description, control }: SettingRowProps) => (
  <div className="flex items-start justify-between gap-6">
    <div className="grid gap-0.5">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-[13px] text-muted-foreground">{description}</p>
    </div>
    <div className="shrink-0 pt-0.5">{control}</div>
  </div>
);

export default SettingRow;

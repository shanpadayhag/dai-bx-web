import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-border-strong px-6 py-10 text-center">
    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary [&_svg]:size-5">
      {icon}
    </span>
    <div className="grid gap-1">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-[36ch] text-[13px] text-muted-foreground">{description}</p>
    </div>
    {action}
  </div>
);

export default EmptyState;

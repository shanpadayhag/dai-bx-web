import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <header className="flex flex-wrap items-end justify-between gap-4">
    <div className="grid gap-1">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </header>
);

export default PageHeader;

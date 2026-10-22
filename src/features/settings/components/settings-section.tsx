import type { ReactNode } from 'react';

type SettingsSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const SettingsSection = ({ title, description, children }: SettingsSectionProps) => (
  <section className="grid gap-5 border-b border-border py-8 first:pt-0 last:border-b-0 md:grid-cols-[240px_1fr] md:gap-10">
    <div className="grid content-start gap-1">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="text-[13px] text-muted-foreground">{description}</p>
    </div>
    <div className="grid content-start gap-5">{children}</div>
  </section>
);

export default SettingsSection;

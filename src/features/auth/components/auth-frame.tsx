import type { ReactNode } from 'react';
import Logo from '@/core/components/atoms/logo';

type AuthFrameProps = {
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
};

const AuthFrame = ({ title, description, footer, children }: AuthFrameProps) => (
  <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <div className="flex flex-col px-6 py-8 sm:px-12">
      <Logo />
      <div className="mx-auto grid w-full max-w-[380px] flex-1 content-center gap-8 py-12">
        <div className="grid gap-2">
          <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
        <p className="text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
    <div className="relative isolate hidden overflow-hidden bg-ink lg:block">
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-24 -z-10 size-[640px] rounded-full bg-[radial-gradient(circle_farthest-side,var(--glow),transparent)] opacity-70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 -z-10 size-[420px] rounded-full bg-[radial-gradient(circle_farthest-side,#7aa2ff,transparent)] opacity-30 blur-3xl"
      />
      <div className="flex h-full flex-col justify-end gap-6 p-14">
        <p className="max-w-[18ch] text-5xl leading-[1.05] tracking-[-0.03em] text-ink-foreground">
          Start a task. <span className="font-serif text-[1.08em] italic">The calendar</span> writes
          itself.
        </p>
        <p className="max-w-[44ch] text-[15px] text-ink-muted">
          Every task you start becomes a calendar event, and finishing it sets the end. Your week
          shows what you actually did, not just what you planned.
        </p>
      </div>
    </div>
  </div>
);

export default AuthFrame;

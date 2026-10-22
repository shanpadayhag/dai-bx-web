import { ArrowRight } from 'lucide-react';
import Button from '@/core/components/atoms/button';

const ClosingCallToAction = () => (
  <section className="px-3 pb-3 sm:px-4 sm:pb-4">
    <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-ink px-6 py-24 text-center sm:py-32">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,var(--ink)_45%,color-mix(in_oklab,var(--glow)_70%,transparent)_160%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-48 left-1/2 -z-10 h-[360px] w-[760px] -translate-x-1/2 rounded-full bg-glow/40 blur-[110px]"
      />
      <div className="mx-auto grid max-w-2xl justify-items-center gap-6">
        <h2 className="text-4xl leading-[1.05] font-medium tracking-[-0.035em] text-ink-foreground sm:text-6xl">
          See your week{' '}
          <span className="font-serif text-[1.1em] font-normal tracking-[-0.02em] italic">
            as it really went
          </span>
        </h2>
        <p className="max-w-[46ch] text-[17px] text-ink-muted">
          Start one task today. By Friday your calendar shows where the hours went.
        </p>
        <Button href="/sign-up" variant="inverse" size="lg">
          Create your workspace
          <ArrowRight />
        </Button>
      </div>
    </div>
  </section>
);

export default ClosingCallToAction;

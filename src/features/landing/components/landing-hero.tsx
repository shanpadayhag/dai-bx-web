import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Button from '@/core/components/atoms/button';
import appConfig from '@/core/config/app-config';
import HeroProductPreview from '@/features/landing/components/hero-product-preview';
import GithubMark from '@/core/components/atoms/github-mark';

const LandingHero = () => (
  <section className="px-3 pt-3 sm:px-4">
    <div className="relative isolate -mt-[76px] overflow-hidden rounded-t-3xl rounded-b-[3rem] bg-gradient-to-b from-background via-background to-primary/15 px-4 pt-36 pb-20 sm:pt-40 sm:pb-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -bottom-40 -left-40 size-[620px] rounded-full bg-[radial-gradient(circle_farthest-side,color-mix(in_oklab,var(--glow)_55%,transparent),transparent)] blur-[90px]" />
        <div className="absolute -bottom-40 -left-24 size-[360px] rounded-full bg-[radial-gradient(circle_farthest-side,var(--glow),transparent)] opacity-60 blur-2xl" />
        <div className="absolute -right-40 -bottom-40 size-[620px] rounded-full bg-[radial-gradient(circle_farthest-side,color-mix(in_oklab,var(--glow)_55%,transparent),transparent)] blur-[90px]" />
        <div className="absolute -right-24 -bottom-40 size-[360px] rounded-full bg-[radial-gradient(circle_farthest-side,var(--glow),transparent)] opacity-60 blur-2xl" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,var(--background),transparent_70%)]" />
      </div>
      <div className="mx-auto grid max-w-3xl justify-items-center gap-7 text-center">
        <Link
          href="/changelog"
          className="group inline-flex h-8 animate-rise-in items-center gap-2 rounded-full border border-border bg-background/80 pr-2 pl-1 text-[13px] text-muted-foreground shadow-soft backdrop-blur transition-colors duration-150 hover:text-foreground"
        >
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            v3
          </span>
          Tasks, board and calendar in one app
          <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
        <h1 className="animate-rise-in text-[44px] leading-[1.02] font-medium tracking-[-0.04em] text-foreground [animation-delay:80ms] sm:text-7xl">
          Start a task.
          <br />
          <span className="font-serif text-[1.1em] font-normal tracking-[-0.02em] text-primary italic">
            The calendar
          </span>{' '}
          keeps time.
        </h1>
        <p className="max-w-[54ch] animate-rise-in text-base text-muted-foreground [animation-delay:160ms] sm:text-lg">
          DaiBX is one open-source workspace for nested tasks, a board and a calendar. Press start
          and the calendar records it; press finish and the event closes. If you wandered off, a
          check-in catches it.
        </p>
        <div className="flex animate-rise-in flex-wrap justify-center gap-3 [animation-delay:240ms]">
          <Button href="/sign-up" size="lg">
            Get started
            <ArrowRight />
          </Button>
          <Button href={appConfig.repositoryUrl} variant="secondary" size="lg">
            <GithubMark />
            View the source
          </Button>
        </div>
      </div>
      <div className="mt-16 animate-rise-in [animation-delay:320ms] sm:mt-20">
        <HeroProductPreview />
      </div>
    </div>
  </section>
);

export default LandingHero;

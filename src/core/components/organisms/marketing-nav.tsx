import { Menu } from 'lucide-react';
import Link from 'next/link';
import Button from '@/core/components/atoms/button';
import Logo from '@/core/components/atoms/logo';
import appConfig from '@/core/config/app-config';
import GithubMark from '@/core/components/atoms/github-mark';

const navigationLinks = [
  { label: 'Product', href: '/#product' },
  { label: 'Time tracking', href: '/#time-tracking' },
  { label: 'Workflows', href: '/#workflows' },
  { label: 'Changelog', href: '/changelog' },
] as const;

const MarketingNav = () => (
  <header className="sticky top-3 z-50 mx-auto w-full max-w-6xl px-4">
    <nav
      aria-label="Main"
      className="flex h-14 items-center justify-between gap-4 rounded-2xl border border-border/80 bg-background/80 pr-2 pl-4 shadow-soft backdrop-blur-xl"
    >
      <Logo />
      <ul className="hidden items-center gap-1 md:flex">
        {navigationLinks.map((navigationLink) => (
          <li key={navigationLink.href}>
            <Link
              href={navigationLink.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {navigationLink.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-1.5">
        <a
          href={appConfig.repositoryUrl}
          aria-label="DaiBX on GitHub"
          className="hidden size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-surface-strong hover:text-foreground sm:inline-flex"
        >
          <GithubMark />
        </a>
        <Button href="/sign-in" variant="ghost" className="hidden sm:inline-flex">
          Sign in
        </Button>
        <Button href="/sign-up">Get started</Button>
        <button
          type="button"
          popoverTarget="marketing-menu"
          aria-label="Open menu"
          className="inline-flex size-9 items-center justify-center rounded-lg text-foreground hover:bg-surface-strong md:hidden"
        >
          <Menu className="size-5" />
        </button>
      </div>
    </nav>
    <div
      id="marketing-menu"
      popover="auto"
      className="mx-4 mt-20 w-[calc(100vw-2rem)] rounded-2xl border border-border bg-background p-2 shadow-lift"
    >
      <ul className="grid">
        {navigationLinks.map((navigationLink) => (
          <li key={navigationLink.href}>
            <Link
              href={navigationLink.href}
              className="block rounded-lg px-3 py-3 text-[15px] text-foreground hover:bg-surface"
            >
              {navigationLink.label}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/sign-in"
            className="block rounded-lg px-3 py-3 text-[15px] text-foreground hover:bg-surface"
          >
            Sign in
          </Link>
        </li>
      </ul>
    </div>
  </header>
);

export default MarketingNav;

import Link from 'next/link';
import Logo from '@/core/components/atoms/logo';
import appConfig from '@/core/config/app-config';

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Tasks', href: '/#product' },
      { label: 'Board', href: '/#product' },
      { label: 'Calendar', href: '/#time-tracking' },
      { label: 'Workflows', href: '/#workflows' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'Changelog', href: '/changelog' },
      { label: 'Source code', href: appConfig.repositoryUrl },
      { label: 'Report an issue', href: `${appConfig.repositoryUrl}/issues` },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', href: '/sign-in' },
      { label: 'Create an account', href: '/sign-up' },
    ],
  },
] as const;

const MarketingFooter = () => (
  <footer className="border-t border-border">
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
      <div className="grid content-start gap-3">
        <Logo />
        <p className="max-w-[32ch] text-sm text-muted-foreground">
          Tasks, a board and a calendar that share one source of truth. Open source, built in
          public.
        </p>
      </div>
      {footerColumns.map((footerColumn) => (
        <div key={footerColumn.title} className="grid content-start gap-3">
          <p className="text-[13px] font-medium text-foreground">{footerColumn.title}</p>
          <ul className="grid gap-2">
            {footerColumn.links.map((footerLink) => (
              <li key={footerLink.label}>
                <Link
                  href={footerLink.href}
                  className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                >
                  {footerLink.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-6 text-[13px] text-muted-foreground">
      <p>© 2026 DaiBX. Open source on GitHub.</p>
      <p>Made in Manila.</p>
    </div>
  </footer>
);

export default MarketingFooter;

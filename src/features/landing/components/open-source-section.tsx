import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import appConfig from '@/core/config/app-config';
import GithubMark from '@/core/components/atoms/github-mark';

const stackParts = [
  { name: 'Rust + Axum', role: 'API, on AWS Lambda' },
  { name: 'Postgres', role: 'Every record, on Supabase' },
  { name: 'Next.js', role: 'This site and the app' },
] as const;

const OpenSourceSection = () => (
  <section className="mx-auto max-w-6xl px-4 pb-24 sm:pb-32">
    <div className="grid gap-10 rounded-3xl border border-border p-6 sm:p-10 lg:grid-cols-[1fr_1fr] lg:items-center">
      <div className="grid gap-4">
        <h2 className="text-3xl leading-tight font-medium tracking-[-0.03em] text-foreground sm:text-4xl">
          Open source, built in public
        </h2>
        <p className="max-w-[48ch] text-[15px] text-muted-foreground">
          Read the code, file an issue, or run it yourself. Every release is written up in the
          changelog.
        </p>
        <div className="flex flex-wrap gap-4 pt-2 text-sm">
          <a
            href={appConfig.repositoryUrl}
            className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary"
          >
            <GithubMark />
            shanpadayhag/dai-bx-web
          </a>
          <Link
            href="/changelog"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Read the changelog
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
      <ul className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border">
        {stackParts.map((stackPart) => (
          <li
            key={stackPart.name}
            className="flex items-baseline justify-between gap-4 bg-background px-5 py-4"
          >
            <span className="text-[15px] font-medium text-foreground">{stackPart.name}</span>
            <span className="text-sm text-muted-foreground">{stackPart.role}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default OpenSourceSection;

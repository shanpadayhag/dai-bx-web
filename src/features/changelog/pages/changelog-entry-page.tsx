import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ComponentType } from 'react';
import ChangelogEntry from '@/features/changelog/entities/changelog-entry';
import ChangelogDate from '@/features/changelog/components/changelog-date';
import ReleaseArt from '@/features/changelog/components/release-art';

type ChangelogEntryPageProps = {
  changelogEntry: ChangelogEntry;
  Content: ComponentType;
  newerEntry: ChangelogEntry | null;
  olderEntry: ChangelogEntry | null;
};

const ChangelogEntryPage = ({
  changelogEntry,
  Content,
  newerEntry,
  olderEntry,
}: ChangelogEntryPageProps) => (
  <article className="mx-auto grid max-w-3xl gap-10 px-4 pt-16 pb-24 sm:pt-24">
    <Link
      href="/changelog"
      className="inline-flex items-center gap-1.5 justify-self-start text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Changelog
    </Link>
    <header className="grid gap-5">
      <p className="flex items-center gap-3 text-sm text-muted-foreground">
        <ChangelogDate date={changelogEntry.date} />
        <span className="inline-flex h-6 items-center rounded-md bg-primary-soft px-2 font-mono text-xs font-medium text-primary-soft-foreground">
          {changelogEntry.version}
        </span>
      </p>
      <h1 className="text-4xl leading-[1.08] font-medium tracking-[-0.035em] text-foreground sm:text-5xl">
        {changelogEntry.title}
      </h1>
      <p className="text-lg text-muted-foreground">{changelogEntry.summary}</p>
    </header>
    <ReleaseArt version={changelogEntry.version} />
    <div className="prose-changelog">
      <Content />
    </div>
    <nav
      aria-label="More releases"
      className="grid gap-3 border-t border-border pt-8 sm:grid-cols-2"
    >
      {newerEntry ? (
        <Link
          href={`/changelog/${newerEntry.slug}`}
          className="grid gap-1 rounded-2xl border border-border p-4 transition-colors duration-150 hover:border-primary/40 hover:bg-surface"
        >
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeft className="size-3.5" />
            Newer
          </span>
          <span className="text-sm font-medium text-foreground">{newerEntry.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {olderEntry ? (
        <Link
          href={`/changelog/${olderEntry.slug}`}
          className="grid gap-1 rounded-2xl border border-border p-4 text-right transition-colors duration-150 hover:border-primary/40 hover:bg-surface"
        >
          <span className="inline-flex items-center justify-end gap-1 text-xs text-muted-foreground">
            Older
            <ArrowRight className="size-3.5" />
          </span>
          <span className="text-sm font-medium text-foreground">{olderEntry.title}</span>
        </Link>
      ) : null}
    </nav>
  </article>
);

export default ChangelogEntryPage;

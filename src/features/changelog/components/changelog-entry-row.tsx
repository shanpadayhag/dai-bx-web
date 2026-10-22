import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ChangelogEntry from '@/features/changelog/entities/changelog-entry';
import ChangelogDate from '@/features/changelog/components/changelog-date';
import ReleaseArt from '@/features/changelog/components/release-art';

type ChangelogEntryRowProps = {
  changelogEntry: ChangelogEntry;
  isFeatured: boolean;
};

const ChangelogEntryRow = ({ changelogEntry, isFeatured }: ChangelogEntryRowProps) => (
  <article className="grid gap-4 border-t border-border py-10 md:grid-cols-[200px_1fr] md:gap-10">
    <div className="grid content-start gap-2 md:sticky md:top-24 md:self-start">
      <p className="text-sm text-muted-foreground">
        <ChangelogDate date={changelogEntry.date} />
      </p>
      <span className="inline-flex h-6 items-center justify-self-start rounded-md bg-primary-soft px-2 font-mono text-xs font-medium text-primary-soft-foreground">
        {changelogEntry.version}
      </span>
    </div>
    <div className="grid content-start gap-4">
      {isFeatured ? (
        <Link href={`/changelog/${changelogEntry.slug}`} tabIndex={-1}>
          <ReleaseArt version={changelogEntry.version} />
        </Link>
      ) : null}
      <h2 className="text-2xl leading-tight font-medium tracking-[-0.025em] text-foreground">
        <Link
          href={`/changelog/${changelogEntry.slug}`}
          className="transition-colors duration-150 hover:text-primary"
        >
          {changelogEntry.title}
        </Link>
      </h2>
      <p className="max-w-[64ch] text-[15px] leading-relaxed text-muted-foreground">
        {changelogEntry.summary}
      </p>
      <Link
        href={`/changelog/${changelogEntry.slug}`}
        className="group inline-flex items-center gap-1 justify-self-start text-sm font-medium text-primary"
      >
        Read the release
        <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
      </Link>
    </div>
  </article>
);

export default ChangelogEntryRow;

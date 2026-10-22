import ChangelogEntry from '@/features/changelog/entities/changelog-entry';
import ChangelogEntryRow from '@/features/changelog/components/changelog-entry-row';

type ChangelogPageProps = {
  changelogEntries: ChangelogEntry[];
};

const ChangelogPage = ({ changelogEntries }: ChangelogPageProps) => (
  <div className="mx-auto max-w-5xl px-4 pt-20 pb-24 sm:pt-28">
    <header className="grid gap-4 pb-14">
      <h1 className="text-5xl leading-none font-medium tracking-[-0.04em] text-foreground sm:text-6xl">
        Changelog
      </h1>
      <p className="max-w-[52ch] text-[17px] text-muted-foreground">
        Every DaiBX release, newest first. What changed, and why it’s better.
      </p>
    </header>
    <div>
      {changelogEntries.map((changelogEntry, entryIndex) => (
        <ChangelogEntryRow
          key={changelogEntry.slug}
          changelogEntry={changelogEntry}
          isFeatured={entryIndex === 0}
        />
      ))}
    </div>
  </div>
);

export default ChangelogPage;

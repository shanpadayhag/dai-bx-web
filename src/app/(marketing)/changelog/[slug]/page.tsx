import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import contentChangelogEntrySource from '@/features/changelog/data_sources/content/changelog-entry-source';
import ChangelogEntryPage from '@/features/changelog/pages/changelog-entry-page';

type ChangelogEntryRouteProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export const generateStaticParams = async () =>
  (await contentChangelogEntrySource.findAll()).map((changelogEntry) => ({
    slug: changelogEntry.slug,
  }));

export const generateMetadata = async ({ params }: ChangelogEntryRouteProps): Promise<Metadata> => {
  const { slug } = await params;
  const compiledEntry = await contentChangelogEntrySource.findBySlug(slug);
  return compiledEntry
    ? {
        title: compiledEntry.changelogEntry.title,
        description: compiledEntry.changelogEntry.summary,
      }
    : {};
};

const ChangelogEntryRoute = async ({ params }: ChangelogEntryRouteProps) => {
  const { slug } = await params;
  const [compiledEntry, changelogEntries] = await Promise.all([
    contentChangelogEntrySource.findBySlug(slug),
    contentChangelogEntrySource.findAll(),
  ]);
  if (!compiledEntry) {
    notFound();
  }
  const entryIndex = changelogEntries.findIndex((changelogEntry) => changelogEntry.slug === slug);

  return (
    <ChangelogEntryPage
      changelogEntry={compiledEntry.changelogEntry}
      Content={compiledEntry.Content}
      newerEntry={changelogEntries[entryIndex - 1] ?? null}
      olderEntry={changelogEntries[entryIndex + 1] ?? null}
    />
  );
};

export default ChangelogEntryRoute;

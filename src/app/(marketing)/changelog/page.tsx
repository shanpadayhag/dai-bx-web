import type { Metadata } from 'next';
import contentChangelogEntrySource from '@/features/changelog/data_sources/content/changelog-entry-source';
import ChangelogPage from '@/features/changelog/pages/changelog-page';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Every DaiBX release, newest first.',
};

const ChangelogRoute = async () => (
  <ChangelogPage changelogEntries={await contentChangelogEntrySource.findAll()} />
);

export default ChangelogRoute;

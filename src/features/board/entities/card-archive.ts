import { formatInZone } from '@/core/zoned-time';

type ArchiveHow = 'idle' | 'byHand';

type CardArchive = {
  archivedAt: Date;
  how: ArchiveHow;
};

type ArchivedCard = CardArchive & {
  id: string;
  title: string;
  fromListName: string | null;
};

const archiveHowLabels: Record<ArchiveHow, string> = {
  idle: 'by idle',
  byHand: 'by hand',
};

const formatArchiveDay = (archivedAt: Date, timeZone: string): string =>
  formatInZone(archivedAt, timeZone, { day: 'numeric', month: 'short' });

const describeCardArchive = (cardArchive: CardArchive, timeZone: string): string =>
  `Archived on ${formatArchiveDay(cardArchive.archivedAt, timeZone)}, ${archiveHowLabels[cardArchive.how]}`;

export type { ArchivedCard, ArchiveHow };
export { archiveHowLabels, describeCardArchive, formatArchiveDay };
export default CardArchive;

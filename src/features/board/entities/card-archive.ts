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

type CardArchiveRecord = {
  at: string;
  how: ArchiveHow;
};

type ArchivedCardRecord = Omit<ArchivedCard, 'archivedAt'> & { archivedAt: string };

type ArchivedCardsRecord = {
  cards: ArchivedCardRecord[];
  hasMore: boolean;
};

type ArchivedCardsPage = {
  cards: readonly ArchivedCard[];
  hasOlderCards: boolean;
};

const cardArchiveFromRecord = (cardArchiveRecord: CardArchiveRecord): CardArchive => ({
  archivedAt: new Date(cardArchiveRecord.at),
  how: cardArchiveRecord.how,
});

const archivedCardFromRecord = (archivedCardRecord: ArchivedCardRecord): ArchivedCard => ({
  ...archivedCardRecord,
  archivedAt: new Date(archivedCardRecord.archivedAt),
});

const archiveHowLabels: Record<ArchiveHow, string> = {
  idle: 'by idle',
  byHand: 'by hand',
};

const formatArchiveDay = (archivedAt: Date, timeZone: string): string =>
  formatInZone(archivedAt, timeZone, { day: 'numeric', month: 'short' });

const describeCardArchive = (cardArchive: CardArchive, timeZone: string): string =>
  `Archived on ${formatArchiveDay(cardArchive.archivedAt, timeZone)}, ${archiveHowLabels[cardArchive.how]}`;

export type {
  ArchivedCard,
  ArchivedCardRecord,
  ArchivedCardsPage,
  ArchivedCardsRecord,
  ArchiveHow,
  CardArchiveRecord,
};
export {
  archivedCardFromRecord,
  archiveHowLabels,
  cardArchiveFromRecord,
  describeCardArchive,
  formatArchiveDay,
};
export default CardArchive;

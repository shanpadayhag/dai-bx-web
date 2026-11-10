import type BoardList from '@/features/board/entities/board-list';
import type { ArchivedCard } from '@/features/board/entities/card-archive';
import type CardHistoryPage from '@/features/board/entities/card-history-page';
import type CardTriggers from '@/features/board/entities/card-triggers';

const ARCHIVE_AFTER_HINT = 'Use days, weeks or months, like 3d, 2w or 1m';

const ARCHIVE_AFTER_PART_PATTERN = /^(\d+)(mo|m|w|d)$/;

type ArchiveAfterTidying = { archiveAfter: string | null } | { hint: string };

const hoursAgo = (now: Date, hourCount: number): Date =>
  new Date(now.getTime() - hourCount * 3_600_000);

const tidyArchiveAfterText = (enteredText: string): ArchiveAfterTidying => {
  const trimmedText = enteredText.trim().toLowerCase();
  if (trimmedText === '') return { archiveAfter: null };
  const amountsByUnit = new Map<string, number>();
  for (const part of trimmedText.split(/\s+/)) {
    const partMatch = ARCHIVE_AFTER_PART_PATTERN.exec(part);
    const unit = partMatch?.[2] === 'mo' ? 'm' : partMatch?.[2];
    const amount = Number(partMatch?.[1]);
    if (unit === undefined || amount < 1 || amountsByUnit.has(unit))
      return { hint: ARCHIVE_AFTER_HINT };
    amountsByUnit.set(unit, amount);
  }
  const monthCount = amountsByUnit.get('m') ?? 0;
  const dayCount = (amountsByUnit.get('w') ?? 0) * 7 + (amountsByUnit.get('d') ?? 0);
  const isOverAYear = monthCount > 12 || (monthCount === 12 && dayCount > 0) || dayCount > 365;
  if (isOverAYear) return { hint: ARCHIVE_AFTER_HINT };
  const tidiedParts = [
    monthCount > 0 ? `${monthCount}m` : '',
    dayCount >= 7 ? `${Math.floor(dayCount / 7)}w` : '',
    dayCount % 7 > 0 ? `${dayCount % 7}d` : '',
  ];
  return { archiveAfter: tidiedParts.filter((tidiedPart) => tidiedPart !== '').join(' ') };
};

const sampleCardWorkflowSource = {
  findTriggers(lists: readonly BoardList[]): CardTriggers {
    const startedList = lists[1] ?? lists[0];
    if (startedList === undefined) return { started: null, finished: null };
    return {
      started: { listId: startedList.id, listName: startedList.name },
      finished: { listId: null, listName: null },
    };
  },

  findHistory(lists: readonly BoardList[], now: Date): CardHistoryPage {
    const firstListName = lists[0]?.name ?? 'Backlog';
    const middleListName = lists[1]?.name ?? 'Doing';
    const lastListName = lists.at(-1)?.name ?? 'Done';
    return {
      moves: [
        {
          id: 'sample-move-1',
          movedAt: hoursAgo(now, 2),
          fromListName: middleListName,
          toListName: lastListName,
          reason: 'finished',
          taskTitle: 'Send the draft for review',
        },
        {
          id: 'sample-move-2',
          movedAt: hoursAgo(now, 26),
          fromListName: firstListName,
          toListName: middleListName,
          reason: 'started',
          taskTitle: 'Outline the chapter',
        },
        {
          id: 'sample-move-3',
          movedAt: hoursAgo(now, 50),
          fromListName: null,
          toListName: firstListName,
          reason: 'restored',
          taskTitle: null,
        },
        {
          id: 'sample-move-4',
          movedAt: hoursAgo(now, 220),
          fromListName: lastListName,
          toListName: null,
          reason: 'archivedIdle',
          taskTitle: null,
        },
        {
          id: 'sample-move-5',
          movedAt: hoursAgo(now, 400),
          fromListName: middleListName,
          toListName: lastListName,
          reason: 'byHand',
          taskTitle: null,
        },
        {
          id: 'sample-move-6',
          movedAt: hoursAgo(now, 430),
          fromListName: firstListName,
          toListName: middleListName,
          reason: 'schedule',
          taskTitle: null,
        },
        {
          id: 'sample-move-7',
          movedAt: hoursAgo(now, 460),
          fromListName: lastListName,
          toListName: firstListName,
          reason: 'started',
          taskTitle: null,
        },
      ],
      hasOlderMoves: true,
      isLoading: false,
    };
  },

  findArchivedCards(lists: readonly BoardList[], now: Date): ArchivedCard[] {
    const lastListName = lists.at(-1)?.name ?? 'Done';
    return [
      {
        id: 'sample-archived-1',
        title: 'Renew the domain',
        fromListName: lastListName,
        archivedAt: hoursAgo(now, 5),
        how: 'idle',
      },
      {
        id: 'sample-archived-2',
        title: 'Old onboarding checklist that nobody follows any more',
        fromListName: lists[0]?.name ?? 'Backlog',
        archivedAt: hoursAgo(now, 80),
        how: 'byHand',
      },
      {
        id: 'sample-archived-3',
        title: 'Book the dentist',
        fromListName: null,
        archivedAt: hoursAgo(now, 600),
        how: 'idle',
      },
    ];
  },

  findArchiveAfterByListId(lists: readonly BoardList[]): Record<string, string> {
    const lastList = lists.at(-1);
    return lastList === undefined || lists.length < 2 ? {} : { [lastList.id]: '1w' };
  },

  tidyArchiveAfterText,
};

export type { ArchiveAfterTidying };
export default sampleCardWorkflowSource;

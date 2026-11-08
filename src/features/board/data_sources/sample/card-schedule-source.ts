import type { Category } from '@/core/category';
import type BoardList from '@/features/board/entities/board-list';
import type CardSchedule from '@/features/board/entities/card-schedule';
import type { ScheduledCardMove } from '@/features/board/entities/card-schedule';

const SAMPLE_CATEGORIES: readonly Category[] = [
  { id: 'sample-deep-work', name: 'Deep work', color: '#4f46e5' },
  { id: 'sample-admin', name: 'Admin', color: '#d97706' },
  { id: 'sample-health', name: 'Health', color: '#059669' },
];

const nextWeekdayAt = (now: Date, weekday: number, hours: number, minutes: number): Date => {
  const daysAhead = (weekday - now.getDay() + 7) % 7 || 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead, hours, minutes);
};

const daysAgoAt = (now: Date, daysAgo: number, hours: number, minutes: number): Date =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hours, minutes);

const sampleCardScheduleSource = {
  categories: SAMPLE_CATEGORIES,

  findSchedules(lists: readonly BoardList[], now: Date, timeZone: string): CardSchedule[] {
    const firstList = lists[0];
    const secondList = lists[1] ?? firstList;
    if (firstList === undefined || secondList === undefined) return [];
    const nextMonday = nextWeekdayAt(now, 1, 18, 0);
    return [
      {
        id: 'sample-weekly-review',
        kind: 'repeating',
        targetListId: firstList.id,
        targetListName: firstList.name,
        firstAt: daysAgoAt(now, 28, 18, 0),
        repeatRule: { frequency: 'weekly', interval: 1, weekdays: ['mon'], ends: { never: true } },
        timeZone,
        calendarBlock: { lengthMinutes: 60, categoryId: 'sample-deep-work' },
        nextRunAt: nextMonday,
        isPaused: false,
        runs: [
          {
            id: 'sample-run-1',
            ranAt: daysAgoAt(now, 7, 18, 0),
            timing: 'onTime',
            movedToListName: firstList.name,
            trackedMinutes: 55,
          },
          {
            id: 'sample-run-2',
            ranAt: daysAgoAt(now, 14, 18, 4),
            timing: 'late',
            movedToListName: firstList.name,
            trackedMinutes: 0,
          },
          {
            id: 'sample-run-3',
            ranAt: daysAgoAt(now, 16, 9, 12),
            timing: 'byHand',
            movedToListName: firstList.name,
            trackedMinutes: 80,
          },
        ],
      },
      {
        id: 'sample-start-invoice',
        kind: 'once',
        targetListId: secondList.id,
        targetListName: secondList.name,
        firstAt: daysAgoAt(now, 3, 9, 30),
        repeatRule: null,
        timeZone,
        calendarBlock: null,
        nextRunAt: null,
        isPaused: false,
        runs: [
          {
            id: 'sample-run-4',
            ranAt: daysAgoAt(now, 3, 9, 30),
            timing: 'onTime',
            movedToListName: secondList.name,
            trackedMinutes: 25,
          },
        ],
      },
      {
        id: 'sample-monthly-cleanup',
        kind: 'repeating',
        targetListId: null,
        targetListName: null,
        firstAt: daysAgoAt(now, 40, 8, 0),
        repeatRule: {
          frequency: 'monthly',
          interval: 1,
          monthly: { week: 1, weekday: 'sat' },
          ends: { after: 12 },
        },
        timeZone: 'Europe/London',
        calendarBlock: null,
        nextRunAt: null,
        isPaused: true,
        runs: [],
      },
    ];
  },

  findNextMoves(lists: readonly BoardList[], now: Date): ScheduledCardMove[] {
    const firstList = lists[0];
    const firstCard = lists.find((boardList) => boardList.cards.length > 0)?.cards[0];
    if (firstList === undefined || firstCard === undefined) return [];
    return [
      { cardId: firstCard.id, targetListName: firstList.name, at: nextWeekdayAt(now, 1, 18, 0) },
    ];
  },
};

export default sampleCardScheduleSource;

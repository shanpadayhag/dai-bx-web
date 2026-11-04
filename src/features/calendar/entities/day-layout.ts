import type CalendarEvent from '@/features/calendar/entities/calendar-event';

const MINUTES_PER_DAY = 24 * 60;

type EventPiece = {
  event: CalendarEvent;
  dayStart: Date;
  startMinute: number;
  endMinute: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

type DayLayoutEntry =
  | { kind: 'event'; piece: EventPiece; cascadeLevel: 0 | 1 }
  | { kind: 'stack'; id: string; pieces: EventPiece[]; startMinute: number; endMinute: number };

const startOfLocalDay = (moment: Date): Date =>
  new Date(moment.getFullYear(), moment.getMonth(), moment.getDate());

const nextLocalDay = (dayStart: Date): Date =>
  new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() + 1);

const wallClockMinute = (moment: Date): number => moment.getHours() * 60 + moment.getMinutes();

const splitAtMidnight = (calendarEvent: CalendarEvent, now: Date): EventPiece[] => {
  const eventEnd = calendarEvent.endsAt ?? now;
  const eventPieces: EventPiece[] = [];
  let dayStart = startOfLocalDay(calendarEvent.startsAt);
  while (dayStart < eventEnd) {
    const dayEnd = nextLocalDay(dayStart);
    const pieceStart = calendarEvent.startsAt > dayStart ? calendarEvent.startsAt : dayStart;
    const reachesDayEnd = eventEnd >= dayEnd;
    eventPieces.push({
      event: calendarEvent,
      dayStart,
      startMinute: pieceStart === dayStart ? 0 : wallClockMinute(pieceStart),
      endMinute: reachesDayEnd ? MINUTES_PER_DAY : wallClockMinute(eventEnd),
      continuesBefore: pieceStart === dayStart && calendarEvent.startsAt < dayStart,
      continuesAfter: eventEnd > dayEnd,
    });
    dayStart = dayEnd;
  }
  return eventPieces;
};

const comparePieces = (firstPiece: EventPiece, secondPiece: EventPiece): number =>
  firstPiece.startMinute - secondPiece.startMinute || secondPiece.endMinute - firstPiece.endMinute;

const layoutCluster = (clusterPieces: EventPiece[]): DayLayoutEntry[] => {
  const [firstPiece, secondPiece] = clusterPieces;
  if (firstPiece === undefined) return [];
  if (clusterPieces.length >= 3) {
    return [
      {
        kind: 'stack',
        id: `${firstPiece.event.id}-stack`,
        pieces: clusterPieces,
        startMinute: firstPiece.startMinute,
        endMinute: Math.max(...clusterPieces.map((piece) => piece.endMinute)),
      },
    ];
  }
  const firstEntry: DayLayoutEntry = { kind: 'event', piece: firstPiece, cascadeLevel: 0 };
  return secondPiece === undefined
    ? [firstEntry]
    : [firstEntry, { kind: 'event', piece: secondPiece, cascadeLevel: 1 }];
};

const layoutDay = (dayPieces: readonly EventPiece[]): DayLayoutEntry[] => {
  const sortedPieces = [...dayPieces].sort(comparePieces);
  const dayEntries: DayLayoutEntry[] = [];
  let clusterPieces: EventPiece[] = [];
  let clusterEndMinute = -1;
  for (const piece of sortedPieces) {
    if (piece.startMinute >= clusterEndMinute) {
      dayEntries.push(...layoutCluster(clusterPieces));
      clusterPieces = [];
    }
    clusterPieces.push(piece);
    clusterEndMinute = Math.max(clusterEndMinute, piece.endMinute);
  }
  dayEntries.push(...layoutCluster(clusterPieces));
  return dayEntries;
};

export type { DayLayoutEntry, EventPiece };
export { MINUTES_PER_DAY, layoutDay, splitAtMidnight, startOfLocalDay };

import { describe, expect, test } from 'vitest';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';
import {
  layoutDay,
  splitAtMidnight,
  type EventPiece,
} from '@/features/calendar/entities/day-layout';

const localMoment = (day: number, hour: number, minute = 0) =>
  new Date(2026, 10, day, hour, minute);

const buildEvent = (
  eventId: string,
  startsAt: Date,
  endsAt: Date | null,
  kind: CalendarEvent['kind'] = 'tracked',
): CalendarEvent => ({
  id: eventId,
  kind,
  title: eventId,
  category: null,
  startsAt,
  endsAt,
  finishedAt: endsAt,
  source: null,
});

const buildPiece = (eventId: string, startMinute: number, endMinute: number): EventPiece => ({
  event: buildEvent(eventId, localMoment(4, 0), localMoment(4, 1)),
  dayStart: localMoment(4, 0),
  startMinute,
  endMinute,
  continuesBefore: false,
  continuesAfter: false,
});

describe('splitAtMidnight', () => {
  const now = localMoment(4, 18, 2);

  test('an event inside one day stays one piece in wall-clock minutes', () => {
    const pieces = splitAtMidnight(
      buildEvent('gym', localMoment(4, 16), localMoment(4, 17, 30)),
      now,
    );

    expect(pieces).toHaveLength(1);
    expect(pieces[0]).toMatchObject({
      dayStart: localMoment(4, 0),
      startMinute: 16 * 60,
      endMinute: 17 * 60 + 30,
      continuesBefore: false,
      continuesAfter: false,
    });
  });

  test('an event lasting several days fills every day between its start and end', () => {
    const pieces = splitAtMidnight(
      buildEvent('trip', localMoment(4, 9), localMoment(6, 15), 'planned'),
      now,
    );

    expect(pieces.map(({ startMinute, endMinute }) => [startMinute, endMinute])).toEqual([
      [9 * 60, 24 * 60],
      [0, 24 * 60],
      [0, 15 * 60],
    ]);
    expect(pieces[1]).toMatchObject({
      dayStart: localMoment(5, 0),
      continuesBefore: true,
      continuesAfter: true,
    });
  });

  test('an event crossing midnight splits into two pieces at midnight', () => {
    const pieces = splitAtMidnight(
      buildEvent('late', localMoment(4, 23, 30), localMoment(5, 0, 45)),
      now,
    );

    expect(pieces).toHaveLength(2);
    expect(pieces[0]).toMatchObject({
      dayStart: localMoment(4, 0),
      startMinute: 23 * 60 + 30,
      endMinute: 24 * 60,
      continuesAfter: true,
    });
    expect(pieces[1]).toMatchObject({
      dayStart: localMoment(5, 0),
      startMinute: 0,
      endMinute: 45,
      continuesBefore: true,
    });
  });

  test('a night the clocks go back splits at local midnight with wall-clock minutes', () => {
    const pieces = splitAtMidnight(
      buildEvent('clock change', new Date(2026, 9, 31, 22), new Date(2026, 10, 1, 3)),
      now,
    );

    expect(pieces).toHaveLength(2);
    expect(pieces[0]).toMatchObject({
      dayStart: new Date(2026, 9, 31),
      startMinute: 22 * 60,
      endMinute: 24 * 60,
    });
    expect(pieces[1]).toMatchObject({
      dayStart: new Date(2026, 10, 1),
      startMinute: 0,
      endMinute: 3 * 60,
    });
  });

  test('an event ending exactly at midnight stays in its own day', () => {
    const pieces = splitAtMidnight(
      buildEvent('evening', localMoment(4, 22), localMoment(5, 0)),
      now,
    );

    expect(pieces).toHaveLength(1);
    expect(pieces[0]).toMatchObject({ endMinute: 24 * 60, continuesAfter: false });
  });

  test('a running event ends at now', () => {
    const pieces = splitAtMidnight(buildEvent('running', localMoment(4, 16, 20), null), now);

    expect(pieces[0]).toMatchObject({ startMinute: 16 * 60 + 20, endMinute: 18 * 60 + 2 });
  });
});

describe('layoutDay', () => {
  test('events that do not overlap each take the full width', () => {
    const entries = layoutDay([buildPiece('a', 60, 120), buildPiece('b', 120, 180)]);

    expect(entries).toEqual([
      { kind: 'event', piece: expect.objectContaining({ startMinute: 60 }), cascadeLevel: 0 },
      { kind: 'event', piece: expect.objectContaining({ startMinute: 120 }), cascadeLevel: 0 },
    ]);
  });

  test('two overlapping events cascade with the later start on top', () => {
    const entries = layoutDay([buildPiece('later', 90, 150), buildPiece('earlier', 60, 120)]);

    expect(
      entries.map((entry) => entry.kind === 'event' && [entry.piece.event.id, entry.cascadeLevel]),
    ).toEqual([
      ['earlier', 0],
      ['later', 1],
    ]);
  });

  test('two events starting together put the longer one underneath', () => {
    const entries = layoutDay([buildPiece('short', 60, 90), buildPiece('long', 60, 180)]);

    expect(
      entries.map((entry) => entry.kind === 'event' && [entry.piece.event.id, entry.cascadeLevel]),
    ).toEqual([
      ['long', 0],
      ['short', 1],
    ]);
  });

  test('three or more overlapping events become one stack block spanning all of them', () => {
    const entries = layoutDay([
      buildPiece('changelog', 960, 1080),
      buildPiece('gym', 990, 1050),
      buildPiece('chinese', 1005, 1140),
      buildPiece('review', 1200, 1260),
    ]);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ kind: 'stack', startMinute: 960, endMinute: 1140 });
    expect(
      entries[0]?.kind === 'stack' && entries[0].pieces.map((piece) => piece.event.id),
    ).toEqual(['changelog', 'gym', 'chinese']);
    expect(entries[1]).toMatchObject({ kind: 'event', cascadeLevel: 0 });
  });

  test('a chain where the first and last never meet still counts as one pile', () => {
    const entries = layoutDay([
      buildPiece('a', 0, 60),
      buildPiece('b', 50, 120),
      buildPiece('c', 110, 180),
    ]);

    expect(entries).toEqual([
      expect.objectContaining({ kind: 'stack', startMinute: 0, endMinute: 180 }),
    ]);
  });

  test('a stack has an id that stays the same for the same first event', () => {
    const pieces = [buildPiece('a', 0, 60), buildPiece('b', 10, 60), buildPiece('c', 20, 60)];

    expect(layoutDay(pieces)[0]).toMatchObject({ id: 'a-stack' });
  });
});

import { describe, expect, test } from 'vitest';
import { nextMoveFromRecord, nextMoveLabel } from '@/features/board/entities/next-move';

const now = new Date('2026-11-08T12:00:00Z');

describe('nextMoveLabel', () => {
  test('names the weekday and time in the zone, then the column', () => {
    expect(
      nextMoveLabel(
        { at: new Date('2026-11-09T10:00:00Z'), listName: 'To Do' },
        now,
        'Asia/Manila',
      ),
    ).toBe('Mon 18:00 → To Do');
  });

  test('the same moment reads differently in another zone', () => {
    expect(
      nextMoveLabel(
        { at: new Date('2026-11-09T10:00:00Z'), listName: 'To Do' },
        now,
        'America/Los_Angeles',
      ),
    ).toBe('Mon 02:00 → To Do');
  });

  test('a move a week or more away names its date instead', () => {
    expect(
      nextMoveLabel({ at: new Date('2026-11-30T10:00:00Z'), listName: 'Done' }, now, 'Asia/Manila'),
    ).toBe('30 Nov 18:00 → Done');
  });
});

describe('nextMoveFromRecord', () => {
  test('reads the time as a date', () => {
    expect(nextMoveFromRecord({ at: '2026-11-09T10:00:00.000Z', listName: 'To Do' })).toEqual({
      at: new Date('2026-11-09T10:00:00.000Z'),
      listName: 'To Do',
    });
  });
});

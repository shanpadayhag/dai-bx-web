import { describe, expect, test } from 'vitest';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';
import {
  eventDurationMinutes,
  formatDurationMinutes,
  formatEventTimeRange,
} from '@/features/calendar/entities/event-time';

const buildEvent = (startsAt: Date, endsAt: Date | null): CalendarEvent => ({
  id: 'event',
  kind: 'tracked',
  title: 'Event',
  category: null,
  startsAt,
  endsAt,
  finishedAt: endsAt,
  source: null,
});

describe('formatEventTimeRange', () => {
  test('a finished event shows both clock times', () => {
    expect(
      formatEventTimeRange(
        buildEvent(new Date(2026, 10, 5, 9, 5), new Date(2026, 10, 5, 17, 30)),
        'America/Los_Angeles',
      ),
    ).toBe('09:05 – 17:30');
  });

  test('a running event ends at now', () => {
    expect(
      formatEventTimeRange(buildEvent(new Date(2026, 10, 5, 16, 20), null), 'America/Los_Angeles'),
    ).toBe('16:20 – now');
  });

  test('shows the clock of the calendar zone', () => {
    expect(
      formatEventTimeRange(
        buildEvent(new Date('2026-11-09T10:00:00Z'), new Date('2026-11-09T11:30:00Z')),
        'Asia/Manila',
      ),
    ).toBe('18:00 – 19:30');
  });
});

describe('formatDurationMinutes', () => {
  test.each([
    [50, '50 min'],
    [60, '1 h'],
    [102, '1 h 42 min'],
  ])('%i minutes reads as %s', (durationMinutes, expectedLabel) => {
    expect(formatDurationMinutes(durationMinutes)).toBe(expectedLabel);
  });
});

describe('eventDurationMinutes', () => {
  test('a running event counts up to now', () => {
    const runningEvent = buildEvent(new Date(2026, 10, 5, 16, 20), null);
    expect(eventDurationMinutes(runningEvent, new Date(2026, 10, 5, 18, 2))).toBe(102);
  });
});

import { expect, test } from 'vitest';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';
import { agendaRowsFrom } from '@/features/today/entities/agenda-row';

const eventOf = (overrides: Partial<CalendarEvent>): CalendarEvent => ({
  id: 'event',
  kind: 'planned',
  title: 'Block',
  category: null,
  startsAt: new Date('2026-11-21T10:00:00.000Z'),
  endsAt: new Date('2026-11-21T11:00:00.000Z'),
  finishedAt: null,
  source: null,
  ...overrides,
});

test('orders rows by start and marks their kind and whether they are past', () => {
  const now = new Date('2026-11-21T12:00:00.000Z');

  const agendaRows = agendaRowsFrom(
    [
      eventOf({
        id: 'later',
        startsAt: new Date('2026-11-21T15:00:00.000Z'),
        endsAt: new Date('2026-11-21T16:00:00.000Z'),
      }),
      eventOf({
        id: 'running',
        kind: 'tracked',
        startsAt: new Date('2026-11-21T11:30:00.000Z'),
        endsAt: null,
      }),
      eventOf({ id: 'tracked', kind: 'tracked' }),
    ],
    now,
  );

  expect(agendaRows.map((agendaRow) => [agendaRow.id, agendaRow.kind, agendaRow.isPast])).toEqual([
    ['tracked', 'tracked', true],
    ['running', 'running', false],
    ['later', 'planned', false],
  ]);
});

test('keeps the linked task and whether it is done', () => {
  const [agendaRow] = agendaRowsFrom(
    [
      eventOf({
        linkedTask: { id: 'task-1', name: 'Write', groupId: 'g', groupName: 'DaiBX', isDone: true },
      }),
    ],
    new Date('2026-11-21T09:00:00.000Z'),
  );

  expect(agendaRow?.linkedTask).toEqual({ id: 'task-1', isDone: true });
});

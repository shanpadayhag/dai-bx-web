import { describe, expect, test } from 'vitest';
import type ActivityEntryRecord from '@/features/activity/entities/activity-entry-record';
import {
  activityEntryFromRecord,
  activityLink,
  describeActivity,
  groupActivityByDay,
} from '@/features/activity/entities/activity-entry';

const ZONE = 'Asia/Manila';

const entryOf = (
  kindAndDetails: Pick<ActivityEntryRecord, 'kind' | 'details'>,
  overrides: Partial<ActivityEntryRecord> = {},
) =>
  activityEntryFromRecord({
    id: 'entry-1',
    occurredAt: '2026-11-21T08:00:00.000Z',
    title: 'Write the changelog',
    contextName: 'DaiBX',
    taskId: 'task-1',
    cardId: null,
    boardId: null,
    ...kindAndDetails,
    ...overrides,
  } as ActivityEntryRecord);

describe('describeActivity', () => {
  test('describes starts and check-ins with the group or board', () => {
    expect(
      describeActivity(
        entryOf({ kind: 'started', details: { subject: 'task', eventId: 'e' } }),
        ZONE,
      ),
    ).toEqual({ action: 'Started', title: 'Write the changelog', detail: 'DaiBX' });
    expect(
      describeActivity(
        entryOf({ kind: 'checked_in', details: { subject: 'card', eventId: 'e' } }),
        ZONE,
      ),
    ).toEqual({ action: 'Checked in on', title: 'Write the changelog', detail: 'DaiBX' });
  });

  test('describes a finish with its tracked time, mark done and an early end', () => {
    const finished = describeActivity(
      entryOf({
        kind: 'finished',
        details: {
          subject: 'task',
          eventId: 'e',
          trackedMinutes: 80,
          markedDone: true,
          endedAtMillis: Date.parse('2026-11-21T09:20:00.000Z'),
        },
      }),
      ZONE,
    );
    const quickFinish = describeActivity(
      entryOf({
        kind: 'finished',
        details: { subject: 'task', eventId: 'e', trackedMinutes: 0, markedDone: false },
      }),
      ZONE,
    );

    expect(finished.detail).toBe('1h 20m tracked · marked done · ended 17:20');
    expect(quickFinish.detail).toBe('under a minute tracked');
  });

  test('describes ticks and reopens, noting a subtask', () => {
    expect(
      describeActivity(entryOf({ kind: 'task_completed', details: { isSubtask: true } }), ZONE),
    ).toEqual({ action: 'Ticked', title: 'Write the changelog', detail: 'DaiBX · subtask' });
    expect(
      describeActivity(entryOf({ kind: 'task_reopened', details: { isSubtask: false } }), ZONE),
    ).toEqual({ action: 'Reopened', title: 'Write the changelog', detail: 'DaiBX' });
  });

  test('describes card moves by reason', () => {
    const moveDetail = (details: Extract<ActivityEntryRecord, { kind: 'card_moved' }>['details']) =>
      describeActivity(entryOf({ kind: 'card_moved', details }), ZONE).detail;

    expect(moveDetail({ fromListName: 'To Do', toListName: 'Doing', reason: 'by_hand' })).toBe(
      'To Do → Doing · by hand',
    );
    expect(
      moveDetail({
        fromListName: 'To Do',
        toListName: 'Doing',
        reason: 'started',
        taskTitle: 'Draft the intro',
      }),
    ).toBe('To Do → Doing · task started: Draft the intro');
    expect(moveDetail({ fromListName: 'Doing', toListName: null, reason: 'archived_idle' })).toBe(
      'Doing · archived (idle)',
    );
    expect(moveDetail({ fromListName: null, toListName: 'To Do', reason: 'restored' })).toBe(
      'To Do · restored',
    );
  });

  test('describes schedule runs that moved and ones that did not', () => {
    const runDetail = (
      details: Extract<ActivityEntryRecord, { kind: 'schedule_ran' }>['details'],
    ) => describeActivity(entryOf({ kind: 'schedule_ran', details }), ZONE).detail;

    expect(
      runDetail({ how: 'late', moved: true, fromListName: 'To Do', toListName: 'Doing' }),
    ).toBe('late · moved To Do → Doing');
    expect(
      runDetail({ how: 'on_time', moved: false, fromListName: 'Doing', toListName: 'Doing' }),
    ).toBe("on time · didn't move");
  });

  test('describes an accepted plan by its block count', () => {
    expect(
      describeActivity(
        entryOf({ kind: 'plan_accepted', details: { blockCount: 4 } }, { title: null }),
        ZONE,
      ),
    ).toEqual({ action: 'Accepted', title: 'a plan', detail: '4 blocks' });
    expect(
      describeActivity(
        entryOf({ kind: 'plan_accepted', details: { blockCount: 1 } }, { title: null }),
        ZONE,
      ).detail,
    ).toBe('1 block');
  });
});

test('links a card entry to its board and leaves others unlinked', () => {
  const started = { kind: 'started', details: { subject: 'card', eventId: 'e' } } as const;

  expect(activityLink(entryOf(started, { cardId: 'card-1', boardId: 'board-1' }))).toBe(
    '/board?board=board-1&card=card-1',
  );
  expect(activityLink(entryOf(started, { cardId: 'card-1', boardId: null }))).toBeNull();
  expect(activityLink(entryOf(started))).toBeNull();
});

test('groups entries by local day as Today, Yesterday, then the date', () => {
  const tick = { kind: 'task_completed', details: { isSubtask: false } } as const;
  const activityEntries = [
    entryOf(tick, { id: 'a', occurredAt: '2026-11-21T01:00:00.000Z' }),
    entryOf(tick, { id: 'b', occurredAt: '2026-11-20T17:00:00.000Z' }),
    entryOf(tick, { id: 'c', occurredAt: '2026-11-20T15:00:00.000Z' }),
    entryOf(tick, { id: 'd', occurredAt: '2026-11-19T03:00:00.000Z' }),
  ];

  const activityDays = groupActivityByDay(
    activityEntries,
    ZONE,
    new Date('2026-11-21T04:00:00.000Z'),
  );

  expect(
    activityDays.map((activityDay) => [
      activityDay.dayLabel,
      activityDay.entries.map((activityEntry) => activityEntry.id),
    ]),
  ).toEqual([
    ['Today', ['a', 'b']],
    ['Yesterday', ['c']],
    ['Thursday, November 19', ['d']],
  ]);
});

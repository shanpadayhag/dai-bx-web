import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import AppError from '@/core/app-error';
import saveCardSchedule, {
  readScheduleForm,
  type ScheduleFormInput,
} from '@/features/board/actions/save-card-schedule';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const now = new Date('2026-11-09T02:00:00Z');

const weeklyInput: ScheduleFormInput = {
  kind: 'repeating',
  targetListId: 'list-2',
  date: '2026-11-09',
  time: '18:00',
  timeZone: 'Asia/Manila',
  repeatRule: { frequency: 'weekly', interval: 1, weekdays: ['mon'], ends: { never: true } },
  calendarBlock: { lengthMinutes: 60, categoryId: 'category-1' },
};

const answeredSchedules = {
  schedules: [
    {
      id: 'schedule-1',
      kind: 'repeating',
      targetListId: 'list-2',
      targetListName: 'To Do',
      start: '2026-11-09T18:00',
      startsAt: '2026-11-09T10:00:00.000Z',
      timeZone: 'Asia/Manila',
      repeat: weeklyInput.repeatRule,
      block: { minutes: 60, categoryId: 'category-1' },
      paused: false,
      nextRunAt: '2026-11-09T10:00:00.000Z',
    },
  ],
};

test('a new schedule is sent in its own zone and comes back as schedules', async () => {
  let receivedBody: unknown;
  backendServer.use(
    http.post('/backend/cards/card-1/schedules', async ({ request }) => {
      receivedBody = await request.json();
      return HttpResponse.json(answeredSchedules, { status: 201 });
    }),
  );

  const savedSchedules = await saveCardSchedule({
    cardId: 'card-1',
    scheduleId: null,
    scheduleInput: weeklyInput,
    now,
  });

  expect(receivedBody).toEqual({
    kind: 'repeating',
    targetListId: 'list-2',
    start: '2026-11-09T18:00',
    inputZone: 'Asia/Manila',
    timeZone: 'Asia/Manila',
    repeat: weeklyInput.repeatRule,
    block: { minutes: 60, categoryId: 'category-1' },
  });
  expect(savedSchedules.map((schedule) => schedule.nextRunAt)).toEqual([
    new Date('2026-11-09T10:00:00.000Z'),
  ]);
});

test('an edit goes to the schedule and clears a block that was switched off', async () => {
  let receivedBody: unknown;
  backendServer.use(
    http.patch('/backend/schedules/schedule-1', async ({ request }) => {
      receivedBody = await request.json();
      return HttpResponse.json(answeredSchedules);
    }),
  );

  await saveCardSchedule({
    cardId: 'card-1',
    scheduleId: 'schedule-1',
    scheduleInput: { ...weeklyInput, calendarBlock: null },
    now,
  });

  expect(receivedBody).toMatchObject({ block: null });
});

test('refuses a missing column, a missing time and a past one-time move without a request', async () => {
  for (const [scheduleInput, expectedTitle] of [
    [{ ...weeklyInput, targetListId: '' }, 'Pick a column'],
    [{ ...weeklyInput, time: '' }, 'Pick a date and time'],
    [
      { ...weeklyInput, kind: 'once', repeatRule: null, calendarBlock: null, time: '09:00' },
      'Pick a later time',
    ],
  ] as const) {
    await expect(
      saveCardSchedule({ cardId: 'card-1', scheduleId: null, scheduleInput, now }),
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      saveCardSchedule({ cardId: 'card-1', scheduleId: null, scheduleInput, now }),
    ).rejects.toMatchObject({ title: expectedTitle });
  }
});

test('reads the form, taking the block only when it is switched on for a repeat', () => {
  const scheduleForm = new FormData();
  for (const [fieldName, fieldValue] of Object.entries({
    kind: 'repeating',
    targetListId: 'list-2',
    date: '2026-11-09',
    time: '18:00:00',
    timeZone: 'Asia/Manila',
    repeat: JSON.stringify(weeklyInput.repeatRule),
    blockMinutes: '60',
    'schedule-block-category': '',
  })) {
    scheduleForm.set(fieldName, fieldValue);
  }

  expect(readScheduleForm(scheduleForm, 'schedule-block-category')).toEqual({
    ...weeklyInput,
    calendarBlock: { lengthMinutes: 60, categoryId: null },
  });

  scheduleForm.set('kind', 'once');
  expect(readScheduleForm(scheduleForm, 'schedule-block-category')).toMatchObject({
    kind: 'once',
    repeatRule: null,
    calendarBlock: null,
  });
});

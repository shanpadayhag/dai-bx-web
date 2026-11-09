import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { Category } from '@/core/category';
import type { RepeatRule } from '@/core/repeat-rule';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import CalendarPage from '@/features/calendar/pages/calendar-page';
import type TimeTrackingSettings from '@/features/tracking/entities/time-tracking-settings';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const routerReplace = vi.hoisted(() => vi.fn());
const stableRouter = vi.hoisted(() => ({ push: vi.fn(), replace: routerReplace }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const backendServer = startBackendServer();

const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 10, day, hour, minute).toISOString();

const focusCategory: Category = { id: 'category-focus', name: 'Focus', color: '#5b7fa6' };

const timeTrackingSettings: TimeTrackingSettings = {
  checkInsEnabled: true,
  checkInIntervalMinutes: 30,
  firstCheckInMinutes: 30,
  workingHoursStart: '16:00',
  workingHoursEnd: '02:00',
  trackedCategoryId: null,
  calendarTimeZone: null,
};

const eventRecord = (
  id: string,
  title: string,
  startsAt: string,
  endsAt: string | null,
  overrides: Partial<CalendarEventRecord> = {},
): CalendarEventRecord => ({
  id,
  kind: 'planned',
  title,
  categoryId: null,
  startsAt,
  endsAt,
  finishedAt: null,
  lastAnsweredAt: null,
  timeZone: null,
  series: null,
  source: null,
  ...overrides,
});

const trackedOverrides = (finishedAt: string | null): Partial<CalendarEventRecord> => ({
  kind: 'tracked',
  finishedAt,
  source: { kind: 'task', id: 'task-1', groupId: 'group-1' },
});

let serverEvents: CalendarEventRecord[] = [];
let calendarZoneSetting: string | null = null;
let deletedRunStarts = new Set<string>();
let movedRunTimes = new Map<string, { startsAt: string; endsAt: string }>();
let receivedOccurrenceWrites: { method: string; originalStart: string; body: unknown }[] = [];
let receivedCreates: unknown[] = [];

const RUN_SERIES_ID = 'series-run';
const WEEKLY_TUESDAY: RepeatRule = {
  frequency: 'weekly',
  interval: 1,
  weekdays: ['tue'],
  ends: { never: true },
};

const runOccurrences = (from: Date, to: Date): CalendarEventRecord[] => {
  const runRecords: CalendarEventRecord[] = [];
  for (let dayStart = from; dayStart < to; dayStart = new Date(dayStart.getTime() + 86_400_000)) {
    if (dayStart.getDay() !== 2) continue;
    const originalStart = new Date(
      dayStart.getFullYear(),
      dayStart.getMonth(),
      dayStart.getDate(),
      7,
    ).toISOString();
    if (deletedRunStarts.has(originalStart)) continue;
    const runTimes = movedRunTimes.get(originalStart) ?? {
      startsAt: originalStart,
      endsAt: new Date(Date.parse(originalStart) + 3_600_000).toISOString(),
    };
    runRecords.push(
      eventRecord(
        `${RUN_SERIES_ID}:${originalStart}`,
        'Morning run',
        runTimes.startsAt,
        runTimes.endsAt,
        {
          timeZone: 'America/Los_Angeles',
          series: { id: RUN_SERIES_ID, originalStart, repeat: WEEKLY_TUESDAY },
        },
      ),
    );
  }
  return runRecords;
};
let receivedRanges: { start: string; days: string; timeZone: string }[] = [];

const startingEvents = (): CalendarEventRecord[] => [
  eventRecord('event-gym', 'Gym', at(5, 19), at(5, 20)),
  eventRecord(
    'event-changelog',
    'Write the changelog',
    at(5, 14),
    at(5, 15, 30),
    trackedOverrides(at(5, 15, 30)),
  ),
  eventRecord('event-read-a', 'Read chapter one', at(4, 10), at(4, 11)),
  eventRecord('event-read-b', 'Read chapter two', at(4, 10, 15), at(4, 11, 15)),
  eventRecord('event-read-c', 'Read chapter three', at(4, 10, 30), at(4, 11, 30)),
  eventRecord('event-late', 'Late study', at(3, 23), at(4, 1), trackedOverrides(at(4, 1))),
  eventRecord('event-running', 'Plan the release', at(5, 17), null, trackedOverrides(null)),
];

const overlapsRange = (calendarEvent: CalendarEventRecord, from: Date, to: Date) =>
  new Date(calendarEvent.startsAt) < to &&
  (calendarEvent.endsAt === null || new Date(calendarEvent.endsAt) > from);

const localDayAfter = (calendarDate: string, dayCount: number) => {
  const [year = 0, month = 1, day = 1] = calendarDate.split('-').map(Number);
  return new Date(year, month - 1, day + dayCount);
};

type WallClockWrite = { start?: string; end?: string };

const instantsOf = (wallClockWrite: WallClockWrite): Partial<CalendarEventRecord> => ({
  ...(wallClockWrite.start === undefined
    ? {}
    : { startsAt: new Date(wallClockWrite.start).toISOString() }),
  ...(wallClockWrite.end === undefined
    ? {}
    : { endsAt: new Date(wallClockWrite.end).toISOString() }),
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 5, 18, 2) });
  window.history.replaceState(null, '', '/calendar');
  window.localStorage.clear();
  routerReplace.mockClear();
  serverEvents = startingEvents();
  receivedRanges = [];
  calendarZoneSetting = null;
  deletedRunStarts = new Set();
  movedRunTimes = new Map();
  receivedOccurrenceWrites = [];
  receivedCreates = [];
  backendServer.use(
    http.get('/backend/categories', () => HttpResponse.json([focusCategory])),
    http.get('/backend/account/time-tracking', () =>
      HttpResponse.json({ ...timeTrackingSettings, calendarTimeZone: calendarZoneSetting }),
    ),
    http.get('/backend/calendar/events', ({ request }) => {
      const searchParams = new URL(request.url).searchParams;
      const start = searchParams.get('start') ?? '';
      const days = searchParams.get('days') ?? '';
      receivedRanges.push({ start, days, timeZone: searchParams.get('timeZone') ?? '' });
      const from = localDayAfter(start, 0);
      const to = localDayAfter(start, Number(days));
      const moveAt = new Date(2026, 10, 2, 18);
      return HttpResponse.json({
        events: [
          ...serverEvents.filter((calendarEvent) => overlapsRange(calendarEvent, from, to)),
          ...runOccurrences(from, to),
        ],
        moves:
          moveAt >= from && moveAt < to
            ? [
                {
                  scheduleId: 'schedule-1',
                  cardId: 'card-1',
                  cardTitle: 'Weekly review',
                  boardId: 'board-1',
                  listName: 'To Do',
                  at: moveAt.toISOString(),
                },
              ]
            : [],
      });
    }),
    http.post('/backend/calendar/events', async ({ request }) => {
      const newEventBody: unknown = await request.clone().json();
      receivedCreates.push(newEventBody);
      const newEvent = (await request.json()) as Pick<
        CalendarEventRecord,
        'title' | 'categoryId'
      > & {
        start: string;
        end: string;
        repeat?: RepeatRule;
      };
      const startsAt = new Date(newEvent.start).toISOString();
      const createdEvent = eventRecord(
        newEvent.repeat === undefined
          ? `event-${serverEvents.length + 1}`
          : `series-new:${startsAt}`,
        newEvent.title,
        startsAt,
        new Date(newEvent.end).toISOString(),
        {
          categoryId: newEvent.categoryId,
          ...(newEvent.repeat === undefined
            ? {}
            : { series: { id: 'series-new', originalStart: startsAt, repeat: newEvent.repeat } }),
        },
      );
      serverEvents.push(createdEvent);
      return HttpResponse.json(createdEvent, { status: 201 });
    }),
    http.patch('/backend/calendar/events/:eventId', async ({ params, request }) => {
      const { start, end, inputZone, ...eventChanges } = (await request.json()) as Partial<
        Pick<CalendarEventRecord, 'title' | 'categoryId'>
      > &
        WallClockWrite & { inputZone?: string };
      expect(inputZone === undefined || inputZone === 'America/Los_Angeles').toBe(true);
      serverEvents = serverEvents.map((calendarEvent) =>
        calendarEvent.id === params.eventId
          ? { ...calendarEvent, ...eventChanges, ...instantsOf({ start, end }) }
          : calendarEvent,
      );
      return HttpResponse.json(
        serverEvents.find((calendarEvent) => calendarEvent.id === params.eventId),
      );
    }),
    http.patch(
      '/backend/calendar/series/:seriesId/occurrences/:originalStart',
      async ({ params, request }) => {
        const originalStart = String(params.originalStart);
        const occurrenceBody = (await request.json()) as WallClockWrite & { scope: string };
        receivedOccurrenceWrites.push({ method: 'PATCH', originalStart, body: occurrenceBody });
        if (occurrenceBody.scope === 'this' && occurrenceBody.start !== undefined) {
          const movedInstants = instantsOf(occurrenceBody);
          movedRunTimes.set(originalStart, {
            startsAt: movedInstants.startsAt ?? originalStart,
            endsAt: movedInstants.endsAt ?? originalStart,
          });
        }
        return HttpResponse.json({});
      },
    ),
    http.delete(
      '/backend/calendar/series/:seriesId/occurrences/:originalStart',
      ({ params, request }) => {
        const originalStart = String(params.originalStart);
        const scope = new URL(request.url).searchParams.get('scope');
        receivedOccurrenceWrites.push({ method: 'DELETE', originalStart, body: { scope } });
        if (scope === 'this') deletedRunStarts.add(originalStart);
        return HttpResponse.json({ status: 'deleted' });
      },
    ),
    http.delete('/backend/calendar/events/:eventId', ({ params }) => {
      serverEvents = serverEvents.filter((calendarEvent) => calendarEvent.id !== params.eventId);
      return HttpResponse.json({ status: 'deleted' });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  toast.dismiss();
});

const renderCalendar = async () => {
  const user = userEvent.setup();
  renderWithToaster(<CalendarPage />);
  await screen.findByRole('heading', { level: 1 });
  return user;
};

const eventButton = (eventTitle: string) =>
  screen.getByRole('button', { name: new RegExp(`^${eventTitle} `) });

const setDateTime = (container: HTMLElement, fieldLabel: string, day: string, time: string) => {
  fireEvent.change(within(container).getByLabelText(fieldLabel), { target: { value: day } });
  fireEvent.change(within(container).getByLabelText(`${fieldLabel} time`), {
    target: { value: time },
  });
};

test("shows the week's events, with three overlapping ones as one stack", async () => {
  await renderCalendar();

  expect(screen.getByRole('heading', { level: 1, name: 'November 2 – 8' })).toBeInTheDocument();
  expect(receivedRanges).toEqual([
    { start: '2026-11-02', days: '7', timeZone: 'America/Los_Angeles' },
  ]);
  expect(eventButton('Gym')).toBeInTheDocument();
  expect(eventButton('Plan the release')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '3 events, 10:00 – 11:30' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Read chapter one / })).not.toBeInTheDocument();
  expect(screen.getByLabelText('Now, 18:02')).toBeInTheDocument();
});

test('an event across midnight shows on both days', async () => {
  await renderCalendar();

  expect(screen.getAllByRole('button', { name: /^Late study / })).toHaveLength(2);
});

test('the day view is remembered and steps one day at a time', async () => {
  const user = await renderCalendar();

  await user.click(screen.getByRole('radio', { name: 'Day' }));

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Thursday, November 5' }),
  ).toBeInTheDocument();
  expect(routerReplace).toHaveBeenLastCalledWith('/calendar?view=day&date=2026-11-05', {
    scroll: false,
  });
  expect(window.localStorage.getItem('daibx:calendar-view')).toBe('day');
  expect(screen.queryByRole('button', { name: /^Late study / })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Next day' }));

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Friday, November 6' }),
  ).toBeInTheDocument();
  expect(routerReplace).toHaveBeenLastCalledWith('/calendar?view=day&date=2026-11-06', {
    scroll: false,
  });
  expect(receivedRanges.at(-1)).toEqual({
    start: '2026-11-06',
    days: '1',
    timeZone: 'America/Los_Angeles',
  });
});

test('the address opens a remembered day', async () => {
  window.history.replaceState(null, '', '/calendar?view=day&date=2026-11-04');

  await renderCalendar();

  expect(screen.getByRole('heading', { level: 1, name: 'Wednesday, November 4' })).toBeVisible();
  expect(screen.getAllByRole('button', { name: /^Late study / })).toHaveLength(1);
});

test('New event adds a planned event to the calendar', async () => {
  const user = await renderCalendar();

  await user.click(screen.getByRole('button', { name: 'New event' }));
  const newEventDialog = screen.getByRole('dialog', { name: 'New event' });
  await user.type(within(newEventDialog).getByLabelText('Title'), '  Swim  ');
  await user.click(within(newEventDialog).getByRole('radio', { name: 'Focus' }));
  setDateTime(newEventDialog, 'Starts', '2026-11-06', '07:00');
  setDateTime(newEventDialog, 'Ends', '2026-11-06', '08:00');
  await user.click(within(newEventDialog).getByRole('button', { name: 'Add event' }));

  expect(await screen.findByRole('button', { name: /^Swim / })).toBeInTheDocument();
  expect(serverEvents.at(-1)).toMatchObject({
    title: 'Swim',
    categoryId: 'category-focus',
    startsAt: at(6, 7),
    endsAt: at(6, 8),
  });
});

test('a too-short new event is refused before it is sent', async () => {
  const user = await renderCalendar();

  await user.click(screen.getByRole('button', { name: 'New event' }));
  const newEventDialog = screen.getByRole('dialog', { name: 'New event' });
  await user.type(within(newEventDialog).getByLabelText('Title'), 'Swim');
  setDateTime(newEventDialog, 'Starts', '2026-11-06', '07:00');
  setDateTime(newEventDialog, 'Ends', '2026-11-06', '07:10');
  await user.click(within(newEventDialog).getByRole('button', { name: 'Add event' }));

  expect(await screen.findByText('Too Short')).toBeInTheDocument();
  expect(serverEvents.some((calendarEvent) => calendarEvent.title === 'Swim')).toBe(false);
});

test('a planned event is edited and saved from the aside', async () => {
  const user = await renderCalendar();

  await user.click(eventButton('Gym'));
  const plannedPanel = screen.getByRole('region', { name: 'Planned event' });
  const titleInput = within(plannedPanel).getByLabelText('Title');
  await user.clear(titleInput);
  await user.type(titleInput, 'Gym, legs');
  setDateTime(plannedPanel, 'Ends', '2026-11-05', '20:30');
  await user.click(within(plannedPanel).getByRole('button', { name: 'Save' }));

  expect(await screen.findByRole('button', { name: /^Gym, legs / })).toBeInTheDocument();
  expect(serverEvents.find((calendarEvent) => calendarEvent.id === 'event-gym')).toMatchObject({
    title: 'Gym, legs',
    endsAt: at(5, 20, 30),
  });
});

test('a planned event is deleted from the aside', async () => {
  const user = await renderCalendar();

  await user.click(eventButton('Gym'));
  await user.click(
    within(screen.getByRole('region', { name: 'Planned event' })).getByRole('button', {
      name: 'Delete',
    }),
  );

  await waitFor(() =>
    expect(screen.queryByRole('button', { name: /^Gym / })).not.toBeInTheDocument(),
  );
  expect(serverEvents.some((calendarEvent) => calendarEvent.id === 'event-gym')).toBe(false);
  expect(screen.getByText('Pick an event to see its details.')).toBeInTheDocument();
});

test('a save the server refuses rolls back and says why', async () => {
  backendServer.use(
    http.patch('/backend/calendar/events/:eventId', () =>
      HttpResponse.json({ error: 'internal server error' }, { status: 500 }),
    ),
  );
  const user = await renderCalendar();

  await user.click(eventButton('Gym'));
  const plannedPanel = screen.getByRole('region', { name: 'Planned event' });
  const titleInput = within(plannedPanel).getByLabelText('Title');
  await user.clear(titleInput);
  await user.type(titleInput, 'Gym, legs');
  await user.click(within(plannedPanel).getByRole('button', { name: 'Save' }));

  expect(await screen.findByText('Something broke on our side')).toBeInTheDocument();
  expect(eventButton('Gym')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Gym, legs / })).not.toBeInTheDocument();
});

test("a tracked event's times are edited", async () => {
  const user = await renderCalendar();

  await user.click(eventButton('Write the changelog'));
  const trackedPanel = screen.getByRole('region', { name: 'Tracked event' });
  await user.click(within(trackedPanel).getByText('Edit times'));
  setDateTime(trackedPanel, 'Ended', '2026-11-05', '15:00');
  await user.click(within(trackedPanel).getByRole('button', { name: 'Save times' }));

  await waitFor(() =>
    expect(
      serverEvents.find((calendarEvent) => calendarEvent.id === 'event-changelog'),
    ).toMatchObject({ startsAt: at(5, 14), endsAt: at(5, 15) }),
  );
  expect(
    await screen.findByRole('button', { name: /^Write the changelog 14:00 – 15:00/ }),
  ).toBeInTheDocument();
});

test("a tracked event's category is saved as soon as it is picked", async () => {
  const user = await renderCalendar();

  await user.click(eventButton('Write the changelog'));
  await user.click(
    within(screen.getByRole('region', { name: 'Tracked event' })).getByRole('radio', {
      name: 'Focus',
    }),
  );

  await waitFor(() =>
    expect(
      serverEvents.find((calendarEvent) => calendarEvent.id === 'event-changelog')?.categoryId,
    ).toBe('category-focus'),
  );
});

test('a tracked event is deleted from the aside after confirming', async () => {
  const user = await renderCalendar();

  await user.click(eventButton('Write the changelog'));
  const trackedPanel = screen.getByRole('region', { name: 'Tracked event' });
  await user.click(within(trackedPanel).getByRole('button', { name: 'Delete event' }));
  expect(serverEvents.some((calendarEvent) => calendarEvent.id === 'event-changelog')).toBe(true);
  await user.click(
    within(within(trackedPanel).getByRole('group', { name: 'Delete this event?' })).getByRole(
      'button',
      { name: 'Delete' },
    ),
  );

  await waitFor(() =>
    expect(screen.queryByRole('button', { name: /^Write the changelog / })).not.toBeInTheDocument(),
  );
});

test('the stack opens a list where each event can be picked', async () => {
  const user = await renderCalendar();

  await user.click(screen.getByRole('button', { name: '3 events, 10:00 – 11:30' }));
  await user.click(
    within(screen.getByRole('dialog', { name: '3 events from 10:00 – 11:30' })).getByRole(
      'button',
      { name: /Read chapter two/ },
    ),
  );

  expect(
    within(screen.getByRole('region', { name: 'Planned event' })).getByLabelText('Title'),
  ).toHaveValue('Read chapter two');
});

const firstRunStart = new Date(2026, 10, 3, 7).toISOString();

const openMorningRun = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /^Morning run .*repeats/ }));
  return screen.getByRole('region', { name: 'Planned event' });
};

test('a weekly event shows on every week with its repeat mark', async () => {
  const user = await renderCalendar();

  expect(screen.getByRole('button', { name: 'Morning run 07:00 – 08:00, repeats' })).toBeVisible();

  await user.click(screen.getByRole('button', { name: 'Next week' }));

  expect(
    await screen.findByRole('button', { name: 'Morning run 07:00 – 08:00, repeats' }),
  ).toBeVisible();
  expect(receivedRanges.at(-1)).toMatchObject({ start: '2026-11-09', days: '7' });
});

test('saving a repeating event asks which events change and sends that scope', async () => {
  const user = await renderCalendar();

  const plannedPanel = await openMorningRun(user);
  const titleInput = within(plannedPanel).getByLabelText('Title');
  await user.clear(titleInput);
  await user.type(titleInput, 'Long run');
  await user.click(within(plannedPanel).getByRole('button', { name: 'Save' }));
  const scopeDialog = screen.getByRole('dialog', { name: 'Change repeating event' });
  await user.click(within(scopeDialog).getByRole('radio', { name: 'This and following events' }));
  await user.click(within(scopeDialog).getByRole('button', { name: 'Save' }));

  await waitFor(() => expect(receivedRanges).toHaveLength(2));
  expect(receivedOccurrenceWrites).toEqual([
    {
      method: 'PATCH',
      originalStart: firstRunStart,
      body: {
        scope: 'following',
        title: 'Long run',
        categoryId: null,
        start: '2026-11-03T07:00',
        end: '2026-11-03T08:00',
        inputZone: 'America/Los_Angeles',
      },
    },
  ]);
});

test('cancelling the question changes nothing', async () => {
  const user = await renderCalendar();

  const plannedPanel = await openMorningRun(user);
  const titleInput = within(plannedPanel).getByLabelText('Title');
  await user.clear(titleInput);
  await user.type(titleInput, 'Long run');
  await user.click(within(plannedPanel).getByRole('button', { name: 'Save' }));
  await user.click(
    within(screen.getByRole('dialog', { name: 'Change repeating event' })).getByRole('button', {
      name: 'Cancel',
    }),
  );

  expect(receivedOccurrenceWrites).toEqual([]);
  expect(screen.getByRole('button', { name: /^Morning run / })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Long run / })).not.toBeInTheDocument();
});

test('a time change to "This event" stays put after a reload', async () => {
  const user = await renderCalendar();

  const plannedPanel = await openMorningRun(user);
  setDateTime(plannedPanel, 'Starts', '2026-11-03', '09:00');
  setDateTime(plannedPanel, 'Ends', '2026-11-03', '10:00');
  await user.click(within(plannedPanel).getByRole('button', { name: 'Save' }));
  await user.click(
    within(screen.getByRole('dialog', { name: 'Change repeating event' })).getByRole('button', {
      name: 'Save',
    }),
  );

  expect(
    await screen.findByRole('button', { name: 'Morning run 09:00 – 10:00, repeats' }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Next week' }));
  await user.click(await screen.findByRole('button', { name: 'Previous week' }));
  expect(
    await screen.findByRole('button', { name: 'Morning run 09:00 – 10:00, repeats' }),
  ).toBeInTheDocument();
  expect(receivedOccurrenceWrites[0]?.body).toMatchObject({ scope: 'this' });
});

test('deleting one occurrence of a repeating event keeps the others', async () => {
  const user = await renderCalendar();

  const plannedPanel = await openMorningRun(user);
  await user.click(within(plannedPanel).getByRole('button', { name: 'Delete' }));
  await user.click(
    within(screen.getByRole('dialog', { name: 'Delete repeating event' })).getByRole('button', {
      name: 'Delete',
    }),
  );

  await waitFor(() =>
    expect(screen.queryByRole('button', { name: /^Morning run / })).not.toBeInTheDocument(),
  );
  expect(receivedOccurrenceWrites).toEqual([
    { method: 'DELETE', originalStart: firstRunStart, body: { scope: 'this' } },
  ]);
  await user.click(screen.getByRole('button', { name: 'Next week' }));
  expect(await screen.findByRole('button', { name: /^Morning run / })).toBeInTheDocument();
});

test('a repeating change the server refuses rolls back and says why', async () => {
  backendServer.use(
    http.patch('/backend/calendar/series/:seriesId/occurrences/:originalStart', () =>
      HttpResponse.json({ error: 'internal server error' }, { status: 500 }),
    ),
  );
  const user = await renderCalendar();

  const plannedPanel = await openMorningRun(user);
  const titleInput = within(plannedPanel).getByLabelText('Title');
  await user.clear(titleInput);
  await user.type(titleInput, 'Long run');
  await user.click(within(plannedPanel).getByRole('button', { name: 'Save' }));
  await user.click(
    within(screen.getByRole('dialog', { name: 'Change repeating event' })).getByRole('button', {
      name: 'Save',
    }),
  );

  expect(await screen.findByText('Something broke on our side')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Morning run / })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Long run / })).not.toBeInTheDocument();
});

test("a card's scheduled move shows at its time and opens the card", async () => {
  await renderCalendar();

  expect(screen.getByRole('link', { name: /18:00: Weekly review moves to To Do/ })).toHaveAttribute(
    'href',
    '/board?board=board-1&card=card-1',
  );
});

test('a new repeating event sends its rule and shows its occurrences', async () => {
  const user = await renderCalendar();

  await user.click(screen.getByRole('button', { name: 'New event' }));
  const newEventDialog = screen.getByRole('dialog', { name: 'New event' });
  await user.type(within(newEventDialog).getByLabelText('Title'), 'Swim');
  setDateTime(newEventDialog, 'Starts', '2026-11-06', '07:00');
  setDateTime(newEventDialog, 'Ends', '2026-11-06', '08:00');
  await user.selectOptions(within(newEventDialog).getByLabelText('Repeat'), 'weekly');
  await user.click(within(newEventDialog).getByRole('button', { name: 'Add event' }));

  await waitFor(() => expect(receivedRanges).toHaveLength(2));
  expect(receivedCreates).toEqual([
    {
      title: 'Swim',
      categoryId: null,
      start: '2026-11-06T07:00',
      end: '2026-11-06T08:00',
      inputZone: 'America/Los_Angeles',
      repeat: { frequency: 'weekly', interval: 1, weekdays: ['fri'], ends: { never: true } },
    },
  ]);
});

test('the calendar shows its days and times in the zone set in Settings', async () => {
  calendarZoneSetting = 'Asia/Manila';

  await renderCalendar();

  expect(receivedRanges).toEqual([{ start: '2026-11-02', days: '7', timeZone: 'Asia/Manila' }]);
  expect(screen.getByRole('button', { name: /^Gym 11:00 – 12:00/ })).toBeInTheDocument();
  expect(screen.getByLabelText('Now, 10:02')).toBeInTheDocument();
});

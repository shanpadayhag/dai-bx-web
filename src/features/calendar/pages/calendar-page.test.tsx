import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { Category } from '@/core/category';
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
  source: null,
  ...overrides,
});

const trackedOverrides = (finishedAt: string | null): Partial<CalendarEventRecord> => ({
  kind: 'tracked',
  finishedAt,
  source: { kind: 'task', id: 'task-1', groupId: 'group-1' },
});

let serverEvents: CalendarEventRecord[] = [];
let receivedRanges: { from: string; to: string }[] = [];

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

const overlapsRange = (calendarEvent: CalendarEventRecord, from: string, to: string) =>
  new Date(calendarEvent.startsAt) < new Date(to) &&
  (calendarEvent.endsAt === null || new Date(calendarEvent.endsAt) > new Date(from));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 5, 18, 2) });
  window.history.replaceState(null, '', '/calendar');
  window.localStorage.clear();
  routerReplace.mockClear();
  serverEvents = startingEvents();
  receivedRanges = [];
  backendServer.use(
    http.get('/backend/categories', () => HttpResponse.json([focusCategory])),
    http.get('/backend/account/time-tracking', () => HttpResponse.json(timeTrackingSettings)),
    http.get('/backend/calendar/events', ({ request }) => {
      const searchParams = new URL(request.url).searchParams;
      const from = searchParams.get('from') ?? '';
      const to = searchParams.get('to') ?? '';
      receivedRanges.push({ from, to });
      return HttpResponse.json(
        serverEvents.filter((calendarEvent) => overlapsRange(calendarEvent, from, to)),
      );
    }),
    http.post('/backend/calendar/events', async ({ request }) => {
      const newEvent = (await request.json()) as Pick<
        CalendarEventRecord,
        'title' | 'categoryId' | 'startsAt' | 'endsAt'
      >;
      const createdEvent = eventRecord(
        `event-${serverEvents.length + 1}`,
        newEvent.title,
        newEvent.startsAt,
        newEvent.endsAt,
        { categoryId: newEvent.categoryId },
      );
      serverEvents.push(createdEvent);
      return HttpResponse.json(createdEvent, { status: 201 });
    }),
    http.patch('/backend/calendar/events/:eventId', async ({ params, request }) => {
      const eventChanges = (await request.json()) as Partial<CalendarEventRecord>;
      serverEvents = serverEvents.map((calendarEvent) =>
        calendarEvent.id === params.eventId ? { ...calendarEvent, ...eventChanges } : calendarEvent,
      );
      return HttpResponse.json(
        serverEvents.find((calendarEvent) => calendarEvent.id === params.eventId),
      );
    }),
    http.delete('/backend/calendar/events/:eventId', ({ params }) => {
      serverEvents = serverEvents.filter((calendarEvent) => calendarEvent.id !== params.eventId);
      return HttpResponse.json({ status: 'deleted' });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
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
    { from: new Date(2026, 10, 2).toISOString(), to: new Date(2026, 10, 9).toISOString() },
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
    from: new Date(2026, 10, 6).toISOString(),
    to: new Date(2026, 10, 7).toISOString(),
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

import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, expect, test, vi } from 'vitest';
import type ActivityEntryRecord from '@/features/activity/entities/activity-entry-record';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import type { UpNextRecord, UpNextTaskRecord } from '@/features/today/entities/up-next-task';
import TodayPage from '@/features/today/pages/today-page';
import TrackingProvider from '@/features/tracking/components/tracking-provider';
import type RunningItemRecord from '@/features/tracking/entities/running-item-record';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const stableRouter = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const backendServer = startBackendServer();

const MINUTE_MILLIS = 60_000;

afterEach(() => {
  vi.useRealTimers();
});

const minutesFromNow = (minuteCount: number) =>
  new Date(Date.now() + minuteCount * MINUTE_MILLIS).toISOString();

const runningRecord = (
  id: string,
  title: string,
  startedMinutesAgo: number,
): RunningItemRecord => ({
  id,
  kind: 'tracked',
  title,
  categoryId: null,
  startsAt: minutesFromNow(-startedMinutesAgo),
  endsAt: null,
  finishedAt: null,
  lastAnsweredAt: null,
  timeZone: null,
  series: null,
  task: null,
  isScheduleBlock: false,
  source: { kind: 'task', id: `task-${id}`, groupId: 'group-daibx' },
  estimateMinutes: null,
  sourceName: 'DaiBX',
});

const upNextTask = (
  taskId: string,
  overrides: Partial<UpNextTaskRecord> = {},
): UpNextTaskRecord => ({
  taskId,
  name: `Task ${taskId}`,
  groupId: 'group-daibx',
  groupName: 'DaiBX',
  estimateMinutes: null,
  due: null,
  priority: 'normal',
  plannedEvent: null,
  missed: false,
  ...overrides,
});

type TodayBackend = {
  runningRecords?: RunningItemRecord[];
  eventRecords?: CalendarEventRecord[];
  upNext?: () => UpNextRecord;
  activityEntries?: ActivityEntryRecord[];
  onCalendarRequest?: (requestUrl: URL) => void;
};

const useTodayBackend = ({
  runningRecords = [],
  eventRecords = [],
  upNext = () => ({ tasks: [], refreshAt: minutesFromNow(600) }),
  activityEntries = [],
  onCalendarRequest = () => undefined,
}: TodayBackend) =>
  backendServer.use(
    http.get('/backend/tracking/running', () => HttpResponse.json(runningRecords)),
    http.get('/backend/account/time-tracking', () =>
      HttpResponse.json({
        checkInsEnabled: true,
        checkInIntervalMinutes: 30,
        firstCheckInMinutes: 30,
        workingHoursStart: '09:00',
        workingHoursEnd: '17:00',
        trackedCategoryId: null,
        calendarTimeZone: null,
        planningHours: null,
      }),
    ),
    http.get('/backend/account', () =>
      HttpResponse.json({
        name: 'Shan Padayhag',
        email: 'shan@example.com',
        accentColor: 'blue',
        theme: 'light',
        security: { recoveryCodesRemaining: 10, activeSessionCount: 1 },
      }),
    ),
    http.get('/backend/categories', () => HttpResponse.json([])),
    http.get('/backend/calendar/events', ({ request }) => {
      onCalendarRequest(new URL(request.url));
      return HttpResponse.json({ events: eventRecords, moves: [] });
    }),
    http.get('/backend/today/up-next', () => HttpResponse.json(upNext())),
    http.get('/backend/activity', () =>
      HttpResponse.json({ entries: activityEntries, nextCursor: null }),
    ),
  );

const renderTodayPage = () =>
  renderWithToaster(
    <TrackingProvider>
      <TodayPage />
    </TrackingProvider>,
  );

test('greets by first name and lists each running item with its check-in and actions', async () => {
  useTodayBackend({
    runningRecords: [
      runningRecord('a', 'Write the changelog', 10),
      runningRecord('b', 'Review the plan', 45),
    ],
  });

  renderTodayPage();

  expect(await screen.findByRole('heading', { name: /, Shan$/ })).toBeVisible();
  const runningNow = screen.getByRole('region', { name: 'Running now' });
  const changelogItem = await within(runningNow).findByRole('article', {
    name: 'Write the changelog',
  });
  const planItem = within(runningNow).getByRole('article', { name: 'Review the plan' });
  expect(await within(changelogItem).findByText(/^Next check-in \d{2}:\d{2}$/)).toBeVisible();
  expect(within(planItem).getByText('Check-in due')).toBeVisible();
  expect(within(changelogItem).getByRole('button', { name: 'Finish' })).toBeVisible();
  expect(within(changelogItem).getByRole('button', { name: 'Check in' })).toBeVisible();
  expect(within(changelogItem).getByRole('link', { name: 'Open in calendar' })).toHaveAttribute(
    'href',
    expect.stringMatching(/^\/calendar\?view=day&date=\d{4}-\d{2}-\d{2}$/),
  );
});

test('shows the empty running state and the agenda kinds with the past muted', async () => {
  useTodayBackend({
    eventRecords: [
      {
        ...runningRecord('done', 'Morning review', 120),
        endsAt: minutesFromNow(-90),
        finishedAt: minutesFromNow(-90),
      },
      {
        ...runningRecord('plan', 'Gym', 0),
        kind: 'planned',
        source: null,
        startsAt: minutesFromNow(60),
        endsAt: minutesFromNow(120),
        task: {
          id: 'task-gym',
          name: 'Gym',
          groupId: 'group-daibx',
          groupName: 'DaiBX',
          done: false,
        },
      },
    ],
  });

  renderTodayPage();

  expect(await screen.findByRole('heading', { name: 'Nothing running' })).toBeVisible();
  const agenda = screen.getByRole('region', { name: 'On the calendar' });
  expect(await within(agenda).findByText('Morning review')).toHaveClass('text-muted-foreground/80');
  expect(within(agenda).getByText('Gym')).toHaveClass('text-foreground');
  expect(within(agenda).getByText(/^Tracked · until/)).toBeVisible();
  expect(within(agenda).getByText(/^Planned · until/)).toBeVisible();
  expect(within(agenda).getByRole('button', { name: 'Start Gym' })).toBeVisible();
});

test('shows five up next tasks, then all, with a missed block marked', async () => {
  useTodayBackend({
    upNext: () => ({
      tasks: [
        upNextTask('1', {
          name: 'Ship the release',
          plannedEvent: {
            id: 'event-1',
            startsAt: minutesFromNow(-20),
            endsAt: minutesFromNow(10),
          },
          missed: true,
          priority: 'high',
        }),
        ...['2', '3', '4', '5', '6', '7'].map((taskId) => upNextTask(taskId)),
      ],
      refreshAt: minutesFromNow(600),
    }),
  });

  renderTodayPage();

  const upNext = screen.getByRole('region', { name: 'Up next' });
  expect(await within(upNext).findByText('Ship the release')).toBeVisible();
  expect(within(upNext).getByText('Missed')).toBeVisible();
  expect(within(upNext).getByText('High')).toBeVisible();
  expect(within(upNext).getAllByRole('listitem')).toHaveLength(5);

  await userEvent.click(within(upNext).getByRole('button', { name: 'Show all (7)' }));

  expect(within(upNext).getAllByRole('listitem')).toHaveLength(7);
  expect(within(upNext).getByRole('button', { name: 'Show fewer' })).toBeVisible();
});

test('ticking an up next task completes it and refetches the list', async () => {
  let isTicked = false;
  useTodayBackend({
    upNext: () => ({
      tasks: isTicked ? [upNextTask('2')] : [upNextTask('1'), upNextTask('2')],
      refreshAt: minutesFromNow(600),
    }),
  });
  backendServer.use(
    http.post('/backend/tasks/1/complete', () => {
      isTicked = true;
      return HttpResponse.json({ group: { id: 'group-daibx', name: 'DaiBX' }, tasks: [] });
    }),
  );

  renderTodayPage();
  await userEvent.click(await screen.findByRole('checkbox', { name: 'Mark Task 1 as done' }));

  await waitFor(() => expect(screen.queryByText('Task 1')).toBeNull());
  expect(isTicked).toBe(true);
  expect(screen.getByText('Task 2')).toBeVisible();
});

test('refetches up next at its refresh time', async () => {
  let upNextRequestCount = 0;
  vi.useFakeTimers({ shouldAdvanceTime: true });
  useTodayBackend({
    upNext: () => {
      upNextRequestCount += 1;
      return {
        tasks: [upNextTask(String(upNextRequestCount), { name: `Round ${upNextRequestCount}` })],
        refreshAt: minutesFromNow(5),
      };
    },
  });

  renderTodayPage();
  expect(await screen.findByText('Round 1')).toBeVisible();
  await act(() => vi.advanceTimersByTimeAsync(6 * MINUTE_MILLIS));

  expect(await screen.findByText('Round 2')).toBeVisible();
});

test('moves to the next day at local midnight', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-11-21T23:59:30-08:00'));
  const requestedStarts: string[] = [];
  useTodayBackend({
    onCalendarRequest: (requestUrl) =>
      requestedStarts.push(requestUrl.searchParams.get('start') ?? ''),
  });

  renderTodayPage();
  expect(await screen.findByText('Saturday, November 21')).toBeVisible();
  await act(() => vi.advanceTimersByTimeAsync(MINUTE_MILLIS));

  expect(await screen.findByText('Sunday, November 22')).toBeVisible();
  await waitFor(() => expect(requestedStarts).toContain('2026-11-22'));
});

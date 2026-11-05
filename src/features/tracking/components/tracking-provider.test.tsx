import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import TrackingPill from '@/features/tracking/components/tracking-pill';
import TrackingProvider from '@/features/tracking/components/tracking-provider';
import type RunningItemRecord from '@/features/tracking/entities/running-item-record';
import type TimeTrackingSettings from '@/features/tracking/entities/time-tracking-settings';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const backendServer = startBackendServer();

const at = (hour: number, minute = 0) => new Date(2026, 10, 5, hour, minute).toISOString();

const timeTrackingSettings: TimeTrackingSettings = {
  checkInsEnabled: true,
  checkInIntervalMinutes: 30,
  firstCheckInMinutes: 30,
  workingHoursStart: '16:00',
  workingHoursEnd: '02:00',
  trackedCategoryId: null,
};

const runningRecord = (
  id: string,
  title: string,
  startsAt: string,
  overrides: Partial<RunningItemRecord> = {},
): RunningItemRecord => ({
  id,
  kind: 'tracked',
  title,
  categoryId: null,
  startsAt,
  endsAt: null,
  finishedAt: null,
  lastAnsweredAt: null,
  source: { kind: 'task', id: `task-${id}`, groupId: 'group-1' },
  estimateMinutes: null,
  sourceName: 'Today',
  ...overrides,
});

let runningRecords: RunningItemRecord[] = [];
let checkedInIds: string[] = [];
let finishRequests: { eventId: string; body: unknown }[] = [];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 5, 18, 0) });
  checkedInIds = [];
  finishRequests = [];
  runningRecords = [
    runningRecord('changelog', 'Write the changelog', at(17, 0), {
      lastAnsweredAt: at(17, 20),
    }),
    runningRecord('release', 'Plan the release', at(17, 45), {
      source: { kind: 'card', id: 'card-1', boardId: 'board-1' },
      sourceName: 'Personal',
    }),
  ];
  backendServer.use(
    http.get('/backend/tracking/running', () => HttpResponse.json(runningRecords)),
    http.get('/backend/account/time-tracking', () => HttpResponse.json(timeTrackingSettings)),
    http.post('/backend/tracking/:eventId/check-in', ({ params }) => {
      const eventId = String(params.eventId);
      checkedInIds.push(eventId);
      runningRecords = runningRecords.map((record) =>
        record.id === eventId ? { ...record, lastAnsweredAt: new Date().toISOString() } : record,
      );
      return HttpResponse.json(runningRecords.find((record) => record.id === eventId));
    }),
    http.post('/backend/tracking/:eventId/finish', async ({ params, request }) => {
      const eventId = String(params.eventId);
      const body = (await request.json()) as { endsAt: string };
      finishRequests.push({ eventId, body });
      const finishedRecord = runningRecords.find((record) => record.id === eventId);
      runningRecords = runningRecords.filter((record) => record.id !== eventId);
      return HttpResponse.json({
        event: { ...finishedRecord, endsAt: body.endsAt, finishedAt: new Date().toISOString() },
      });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

const renderTracking = async () => {
  const user = userEvent.setup();
  renderWithToaster(
    <TrackingProvider>
      <TrackingPill />
    </TrackingProvider>,
  );
  await screen.findByRole('button', { name: '2 running: show all' });
  return user;
};

const finishDialog = (itemTitle: string) =>
  screen.getByRole('dialog', { name: `Finish ${itemTitle}` });

test('the pill shows the newest item and the list shows every running item', async () => {
  const user = await renderTracking();
  expect(screen.getByRole('button', { name: 'Finish Write the changelog' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '2 running: show all' }));

  const runningList = screen.getByRole('dialog', { name: 'Running now' });
  expect(within(runningList).getByText('Write the changelog')).toBeInTheDocument();
  expect(within(runningList).getByText('Plan the release')).toBeInTheDocument();
  expect(within(runningList).getByText(/Card · Personal/)).toBeInTheDocument();
});

test('a due check-in asks, and Yes keeps it running', async () => {
  const user = await renderTracking();

  const checkInCard = screen.getByRole('region', { name: 'Check-in' });
  expect(within(checkInCard).getByText(/since/)).toHaveTextContent(
    'Were you on “Write the changelog” since 17:20?',
  );
  expect(within(checkInCard).queryByText(/Plan the release/)).not.toBeInTheDocument();

  await user.click(
    within(checkInCard).getByRole('button', {
      name: 'Yes, I was on Write the changelog since 17:20',
    }),
  );

  await waitFor(() =>
    expect(screen.queryByRole('region', { name: 'Check-in' })).not.toBeInTheDocument(),
  );
  expect(checkedInIds).toEqual(['changelog']);
  expect(screen.getByRole('button', { name: 'Finish Write the changelog' })).toBeInTheDocument();
});

test('No opens the finish dialog at the last check-in, and finishing marks it done', async () => {
  const user = await renderTracking();

  await user.click(
    screen.getByRole('button', { name: 'No, I wasn’t on Write the changelog since 17:20' }),
  );
  const dialog = finishDialog('Write the changelog');
  expect(within(dialog).getByText('You said you weren’t on it since 17:20.')).toBeInTheDocument();
  expect(within(dialog).getByRole('radio', { name: /Your last check-in/ })).toBeChecked();
  expect(within(dialog).getByRole('checkbox', { name: 'Mark it done' })).toBeChecked();
  await user.click(within(dialog).getByRole('button', { name: 'Finish task' }));

  await waitFor(() =>
    expect(finishRequests).toEqual([
      { eventId: 'changelog', body: { endsAt: at(17, 20), markDone: true } },
    ]),
  );
  expect(
    await screen.findByRole('button', { name: 'Finish Plan the release' }),
  ).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Check-in' })).not.toBeInTheDocument();
});

test('unticking Mark it done turns the button into Stop', async () => {
  const user = await renderTracking();

  await user.click(screen.getByRole('button', { name: 'Finish Write the changelog' }));
  const dialog = finishDialog('Write the changelog');
  await user.click(within(dialog).getByRole('checkbox', { name: 'Mark it done' }));
  await user.click(within(dialog).getByRole('radio', { name: /Now/ }));
  await user.click(within(dialog).getByRole('button', { name: 'Stop' }));

  await waitFor(() =>
    expect(finishRequests).toEqual([
      { eventId: 'changelog', body: { endsAt: at(18, 0), markDone: false } },
    ]),
  );
});

test('a card finishes without Mark it done', async () => {
  const user = await renderTracking();
  await user.click(screen.getByRole('button', { name: '2 running: show all' }));

  await user.click(
    within(screen.getByRole('dialog', { name: 'Running now' })).getByRole('button', {
      name: 'Finish Plan the release',
    }),
  );
  const dialog = finishDialog('Plan the release');
  expect(within(dialog).queryByRole('checkbox', { name: 'Mark it done' })).not.toBeInTheDocument();
  await user.click(within(dialog).getByRole('button', { name: 'Stop' }));

  await waitFor(() =>
    expect(finishRequests).toEqual([
      { eventId: 'release', body: { endsAt: at(18, 0), markDone: false } },
    ]),
  );
});

test('a set end in the future is refused before it is sent', async () => {
  const user = await renderTracking();

  await user.click(screen.getByRole('button', { name: 'Finish Write the changelog' }));
  const dialog = finishDialog('Write the changelog');
  await user.click(within(dialog).getByRole('radio', { name: /Set it myself/ }));
  fireEvent.change(within(dialog).getByLabelText('End time'), { target: { value: '18:30' } });
  await user.click(within(dialog).getByRole('button', { name: 'Finish task' }));

  expect(await screen.findByText('Check the End')).toBeInTheDocument();
  expect(finishRequests).toEqual([]);
});

test('the running list reloads when the window regains focus', async () => {
  await renderTracking();
  runningRecords = runningRecords.slice(1);

  fireEvent(window, new Event('focus'));

  expect(await screen.findByRole('button', { name: '1 running: show all' })).toBeInTheDocument();
});

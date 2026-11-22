import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, test, vi } from 'vitest';
import SearchLauncher from '@/features/search/components/search-launcher';
import { SEARCH_PANEL_ID } from '@/features/search/events/use-search-events';
import type { SearchResultsRecord } from '@/features/search/entities/search-result-record';
import {
  TrackingContext,
  type TrackingContextValue,
} from '@/features/tracking/states/tracking-context';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const routerPush = vi.hoisted(() => vi.fn());
const stableRouter = vi.hoisted(() => ({ push: routerPush, replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const backendServer = startBackendServer();

const fullResults: SearchResultsRecord = {
  tasks: {
    items: [
      {
        id: 'task-plan',
        name: 'Plan the release',
        groupId: 'group-work',
        groupName: 'Work',
        parentNames: ['Launch'],
        done: false,
        running: false,
      },
    ],
    hasMore: false,
  },
  groups: { items: [{ id: 'group-planning', name: 'Planning', openTaskCount: 3 }], hasMore: false },
  cards: {
    items: [
      {
        id: 'card-plan',
        title: 'Planner notes',
        boardId: 'board-1',
        boardName: 'Personal',
        listName: 'Doing',
        archived: false,
        running: false,
        snippet: null,
      },
    ],
    hasMore: true,
  },
  events: { items: [], hasMore: false },
};

let searchRequests: URLSearchParams[] = [];
let searchResponse: () => Response = () => HttpResponse.json(fullResults);

beforeEach(() => {
  routerPush.mockClear();
  searchRequests = [];
  searchResponse = () => HttpResponse.json(fullResults);
  backendServer.use(
    http.get('/backend/search', ({ request }) => {
      const searchParameters = new URL(request.url).searchParams;
      searchRequests.push(searchParameters);
      if (searchParameters.get('kind') === 'cards') {
        return HttpResponse.json({
          cards: {
            items: [
              ...(fullResults.cards?.items ?? []),
              {
                id: 'card-plan-2',
                title: 'Plan the move',
                boardId: 'board-1',
                boardName: 'Personal',
                listName: 'To do',
                archived: true,
                running: false,
                snippet: null,
              },
            ],
            hasMore: false,
          },
        });
      }
      return searchResponse();
    }),
  );
});

const trackingValue = (overrides: Partial<TrackingContextValue> = {}): TrackingContextValue => ({
  runningItems: [],
  runningSourceIds: new Set(),
  trackingRevision: 0,
  lastFinishedItem: null,
  calendarTimeZone: 'UTC',
  timeTrackingSettings: null,
  trackingNow: new Date(),
  handleStartTask: () => Promise.resolve(true),
  handleStartCard: () => Promise.resolve(true),
  handleOpenFinish: () => undefined,
  handleCheckIn: () => undefined,
  handleApplyTimeTrackingSettings: () => undefined,
  ...overrides,
});

const renderLauncher = (overrides: Partial<TrackingContextValue> = {}) => {
  const user = userEvent.setup();
  renderWithToaster(
    <TrackingContext.Provider value={trackingValue(overrides)}>
      <SearchLauncher />
    </TrackingContext.Provider>,
  );
  return user;
};

const searchPanel = () => {
  const panelElement = document.getElementById(SEARCH_PANEL_ID);
  if (panelElement === null) throw new Error('the search panel is not rendered');
  return panelElement;
};

const optionWithTitle = (resultTitle: string) => {
  const matchedOption = screen
    .queryAllByRole('option')
    .find((optionElement) => optionElement.textContent?.startsWith(resultTitle));
  if (matchedOption === undefined) throw new Error(`no option titled ${resultTitle}`);
  return matchedOption;
};

const findOptionWithTitle = (resultTitle: string) => waitFor(() => optionWithTitle(resultTitle));
const searchInput = () =>
  screen.getByRole('combobox', { name: 'Search tasks, groups, cards and events' });

test('control K opens the panel with the input focused and toggles it closed', async () => {
  const user = renderLauncher();
  expect(searchPanel()).not.toBeVisible();

  await user.keyboard('{Control>}k{/Control}');
  expect(searchPanel()).toBeVisible();
  expect(searchInput()).toHaveFocus();

  await user.keyboard('{Control>}k{/Control}');
  expect(searchPanel()).not.toBeVisible();
});

test('the top bar box opens the panel', async () => {
  const user = renderLauncher();
  await user.click(screen.getByRole('button', { name: /Search tasks, cards, events/ }));
  expect(searchPanel()).toBeVisible();
});

test('one character does not search, two characters search once after a pause', async () => {
  const user = renderLauncher();
  await user.keyboard('{Meta>}k{/Meta}');
  await user.type(searchInput(), 'p');
  expect(screen.getByText('Find a task, group, card or event')).toBeInTheDocument();
  await new Promise((resolve) => setTimeout(resolve, 250));
  expect(searchRequests).toHaveLength(0);

  await user.type(searchInput(), 'l');
  await screen.findByRole('group', { name: 'Tasks' });
  const resultList = screen.getByRole('listbox', { name: 'Search results' });
  expect(searchRequests).toHaveLength(1);
  expect(searchRequests.at(0)?.get('q')).toBe('pl');
  expect(searchRequests.at(0)?.get('kind')).toBe('all');
  expect(searchRequests.at(0)?.get('limit')).toBe('5');
  expect(within(resultList).getByRole('group', { name: 'Tasks' })).toBeInTheDocument();
  expect(within(resultList).getByRole('group', { name: 'Cards' })).toBeInTheDocument();
  expect(within(resultList).queryByRole('group', { name: 'Events' })).not.toBeInTheDocument();
  expect(within(resultList).getByText('Work · Launch')).toBeInTheDocument();
  expect(within(resultList).getAllByText('Pl', { selector: 'mark' }).length).toBeGreaterThan(0);
});

test('arrows move the active result and Enter opens it', async () => {
  const user = renderLauncher();
  await user.keyboard('{Control>}k{/Control}');
  await user.type(searchInput(), 'plan');
  const firstOption = await findOptionWithTitle('Plan the release');
  expect(firstOption).toHaveAttribute('aria-selected', 'true');
  expect(searchInput()).toHaveAttribute('aria-activedescendant', firstOption.id);

  await user.keyboard('{ArrowDown}');
  expect(optionWithTitle('Planning')).toHaveAttribute('aria-selected', 'true');
  await user.keyboard('{Enter}');

  expect(routerPush).toHaveBeenCalledWith('/tasks?group=group-planning');
  expect(searchPanel()).not.toBeVisible();
});

test('clicking a result opens it', async () => {
  const user = renderLauncher();
  await user.keyboard('{Control>}k{/Control}');
  await user.type(searchInput(), 'plan');
  await user.click(await findOptionWithTitle('Planner notes'));
  expect(routerPush).toHaveBeenCalledWith('/board?board=board-1&card=card-plan');
});

test('command Enter starts the active task and closes the panel', async () => {
  const handleStartTask = vi.fn(() => Promise.resolve(true));
  const user = renderLauncher({ handleStartTask });
  await user.keyboard('{Control>}k{/Control}');
  await user.type(searchInput(), 'plan');
  await findOptionWithTitle('Plan the release');

  await user.keyboard('{Meta>}{Enter}{/Meta}');

  expect(handleStartTask).toHaveBeenCalledWith('task-plan');
  await waitFor(() => expect(searchPanel()).not.toBeVisible());
  expect(routerPush).not.toHaveBeenCalled();
});

test('a failed start keeps the panel open', async () => {
  const handleStartCard = vi.fn(() => Promise.resolve(false));
  const user = renderLauncher({ handleStartCard });
  await user.keyboard('{Control>}k{/Control}');
  await user.type(searchInput(), 'plan');
  const cardOption = await findOptionWithTitle('Planner notes');

  await user.click(within(cardOption).getByRole('button', { name: 'Start Planner notes' }));

  expect(handleStartCard).toHaveBeenCalledWith('card-plan');
  expect(searchPanel()).toBeVisible();
  expect(routerPush).not.toHaveBeenCalled();
});

test('show all asks for one kind and All results goes back', async () => {
  const user = renderLauncher();
  await user.keyboard('{Control>}k{/Control}');
  await user.type(searchInput(), 'plan');
  await user.click(await screen.findByRole('button', { name: 'Show all cards' }));

  expect(await findOptionWithTitle('Plan the move')).toBeInTheDocument();
  expect(searchRequests.at(-1)?.get('kind')).toBe('cards');
  expect(searchRequests.at(-1)?.get('limit')).toBe('50');
  expect(screen.queryByRole('group', { name: 'Tasks' })).not.toBeInTheDocument();
  expect(screen.getByText('Archived')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'All results' }));
  expect(await screen.findByRole('group', { name: 'Tasks' })).toBeInTheDocument();
});

test('a search with no matches says so', async () => {
  searchResponse = () =>
    HttpResponse.json({
      tasks: { items: [], hasMore: false },
      groups: { items: [], hasMore: false },
      cards: { items: [], hasMore: false },
      events: { items: [], hasMore: false },
    });
  const user = renderLauncher();
  await user.keyboard('{Control>}k{/Control}');
  await user.type(searchInput(), 'zzz');
  expect(await screen.findByText('Nothing matches “zzz”')).toBeInTheDocument();
});

test('a failed search offers to try again', async () => {
  searchResponse = () => HttpResponse.json({ error: 'internal' }, { status: 500 });
  const user = renderLauncher();
  await user.keyboard('{Control>}k{/Control}');
  await user.type(searchInput(), 'plan');
  const searchAlert = await screen.findByRole('alert');
  expect(searchAlert).toHaveTextContent('Search didn’t load');

  searchResponse = () => HttpResponse.json(fullResults);
  await user.click(within(searchAlert).getByRole('button', { name: 'Try again' }));
  expect(await findOptionWithTitle('Plan the release')).toBeInTheDocument();
});

test('closing the panel clears the search', async () => {
  const user = renderLauncher();
  await user.keyboard('{Control>}k{/Control}');
  await user.type(searchInput(), 'plan');
  await findOptionWithTitle('Plan the release');
  await user.keyboard('{Control>}k{/Control}');
  await user.keyboard('{Control>}k{/Control}');
  expect(searchInput()).toHaveValue('');
});

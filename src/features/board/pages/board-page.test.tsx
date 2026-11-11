import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type Board from '@/features/board/entities/board';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardCardRecord } from '@/features/board/entities/board-record';
import {
  applyBoardChange,
  type LocalBoardChange,
} from '@/features/board/entities/board-record-changes';
import type CardDetailRecord from '@/features/board/entities/card-detail-record';
import type CardScheduleRecord from '@/features/board/entities/card-schedule-record';
import type CardTriggers from '@/features/board/entities/card-triggers';
import type { ScheduleRunRecord } from '@/features/board/entities/card-schedule-record';
import type { RepeatRule } from '@/core/repeat-rule';
import type CardPropertyValue from '@/features/board/entities/card-property-value';
import BoardPropertyKind from '@/features/board/enums/board-property-kind';
import BoardPage from '@/features/board/pages/board-page';
import TrackingProvider from '@/features/tracking/components/tracking-provider';
import type RunningItemRecord from '@/features/tracking/entities/running-item-record';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const routerReplace = vi.hoisted(() => vi.fn());
const stableRouter = vi.hoisted(() => ({ push: vi.fn(), replace: routerReplace }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const backendServer = startBackendServer();

const cardRecord = (
  id: string,
  title: string,
  listId: string,
  position: number,
  overrides: Partial<BoardCardRecord> = {},
): BoardCardRecord => ({
  id,
  listId,
  position,
  title,
  dueDate: null,
  dueTime: null,
  values: [],
  linkedTaskCount: 0,
  doneLinkedTaskCount: 0,
  nextMove: null,
  ...overrides,
});

const personalBoard: BoardRecord = {
  board: { id: 'board-personal', name: 'Personal' },
  lists: [
    { id: 'list-backlog', name: 'Backlog', position: 0, archiveAfter: null },
    { id: 'list-doing', name: 'Doing', position: 1, archiveAfter: null },
    { id: 'list-done', name: 'Done', position: 2, archiveAfter: null },
  ],
  cards: [
    cardRecord('card-plan', 'Plan the week', 'list-backlog', 0, { linkedTaskCount: 2 }),
    cardRecord('card-rent', 'Pay rent', 'list-backlog', 1),
    cardRecord('card-ship', 'Ship the board', 'list-doing', 0),
  ],
  properties: [],
};

const studiesBoard: BoardRecord = {
  board: { id: 'board-studies', name: 'Studies' },
  lists: [],
  cards: [],
  properties: [],
};

let serverBoards: BoardRecord[] = [];
let serverNotes = new Map<string, string>();
let serverTrackedEventCounts = new Map<string, number>();
let cardPatches: CardPatch[] = [];

const DEFAULT_NOTES = '## Outcome\nA calm week.\n';

const giveBoardProperties = () => {
  const projectValue: CardPropertyValue = {
    propertyId: 'property-project',
    optionId: 'option-daibx',
  };
  const hoursValue: CardPropertyValue = { propertyId: 'property-hours', number: '2.50' };
  serverBoards = serverBoards.map((boardRecord) =>
    boardRecord.board.id !== 'board-personal'
      ? boardRecord
      : {
          ...boardRecord,
          properties: [
            {
              id: 'property-project',
              name: 'Project',
              kind: BoardPropertyKind.Choice,
              position: 0,
              options: [
                { id: 'option-daibx', name: 'DaiBX', color: '#2f6fed', position: 0 },
                { id: 'option-home', name: 'Home', color: null, position: 1 },
              ],
            },
            {
              id: 'property-hours',
              name: 'Hours',
              kind: BoardPropertyKind.Number,
              position: 1,
              options: [],
            },
          ],
          cards: boardRecord.cards.map((card) =>
            card.id === 'card-plan'
              ? { ...card, values: [projectValue, hoursValue] }
              : card.id === 'card-ship'
                ? { ...card, values: [projectValue] }
                : card,
          ),
        },
  );
};

const serverBoardOf = (boardId: string) =>
  serverBoards.find((boardRecord) => boardRecord.board.id === boardId);

const boardHolding = (isHeld: (boardRecord: BoardRecord) => boolean) => {
  const heldBoard = serverBoards.find(isHeld);
  if (heldBoard === undefined) throw new Error('no board holds that');
  return heldBoard;
};

const answerChange = (boardRecord: BoardRecord, localChange: LocalBoardChange) => {
  const changedBoard = applyBoardChange(boardRecord, localChange);
  serverBoards = serverBoards.map((serverBoard) =>
    serverBoard.board.id === changedBoard.board.id ? changedBoard : serverBoard,
  );
  return HttpResponse.json(changedBoard);
};

const holdsCard = (cardId: string) => (boardRecord: BoardRecord) =>
  boardRecord.cards.some((card) => card.id === cardId);

const holdsList = (listId: string) => (boardRecord: BoardRecord) =>
  boardRecord.lists.some((listRecord) => listRecord.id === listId);

const holdsProperty = (propertyId: string) => (boardRecord: BoardRecord) =>
  boardRecord.properties.some((propertyRecord) => propertyRecord.id === propertyId);

const holdsOption = (optionId: string) => (boardRecord: BoardRecord) =>
  boardRecord.properties.some((propertyRecord) =>
    propertyRecord.options.some((optionRecord) => optionRecord.id === optionId),
  );

type CardPatch = {
  title?: string;
  notes?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  renameEvents?: boolean;
};

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/board');
  serverBoards = [structuredClone(personalBoard), structuredClone(studiesBoard)];
  serverNotes = new Map();
  serverTrackedEventCounts = new Map();
  cardPatches = [];
  let createdCount = 0;
  backendServer.use(
    http.get('/backend/categories', () => HttpResponse.json([])),
    http.get('/backend/boards', () =>
      HttpResponse.json(serverBoards.map((boardRecord): Board => boardRecord.board)),
    ),
    http.get('/backend/boards/:boardId', ({ params }) => {
      const boardRecord = serverBoardOf(String(params.boardId));
      return boardRecord === undefined
        ? HttpResponse.json({ error: 'not found' }, { status: 404 })
        : HttpResponse.json(boardRecord);
    }),
    http.post('/backend/boards', async ({ request }) => {
      const { name } = (await request.json()) as { name: string };
      const createdBoard: BoardRecord = {
        board: { id: 'board-new', name },
        lists: [],
        cards: [],
        properties: [],
      };
      serverBoards = [...serverBoards, createdBoard];
      return HttpResponse.json(createdBoard, { status: 201 });
    }),
    http.post('/backend/boards/:boardId/lists', async ({ params, request }) => {
      const { name } = (await request.json()) as { name: string };
      createdCount += 1;
      return answerChange(
        boardHolding((boardRecord) => boardRecord.board.id === params.boardId),
        {
          kind: 'addList',
          listRecord: { id: `list-created-${createdCount}`, name, position: 0, archiveAfter: null },
        },
      );
    }),
    http.post('/backend/lists/:listId/move', async ({ params, request }) => {
      const { position } = (await request.json()) as { position: number };
      const listId = String(params.listId);
      return answerChange(boardHolding(holdsList(listId)), { kind: 'moveList', listId, position });
    }),
    http.patch('/backend/lists/:listId', async ({ params, request }) => {
      const { name } = (await request.json()) as { name: string };
      const listId = String(params.listId);
      return answerChange(boardHolding(holdsList(listId)), {
        kind: 'renameList',
        listId,
        listName: name,
      });
    }),
    http.delete('/backend/lists/:listId', ({ params }) => {
      const listId = String(params.listId);
      return answerChange(boardHolding(holdsList(listId)), { kind: 'deleteList', listId });
    }),
    http.post('/backend/lists/:listId/cards', async ({ params, request }) => {
      const { title } = (await request.json()) as { title: string };
      const listId = String(params.listId);
      createdCount += 1;
      return answerChange(boardHolding(holdsList(listId)), {
        kind: 'addCard',
        cardRecord: cardRecord(`card-created-${createdCount}`, title, listId, 0),
      });
    }),
    http.get('/backend/lists/:listId/export', ({ params }) => {
      const listId = String(params.listId);
      const boardRecord = boardHolding(holdsList(listId));
      return HttpResponse.json({
        board: { name: boardRecord.board.name },
        list: { name: boardRecord.lists.find((listRecord) => listRecord.id === listId)?.name },
        cards: boardRecord.cards
          .filter((card) => card.listId === listId)
          .sort((firstCard, secondCard) => firstCard.position - secondCard.position)
          .map((card) => ({
            id: card.id,
            title: card.title,
            dueDate: card.dueDate,
            dueTime: card.dueTime,
            values: [],
            notes: serverNotes.get(card.id) ?? DEFAULT_NOTES,
          })),
      });
    }),
    http.get('/backend/cards/:cardId', ({ params }) => {
      const cardId = String(params.cardId);
      const card = boardHolding(holdsCard(cardId)).cards.find((cardItem) => cardItem.id === cardId);
      const cardDetail: CardDetailRecord = {
        card: card as BoardCardRecord,
        notes: serverNotes.get(cardId) ?? DEFAULT_NOTES,
        linkedTasks: [],
        trackedEventCount: serverTrackedEventCounts.get(cardId) ?? 0,
        schedules: [],
        triggers: { started: null, finished: null },
        archived: null,
      };
      return HttpResponse.json(cardDetail);
    }),
    http.patch('/backend/cards/:cardId', async ({ params, request }) => {
      const cardPatch = (await request.json()) as CardPatch;
      cardPatches.push(cardPatch);
      const { notes, ...cardChanges } = cardPatch;
      const cardId = String(params.cardId);
      if (notes !== undefined) serverNotes.set(cardId, notes);
      return answerChange(boardHolding(holdsCard(cardId)), {
        kind: 'updateCard',
        cardId,
        ...cardChanges,
      });
    }),
    http.put('/backend/cards/:cardId/values/:propertyId', async ({ params, request }) => {
      const cardValueInput = (await request.json()) as
        { optionId: string } | { text: string } | { number: string };
      const cardId = String(params.cardId);
      return answerChange(boardHolding(holdsCard(cardId)), {
        kind: 'setValue',
        cardId,
        cardValue: { propertyId: String(params.propertyId), ...cardValueInput },
      });
    }),
    http.delete('/backend/cards/:cardId/values/:propertyId', ({ params }) => {
      const cardId = String(params.cardId);
      return answerChange(boardHolding(holdsCard(cardId)), {
        kind: 'clearValue',
        cardId,
        propertyId: String(params.propertyId),
      });
    }),
    http.patch('/backend/boards/:boardId', async ({ params, request }) => {
      const { name } = (await request.json()) as { name: string };
      return answerChange(
        boardHolding((boardRecord) => boardRecord.board.id === params.boardId),
        { kind: 'renameBoard', boardName: name },
      );
    }),
    http.delete('/backend/boards/:boardId', ({ params }) => {
      serverBoards = serverBoards.filter((boardRecord) => boardRecord.board.id !== params.boardId);
      return HttpResponse.json({ status: 'deleted' });
    }),
    http.post('/backend/boards/:boardId/properties', async ({ params, request }) => {
      const newProperty = (await request.json()) as {
        name: string;
        kind: BoardPropertyKind;
        options?: { name: string; color?: string }[];
      };
      createdCount += 1;
      const propertyId = `property-created-${createdCount}`;
      return answerChange(
        boardHolding((boardRecord) => boardRecord.board.id === params.boardId),
        {
          kind: 'addProperty',
          propertyRecord: {
            id: propertyId,
            name: newProperty.name,
            kind: newProperty.kind,
            position: 0,
            options: (newProperty.options ?? []).map((newOption, position) => ({
              id: `${propertyId}-option-${position}`,
              name: newOption.name,
              color: newOption.color ?? null,
              position,
            })),
          },
        },
      );
    }),
    http.patch('/backend/properties/:propertyId', async ({ params, request }) => {
      const { name } = (await request.json()) as { name: string };
      const propertyId = String(params.propertyId);
      return answerChange(boardHolding(holdsProperty(propertyId)), {
        kind: 'renameProperty',
        propertyId,
        propertyName: name,
      });
    }),
    http.post('/backend/properties/:propertyId/move', async ({ params, request }) => {
      const { position } = (await request.json()) as { position: number };
      const propertyId = String(params.propertyId);
      return answerChange(boardHolding(holdsProperty(propertyId)), {
        kind: 'moveProperty',
        propertyId,
        position,
      });
    }),
    http.delete('/backend/properties/:propertyId', ({ params }) => {
      const propertyId = String(params.propertyId);
      return answerChange(boardHolding(holdsProperty(propertyId)), {
        kind: 'deleteProperty',
        propertyId,
      });
    }),
    http.post('/backend/properties/:propertyId/options', async ({ params, request }) => {
      const { name } = (await request.json()) as { name: string };
      const propertyId = String(params.propertyId);
      createdCount += 1;
      return answerChange(boardHolding(holdsProperty(propertyId)), {
        kind: 'addOption',
        propertyId,
        optionRecord: { id: `option-created-${createdCount}`, name, color: null, position: 0 },
      });
    }),
    http.patch('/backend/options/:optionId', async ({ params, request }) => {
      const { name, color } = (await request.json()) as { name?: string; color?: string | null };
      const optionId = String(params.optionId);
      return answerChange(boardHolding(holdsOption(optionId)), {
        kind: 'updateOption',
        optionId,
        ...(name === undefined ? {} : { optionName: name }),
        ...(color === undefined ? {} : { color }),
      });
    }),
    http.post('/backend/options/:optionId/move', async ({ params, request }) => {
      const { position } = (await request.json()) as { position: number };
      const optionId = String(params.optionId);
      return answerChange(boardHolding(holdsOption(optionId)), {
        kind: 'moveOption',
        optionId,
        position,
      });
    }),
    http.delete('/backend/options/:optionId', ({ params }) => {
      const optionId = String(params.optionId);
      return answerChange(boardHolding(holdsOption(optionId)), { kind: 'deleteOption', optionId });
    }),
    http.post('/backend/cards/:cardId/move', async ({ params, request }) => {
      const { listId, position } = (await request.json()) as { listId: string; position: number };
      const cardId = String(params.cardId);
      return answerChange(boardHolding(holdsCard(cardId)), {
        kind: 'moveCard',
        cardId,
        listId,
        position,
      });
    }),
    http.delete('/backend/cards/:cardId', ({ params }) => {
      const cardId = String(params.cardId);
      return answerChange(boardHolding(holdsCard(cardId)), { kind: 'deleteCard', cardId });
    }),
  );
});
afterEach(() => {
  routerReplace.mockReset();
  toast.dismiss();
});

const openBoardPage = async () => {
  const user = userEvent.setup();
  renderWithToaster(<BoardPage />);
  await screen.findByText('Plan the week');
  return user;
};

const column = (listName: string) => screen.getByRole('region', { name: listName });

const cardTitlesIn = (listName: string) =>
  within(column(listName))
    .queryAllByRole('listitem')
    .map((cardItem) =>
      cardItem.textContent?.replace(/Moves to .*$/, '').replace(/Tasks done: \d+\/\d+$/, ''),
    );

const listNames = () =>
  screen.getAllByRole('heading', { level: 2 }).map((listHeading) => listHeading.textContent);

const openCard = async (user: ReturnType<typeof userEvent.setup>, cardTitle: string) => {
  await user.click(screen.getByRole('button', { name: new RegExp(cardTitle) }));
  const cardDialog = screen.getByRole('dialog', { name: 'Card details', hidden: true });
  await within(cardDialog).findByText('A calm week.');
  return cardDialog;
};

test('opens the first board by name with its lists and cards in order', async () => {
  await openBoardPage();

  expect(screen.getByRole('button', { name: 'Board: Personal. Switch board' })).toBeVisible();
  expect(listNames()).toEqual(['Backlog', 'Doing', 'Done']);
  expect(cardTitlesIn('Backlog')).toEqual(['Plan the week', 'Pay rent']);
  expect(window.localStorage.getItem('daibx:last-board-id')).toBe('board-personal');
});

test('opens the board named in the address, then the last one used', async () => {
  window.history.replaceState(null, '', '/board?board=board-studies');
  const { unmount } = renderWithToaster(<BoardPage />);

  expect(await screen.findByText('This board has no lists')).toBeInTheDocument();
  unmount();
  window.history.replaceState(null, '', '/board');
  renderWithToaster(<BoardPage />);

  expect(await screen.findByText('This board has no lists')).toBeInTheDocument();
});

test('switching boards opens the chosen one and puts it in the address', async () => {
  const user = await openBoardPage();

  await user.click(screen.getByRole('menuitem', { name: 'Studies', hidden: true }));

  expect(await screen.findByText('This board has no lists')).toBeInTheDocument();
  expect(routerReplace).toHaveBeenCalledWith('/board?board=board-studies', { scroll: false });
});

test('with no boards it offers to make one, and the new board opens empty', async () => {
  serverBoards = [];
  const user = userEvent.setup();
  renderWithToaster(<BoardPage />);

  await user.click(await screen.findByRole('button', { name: 'New board' }));
  const newBoardDialog = screen.getByRole('dialog', { name: 'New board', hidden: true });
  await user.type(
    within(newBoardDialog).getByRole('textbox', { name: 'Name', hidden: true }),
    'Work',
  );
  await user.click(
    within(newBoardDialog).getByRole('button', { name: 'Create board', hidden: true }),
  );

  expect(await screen.findByText('This board has no lists')).toBeInTheDocument();
  expect(routerReplace).toHaveBeenCalledWith('/board?board=board-new', { scroll: false });
});

test('adding a list puts it at the end', async () => {
  const user = await openBoardPage();
  await user.click(screen.getByRole('button', { name: 'New list' }));
  const newListDialog = screen.getByRole('dialog', { name: 'New list', hidden: true });

  await user.type(
    within(newListDialog).getByRole('textbox', { name: 'Name', hidden: true }),
    'Someday',
  );
  await user.click(within(newListDialog).getByRole('button', { name: 'Add list', hidden: true }));

  await waitFor(() => expect(listNames()).toEqual(['Backlog', 'Doing', 'Done', 'Someday']));
});

test('a card added to a list shows at once and stays after the server answers', async () => {
  const user = await openBoardPage();

  await user.click(within(column('Doing')).getByRole('button', { name: 'Add a card' }));
  await user.type(
    within(column('Doing')).getByRole('textbox', { name: 'New card title in Doing' }),
    'Write the changelog{Enter}',
  );

  expect(cardTitlesIn('Doing')).toEqual(['Ship the board', 'Write the changelog']);
  await waitFor(() =>
    expect(serverBoardOf('board-personal')?.cards.map((card) => card.title)).toContain(
      'Write the changelog',
    ),
  );
  expect(cardTitlesIn('Doing')).toEqual(['Ship the board', 'Write the changelog']);
});

test('Move to… sends a card to another list at the chosen spot', async () => {
  const user = await openBoardPage();
  await openCard(user, 'Plan the week');
  await user.click(screen.getByRole('button', { name: 'Move to…', hidden: true }));
  const moveDialog = screen.getByRole('dialog', { name: 'Move Plan the week', hidden: true });
  await user.click(within(moveDialog).getByRole('radio', { name: 'Done', hidden: true }));
  await user.click(within(moveDialog).getByRole('button', { name: 'Move card', hidden: true }));

  expect(cardTitlesIn('Done')).toEqual(['Plan the week']);
  expect(cardTitlesIn('Backlog')).toEqual(['Pay rent']);
  await waitFor(() =>
    expect(
      serverBoardOf('board-personal')?.cards.find((card) => card.id === 'card-plan')?.listId,
    ).toBe('list-done'),
  );
});

test('a failed move puts the card back and says why', async () => {
  backendServer.use(
    http.post('/backend/cards/card-plan/move', () =>
      HttpResponse.json({ error: 'internal server error' }, { status: 500 }),
    ),
  );
  const user = await openBoardPage();
  await openCard(user, 'Plan the week');
  await user.click(screen.getByRole('button', { name: 'Move to…', hidden: true }));
  const moveDialog = screen.getByRole('dialog', { name: 'Move Plan the week', hidden: true });
  await user.click(within(moveDialog).getByRole('radio', { name: 'Done', hidden: true }));
  await user.click(within(moveDialog).getByRole('button', { name: 'Move card', hidden: true }));

  expect(await screen.findByText('Something broke on our side')).toBeInTheDocument();
  expect(cardTitlesIn('Backlog')).toEqual(['Plan the week', 'Pay rent']);
  expect(cardTitlesIn('Done')).toEqual([]);
});

test('dragging a card onto another card takes that card’s place', async () => {
  await openBoardPage();
  const draggedTile = within(column('Backlog')).getByRole('button', { name: /Pay rent/ });
  const targetTile = within(column('Doing')).getByRole('button', { name: /Ship the board/ });
  const carriedData = new Map<string, string>();
  const dataTransfer = {
    types: [] as string[],
    setData: (dataType: string, dataValue: string) => {
      carriedData.set(dataType, dataValue);
      dataTransfer.types = [...carriedData.keys()];
    },
    getData: (dataType: string) => carriedData.get(dataType) ?? '',
    dropEffect: 'none',
    effectAllowed: 'all',
  };

  fireEvent.dragStart(draggedTile, { dataTransfer });
  fireEvent.dragOver(targetTile, { dataTransfer });
  fireEvent.drop(targetTile, { dataTransfer });

  expect(cardTitlesIn('Doing')).toEqual(['Pay rent', 'Ship the board']);
  await waitFor(() =>
    expect(
      serverBoardOf('board-personal')?.cards.find((card) => card.id === 'card-rent'),
    ).toMatchObject({ listId: 'list-doing', position: 0 }),
  );
});

test('renaming a card from its title saves the new title', async () => {
  const user = await openBoardPage();
  const cardDialog = await openCard(user, 'Plan the week');
  const titleBox = within(cardDialog).getByRole('textbox', { name: 'Card title', hidden: true });

  await user.clear(titleBox);
  await user.type(titleBox, 'Plan next week{Enter}');

  expect(await within(column('Backlog')).findByText('Plan next week')).toBeInTheDocument();
  await waitFor(() =>
    expect(
      serverBoardOf('board-personal')?.cards.find((card) => card.id === 'card-plan')?.title,
    ).toBe('Plan next week'),
  );
});

describe('renaming a card with tracked time asks about its calendar events', () => {
  beforeEach(() => {
    serverTrackedEventCounts.set('card-plan', 1);
  });

  const renamePlanCard = async (user: ReturnType<typeof userEvent.setup>) => {
    const cardDialog = await openCard(user, 'Plan the week');
    const titleBox = within(cardDialog).getByRole('textbox', { name: 'Card title', hidden: true });
    await user.clear(titleBox);
    await user.type(titleBox, 'Plan next week{Enter}');
    return {
      cardDialog,
      renameDialog: screen.getByRole('dialog', { name: 'Rename 1 calendar event too?' }),
    };
  };

  test('Rename all renames its events too', async () => {
    const user = await openBoardPage();
    const { renameDialog } = await renamePlanCard(user);

    expect(within(renameDialog).getByRole('button', { name: 'Rename all' })).toHaveFocus();
    await user.click(within(renameDialog).getByRole('button', { name: 'Rename all' }));

    expect(await within(column('Backlog')).findByText('Plan next week')).toBeInTheDocument();
    expect(cardPatches).toEqual([{ title: 'Plan next week', renameEvents: true }]);
  });

  test('Keep old names renames only the card', async () => {
    const user = await openBoardPage();
    const { renameDialog } = await renamePlanCard(user);

    await user.click(within(renameDialog).getByRole('button', { name: 'Keep old names' }));

    expect(await within(column('Backlog')).findByText('Plan next week')).toBeInTheDocument();
    expect(cardPatches).toEqual([{ title: 'Plan next week', renameEvents: false }]);
  });

  test('Esc puts the old title back', async () => {
    const user = await openBoardPage();
    const { cardDialog } = await renamePlanCard(user);

    await user.keyboard('{Escape}');

    expect(
      within(cardDialog).getByRole('textbox', { name: 'Card title', hidden: true }),
    ).toHaveValue('Plan the week');
    expect(cardPatches).toEqual([]);
  });
});

test('Start in the card detail runs the card and turns into Running', async () => {
  let startedCardId: string | null = null;
  backendServer.use(
    http.get('/backend/tracking/running', () => HttpResponse.json([])),
    http.get('/backend/account/time-tracking', () =>
      HttpResponse.json({
        checkInsEnabled: true,
        checkInIntervalMinutes: 30,
        firstCheckInMinutes: 30,
        workingHoursStart: '16:00',
        workingHoursEnd: '02:00',
        trackedCategoryId: null,
        calendarTimeZone: null,
      }),
    ),
    http.post('/backend/cards/:cardId/start', ({ params }) => {
      startedCardId = String(params.cardId);
      const startedRecord: RunningItemRecord = {
        id: 'event-plan',
        kind: 'tracked',
        title: 'Plan the week',
        categoryId: null,
        startsAt: new Date().toISOString(),
        endsAt: null,
        finishedAt: null,
        lastAnsweredAt: null,
        timeZone: null,
        series: null,
        source: { kind: 'card', id: startedCardId, boardId: 'board-personal' },
        estimateMinutes: null,
        sourceName: 'Personal',
      };
      return HttpResponse.json(startedRecord, { status: 201 });
    }),
  );
  const user = userEvent.setup();
  renderWithToaster(
    <TrackingProvider>
      <BoardPage />
    </TrackingProvider>,
  );
  await screen.findByText('Plan the week');
  const cardDialog = await openCard(user, 'Plan the week');

  await user.click(
    within(cardDialog).getByRole('button', { name: 'Start Plan the week', hidden: true }),
  );

  expect(
    await within(cardDialog).findByRole('button', {
      name: 'Plan the week is running: show what’s running',
      hidden: true,
    }),
  ).toBeInTheDocument();
  expect(startedCardId).toBe('card-plan');
});

test('Add schedule fills in the schedule form only once it is opened', async () => {
  const user = await openBoardPage();
  const cardDialog = await openCard(user, 'Plan the week');
  expect(screen.queryByLabelText('Move to')).not.toBeInTheDocument();

  await user.click(within(cardDialog).getByRole('button', { name: 'Add schedule', hidden: true }));

  const scheduleDialog = screen.getByRole('dialog', { name: 'Add schedule', hidden: true });
  expect(within(scheduleDialog).getByText('Plan the week')).toBeInTheDocument();
  expect(within(scheduleDialog).getByLabelText('Move to')).toBeInTheDocument();
  expect(within(scheduleDialog).getByLabelText('Time zone')).toBeInTheDocument();
});

test('deleting a card says what goes with it and removes it', async () => {
  const user = await openBoardPage();
  const cardDialog = await openCard(user, 'Plan the week');
  await user.click(within(cardDialog).getByRole('button', { name: 'Delete card', hidden: true }));
  const deleteDialog = screen.getByRole('dialog', {
    name: 'Delete “Plan the week”?',
    hidden: true,
  });

  expect(within(deleteDialog).getByText(/Its 2 tasks stay on the Tasks page/)).toBeInTheDocument();
  await user.click(within(deleteDialog).getByRole('button', { name: 'Delete card', hidden: true }));

  expect(cardTitlesIn('Backlog')).toEqual(['Pay rent']);
});

test('moving a list right from its menu swaps it with its neighbour', async () => {
  const user = await openBoardPage();

  await user.click(
    within(column('Backlog')).getByRole('menuitem', { name: 'Move right', hidden: true }),
  );

  expect(listNames()).toEqual(['Doing', 'Backlog', 'Done']);
  await waitFor(() =>
    expect(
      serverBoardOf('board-personal')?.lists.find((list) => list.id === 'list-backlog')?.position,
    ).toBe(1),
  );
});

test('renaming a list from its menu saves the name', async () => {
  const user = await openBoardPage();
  await user.click(within(column('Doing')).getByRole('menuitem', { name: 'Rename', hidden: true }));
  const renameDialog = screen.getByRole('dialog', { name: 'Rename list', hidden: true });
  const nameBox = within(renameDialog).getByRole('textbox', { name: 'Name', hidden: true });

  expect(nameBox).toHaveValue('Doing');
  await user.clear(nameBox);
  await user.type(nameBox, 'Now');
  await user.click(within(renameDialog).getByRole('button', { name: 'Save name', hidden: true }));

  expect(listNames()).toEqual(['Backlog', 'Now', 'Done']);
});

test('deleting a list counts its cards and removes them with it', async () => {
  const user = await openBoardPage();
  await user.click(
    within(column('Backlog')).getByRole('menuitem', { name: 'Delete list', hidden: true }),
  );
  const deleteDialog = screen.getByRole('dialog', {
    name: 'Delete the “Backlog” list?',
    hidden: true,
  });

  expect(
    within(deleteDialog).getByText(/All 2 of its cards are deleted with it/),
  ).toBeInTheDocument();
  await user.click(
    within(deleteDialog).getByRole('button', { name: 'Delete list and cards', hidden: true }),
  );

  expect(listNames()).toEqual(['Doing', 'Done']);
  expect(screen.queryByText('Plan the week')).not.toBeInTheDocument();
});

const openBoardSettings = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Board settings' }));
  return screen.getByRole('dialog', { name: 'Board settings', hidden: true });
};

const serverCard = (cardId: string) =>
  serverBoardOf('board-personal')?.cards.find((card) => card.id === cardId);

test('choice values show as chips on tiles, while text and numbers stay in the card', async () => {
  giveBoardProperties();
  const user = await openBoardPage();

  expect(within(column('Backlog')).getByTitle('Project: DaiBX')).toBeInTheDocument();
  expect(within(column('Backlog')).queryByText('2.50')).not.toBeInTheDocument();
  const cardDialog = await openCard(user, 'Plan the week');

  expect(within(cardDialog).getByRole('textbox', { name: 'Hours', hidden: true })).toHaveValue(
    '2.50',
  );
  expect(within(cardDialog).getByRole('combobox', { name: 'Project', hidden: true })).toHaveValue(
    'option-daibx',
  );
});

test('choosing an option in the card puts its chip on the tile and saves it', async () => {
  giveBoardProperties();
  const user = await openBoardPage();
  const cardDialog = await openCard(user, 'Pay rent');

  await user.selectOptions(
    within(cardDialog).getByRole('combobox', { name: 'Project', hidden: true }),
    'Home',
  );

  expect(within(column('Backlog')).getByTitle('Project: Home')).toBeInTheDocument();
  await waitFor(() =>
    expect(serverCard('card-rent')?.values).toEqual([
      { propertyId: 'property-project', optionId: 'option-home' },
    ]),
  );
});

test('a number that isn’t one is refused and the old value stays', async () => {
  giveBoardProperties();
  const user = await openBoardPage();
  const cardDialog = await openCard(user, 'Plan the week');
  const hoursBox = within(cardDialog).getByRole('textbox', { name: 'Hours', hidden: true });

  await user.clear(hoursBox);
  await user.type(hoursBox, 'two{Enter}');

  expect(await screen.findByText('Check the number')).toBeInTheDocument();
  expect(hoursBox).toHaveValue('2.50');
  expect(serverCard('card-plan')?.values).toContainEqual({
    propertyId: 'property-hours',
    number: '2.50',
  });
});

test('clearing a number field clears the value', async () => {
  giveBoardProperties();
  const user = await openBoardPage();
  const cardDialog = await openCard(user, 'Plan the week');

  await user.clear(within(cardDialog).getByRole('textbox', { name: 'Hours', hidden: true }));
  await user.tab();

  await waitFor(() =>
    expect(serverCard('card-plan')?.values).toEqual([
      { propertyId: 'property-project', optionId: 'option-daibx' },
    ]),
  );
});

test('a due time waits for a date, and clearing the date clears both', async () => {
  const user = await openBoardPage();
  const cardDialog = await openCard(user, 'Plan the week');
  const dueTimeBox = within(cardDialog).getByLabelText('Due time, optional');

  expect(dueTimeBox).toBeDisabled();
  fireEvent.change(within(cardDialog).getByLabelText('Due'), { target: { value: '2026-11-20' } });
  await waitFor(() => expect(serverCard('card-plan')?.dueDate).toBe('2026-11-20'));
  const enabledTimeBox = within(cardDialog).getByLabelText('Due time, optional');
  expect(enabledTimeBox).toBeEnabled();
  fireEvent.change(enabledTimeBox, { target: { value: '09:30' } });
  await waitFor(() => expect(serverCard('card-plan')?.dueTime).toBe('09:30'));
  await user.click(
    within(cardDialog).getByRole('button', { name: 'Clear due date', hidden: true }),
  );

  await waitFor(() =>
    expect(serverCard('card-plan')).toMatchObject({ dueDate: null, dueTime: null }),
  );
});

test('notes save from Edit/Done and render markup as text with safe links', async () => {
  const user = await openBoardPage();
  const cardDialog = await openCard(user, 'Plan the week');
  await user.click(within(cardDialog).getByRole('button', { name: 'Edit', hidden: true }));
  const notesBox = within(cardDialog).getByRole('textbox', {
    name: 'Notes, in Markdown',
    hidden: true,
  });

  await user.clear(notesBox);
  fireEvent.change(notesBox, {
    target: {
      value:
        '<script>alert(1)</script>\n\nSee <img src=x onerror=alert(2)> and [the docs](https://example.com)',
    },
  });
  await user.click(within(cardDialog).getByRole('button', { name: 'Done', hidden: true }));

  const docsLink = await within(cardDialog).findByRole('link', { name: 'the docs', hidden: true });
  expect(docsLink).toHaveAttribute('target', '_blank');
  expect(docsLink).toHaveAttribute('rel', 'noopener noreferrer');
  expect(within(cardDialog).getByText(/<script>alert\(1\)<\/script>/)).toBeInTheDocument();
  expect(cardDialog.querySelector('script, img')).toBeNull();
  expect(serverNotes.get('card-plan')).toMatch(/^<script>/);
});

test('deleting an option counts its cards and clears it from them', async () => {
  giveBoardProperties();
  const user = await openBoardPage();
  const settingsDialog = await openBoardSettings(user);
  await user.click(
    within(settingsDialog).getByRole('button', { name: 'Edit Project', hidden: true }),
  );
  const propertyDialog = screen.getByRole('dialog', { name: 'Edit Project', hidden: true });
  await user.click(
    within(propertyDialog).getByRole('button', { name: 'Delete option DaiBX', hidden: true }),
  );
  const deleteDialog = screen.getByRole('dialog', {
    name: 'Delete the “DaiBX” option?',
    hidden: true,
  });

  expect(within(deleteDialog).getByText(/It’s cleared from the 2 cards that use it/)).toBeVisible();
  await user.click(
    within(deleteDialog).getByRole('button', { name: 'Delete option', hidden: true }),
  );

  expect(screen.queryByTitle('Project: DaiBX')).not.toBeInTheDocument();
  await waitFor(() =>
    expect(serverCard('card-plan')?.values).toEqual([
      { propertyId: 'property-hours', number: '2.50' },
    ]),
  );
});

test('a new choice property is created with its options from Board settings', async () => {
  const user = await openBoardPage();
  const settingsDialog = await openBoardSettings(user);
  await user.click(
    within(settingsDialog).getByRole('button', { name: 'Add property', hidden: true }),
  );
  const newPropertyDialog = screen.getByRole('dialog', { name: 'New property', hidden: true });

  await user.type(
    within(newPropertyDialog).getByRole('textbox', { name: 'Name', hidden: true }),
    'Size',
  );
  await user.type(
    within(newPropertyDialog).getByRole('textbox', { name: 'Option 1 name', hidden: true }),
    'Small',
  );
  await user.click(
    within(newPropertyDialog).getByRole('button', { name: 'Add option', hidden: true }),
  );
  await user.type(
    within(newPropertyDialog).getByRole('textbox', { name: 'Option 2 name', hidden: true }),
    'Large',
  );
  await user.click(
    within(newPropertyDialog).getByRole('button', { name: 'Create property', hidden: true }),
  );

  expect(await within(settingsDialog).findByText('Size')).toBeInTheDocument();
  expect(
    serverBoardOf('board-personal')?.properties[0]?.options.map((option) => option.name),
  ).toEqual(['Small', 'Large']);
});

test('renaming the board in settings renames it in the switcher', async () => {
  const user = await openBoardPage();
  const settingsDialog = await openBoardSettings(user);
  const nameBox = within(settingsDialog).getByRole('textbox', { name: 'Name', hidden: true });

  await user.clear(nameBox);
  await user.type(nameBox, 'Home{Enter}');

  expect(
    await screen.findByRole('button', { name: 'Board: Home. Switch board' }),
  ).toBeInTheDocument();
  expect(serverBoardOf('board-personal')?.board.name).toBe('Home');
});

test('deleting the board opens the next one', async () => {
  const user = await openBoardPage();
  const settingsDialog = await openBoardSettings(user);
  await user.click(
    within(settingsDialog).getByRole('button', { name: 'Delete board', hidden: true }),
  );
  const deleteDialog = screen.getByRole('dialog', {
    name: 'Delete the “Personal” board?',
    hidden: true,
  });
  await user.click(
    within(deleteDialog).getByRole('button', { name: 'Delete board', hidden: true }),
  );

  expect(await screen.findByText('This board has no lists')).toBeInTheDocument();
  expect(routerReplace).toHaveBeenCalledWith('/board?board=board-studies', { scroll: false });
  expect(serverBoardOf('board-personal')).toBeUndefined();
});

test('Copy for planning puts the list on the clipboard as Markdown', async () => {
  const user = await openBoardPage();

  await user.click(
    within(column('Backlog')).getByRole('menuitem', { name: 'Copy for planning', hidden: true }),
  );

  expect(await screen.findByText('List copied')).toBeInTheDocument();
  expect(await navigator.clipboard.readText()).toBe(
    [
      'List: Backlog · Board: Personal',
      '---\n# Plan the week\n- Card: card-plan\n## Outcome\nA calm week.',
      '---\n# Pay rent\n- Card: card-rent\n## Outcome\nA calm week.',
    ].join('\n\n') + '\n',
  );
});

test('a failed Copy for planning says why', async () => {
  backendServer.use(
    http.get('/backend/lists/:listId/export', () =>
      HttpResponse.json({ error: 'internal server error' }, { status: 500 }),
    ),
  );
  const user = await openBoardPage();

  await user.click(
    within(column('Backlog')).getByRole('menuitem', { name: 'Copy for planning', hidden: true }),
  );

  expect(await screen.findByText('Something broke on our side')).toBeInTheDocument();
});

test('a card named in the address opens with the board', async () => {
  window.history.replaceState(null, '', '/board?board=board-personal&card=card-rent');
  renderWithToaster(<BoardPage />);

  const cardDialog = await screen.findByRole('dialog', { name: 'Card details', hidden: true });
  expect(
    await within(cardDialog).findByRole('textbox', { name: 'Card title', hidden: true }),
  ).toHaveValue('Pay rent');
  expect(cardDialog).toHaveStyle({ display: 'block' });
  expect(routerReplace).toHaveBeenCalledWith('/board?board=board-personal', { scroll: false });
});

describe('card schedules', () => {
  const weeklyOnMonday: RepeatRule = {
    frequency: 'weekly',
    interval: 1,
    weekdays: ['mon'],
    ends: { never: true },
  };
  const NEXT_RUN_AT = '2027-01-05T02:00:00.000Z';

  let serverSchedules = new Map<string, CardScheduleRecord[]>();
  let serverRuns = new Map<string, ScheduleRunRecord[]>();
  let scheduleWrites: { path: string; body: unknown }[] = [];

  const scheduleRecord = (
    id: string,
    overrides: Partial<CardScheduleRecord> = {},
  ): CardScheduleRecord => ({
    id,
    kind: 'repeating',
    targetListId: 'list-doing',
    targetListName: 'Doing',
    start: '2026-11-16T18:00',
    startsAt: '2026-11-17T02:00:00.000Z',
    timeZone: 'America/Los_Angeles',
    repeat: weeklyOnMonday,
    block: null,
    paused: false,
    nextRunAt: NEXT_RUN_AT,
    ...overrides,
  });

  const syncNextMoves = () => {
    serverBoards = serverBoards.map((boardRecord) => ({
      ...boardRecord,
      cards: boardRecord.cards.map((card) => {
        const activeSchedule = (serverSchedules.get(card.id) ?? []).find(
          (schedule) =>
            !schedule.paused && schedule.nextRunAt !== null && schedule.targetListName !== null,
        );
        return {
          ...card,
          nextMove:
            activeSchedule?.nextRunAt == null || activeSchedule.targetListName === null
              ? null
              : { at: activeSchedule.nextRunAt, listName: activeSchedule.targetListName },
        };
      }),
    }));
  };

  const cardIdOfSchedule = (scheduleId: string) => {
    const cardEntry = [...serverSchedules].find(([, schedules]) =>
      schedules.some((schedule) => schedule.id === scheduleId),
    );
    if (cardEntry === undefined) throw new Error('no card has that schedule');
    return cardEntry[0];
  };

  const listNameOf = (listId: string) =>
    serverBoardOf('board-personal')?.lists.find((listRecord) => listRecord.id === listId)?.name ??
    null;

  const changeSchedule = (
    scheduleId: string,
    makeChange: (schedule: CardScheduleRecord) => CardScheduleRecord,
  ) => {
    const cardId = cardIdOfSchedule(scheduleId);
    const changedSchedules = (serverSchedules.get(cardId) ?? []).map((schedule) =>
      schedule.id === scheduleId ? makeChange(schedule) : schedule,
    );
    serverSchedules.set(cardId, changedSchedules);
    syncNextMoves();
    return { cardId, changedSchedules };
  };

  const answerOneSchedule = (scheduleId: string, isPaused: boolean) => {
    const { changedSchedules } = changeSchedule(scheduleId, (schedule) => ({
      ...schedule,
      paused: isPaused,
    }));
    return HttpResponse.json(changedSchedules.find((schedule) => schedule.id === scheduleId));
  };

  type ScheduleBody = {
    kind: 'once' | 'repeating';
    targetListId: string;
    start: string;
    timeZone: string;
    repeat?: RepeatRule;
    block: CardScheduleRecord['block'];
  };

  const fromBody = (scheduleBody: ScheduleBody): Partial<CardScheduleRecord> => ({
    kind: scheduleBody.kind,
    targetListId: scheduleBody.targetListId,
    targetListName: listNameOf(scheduleBody.targetListId),
    start: scheduleBody.start,
    timeZone: scheduleBody.timeZone,
    repeat: scheduleBody.repeat ?? null,
    block: scheduleBody.block,
  });

  beforeEach(() => {
    serverSchedules = new Map([['card-rent', [scheduleRecord('schedule-rent')]]]);
    serverRuns = new Map();
    scheduleWrites = [];
    syncNextMoves();
    let createdScheduleCount = 0;
    backendServer.use(
      http.get('/backend/cards/:cardId', ({ params }) => {
        const cardId = String(params.cardId);
        const card = boardHolding(holdsCard(cardId)).cards.find(
          (cardItem) => cardItem.id === cardId,
        );
        const cardDetail: CardDetailRecord = {
          card: card as BoardCardRecord,
          notes: DEFAULT_NOTES,
          linkedTasks: [],
          trackedEventCount: 0,
          schedules: serverSchedules.get(cardId) ?? [],
          triggers: { started: null, finished: null },
          archived: null,
        };
        return HttpResponse.json(cardDetail);
      }),
      http.post('/backend/cards/:cardId/schedules', async ({ params, request }) => {
        const scheduleBody = (await request.json()) as ScheduleBody;
        const cardId = String(params.cardId);
        scheduleWrites.push({ path: `/cards/${cardId}/schedules`, body: scheduleBody });
        createdScheduleCount += 1;
        serverSchedules.set(cardId, [
          ...(serverSchedules.get(cardId) ?? []),
          scheduleRecord(`schedule-created-${createdScheduleCount}`, fromBody(scheduleBody)),
        ]);
        syncNextMoves();
        return HttpResponse.json({ schedules: serverSchedules.get(cardId) }, { status: 201 });
      }),
      http.patch('/backend/schedules/:scheduleId', async ({ params, request }) => {
        const scheduleBody = (await request.json()) as ScheduleBody;
        const scheduleId = String(params.scheduleId);
        scheduleWrites.push({ path: `/schedules/${scheduleId}`, body: scheduleBody });
        const { changedSchedules } = changeSchedule(scheduleId, (schedule) => ({
          ...schedule,
          ...fromBody(scheduleBody),
        }));
        return HttpResponse.json({ schedules: changedSchedules });
      }),
      http.delete('/backend/schedules/:scheduleId', ({ params }) => {
        const scheduleId = String(params.scheduleId);
        const cardId = cardIdOfSchedule(scheduleId);
        serverSchedules.set(
          cardId,
          (serverSchedules.get(cardId) ?? []).filter((schedule) => schedule.id !== scheduleId),
        );
        syncNextMoves();
        return HttpResponse.json({ schedules: serverSchedules.get(cardId) });
      }),
      http.post('/backend/schedules/:scheduleId/pause', ({ params }) =>
        answerOneSchedule(String(params.scheduleId), true),
      ),
      http.post('/backend/schedules/:scheduleId/resume', ({ params }) =>
        answerOneSchedule(String(params.scheduleId), false),
      ),
      http.post('/backend/schedules/:scheduleId/run-now', ({ params }) => {
        const scheduleId = String(params.scheduleId);
        const cardId = cardIdOfSchedule(scheduleId);
        const ranSchedule = serverSchedules
          .get(cardId)
          ?.find((schedule) => schedule.id === scheduleId) as CardScheduleRecord;
        const movedBoard = applyBoardChange(boardHolding(holdsCard(cardId)), {
          kind: 'moveCard',
          cardId,
          listId: ranSchedule.targetListId as string,
          position: 0,
        });
        serverBoards = serverBoards.map((boardRecord) =>
          boardRecord.board.id === movedBoard.board.id ? movedBoard : boardRecord,
        );
        syncNextMoves();
        return HttpResponse.json(ranSchedule);
      }),
      http.get('/backend/schedules/:scheduleId/runs', ({ params }) =>
        HttpResponse.json(serverRuns.get(String(params.scheduleId)) ?? []),
      ),
    );
  });

  const scheduleMenu = async (
    user: ReturnType<typeof userEvent.setup>,
    cardDialog: HTMLElement,
  ) => {
    await user.click(
      await within(cardDialog).findByRole('button', {
        name: 'Actions for this schedule',
        hidden: true,
      }),
    );
    return screen.getByRole('menu', { name: 'Schedule actions', hidden: true });
  };

  test('a new repeating schedule is sent in its zone and shows on the card and its tile', async () => {
    const user = await openBoardPage();
    const cardDialog = await openCard(user, 'Plan the week');

    await user.click(
      within(cardDialog).getByRole('button', { name: 'Add schedule', hidden: true }),
    );
    const scheduleDialog = screen.getByRole('dialog', { name: 'Add schedule', hidden: true });
    await user.click(
      within(scheduleDialog).getByRole('radio', { name: 'Repeating', hidden: true }),
    );
    await user.selectOptions(within(scheduleDialog).getByLabelText('Move to'), 'Done');
    fireEvent.change(within(scheduleDialog).getByLabelText('First date'), {
      target: { value: '2026-11-16' },
    });
    fireEvent.change(within(scheduleDialog).getByLabelText('Time'), {
      target: { value: '18:00' },
    });
    await user.click(
      within(scheduleDialog).getByRole('button', { name: 'Add schedule', hidden: true }),
    );

    expect(await within(cardDialog).findByText('Weekly on Monday · 18:00')).toBeInTheDocument();
    expect(scheduleWrites).toEqual([
      {
        path: '/cards/card-plan/schedules',
        body: {
          kind: 'repeating',
          targetListId: 'list-done',
          start: '2026-11-16T18:00',
          inputZone: 'America/Los_Angeles',
          timeZone: 'America/Los_Angeles',
          repeat: weeklyOnMonday,
          block: null,
        },
      },
    ]);
    expect(await within(column('Backlog')).findByText(/Moves to Done/)).toBeInTheDocument();
  });

  test('a one-time move in the past is refused before it is sent', async () => {
    const user = await openBoardPage();
    const cardDialog = await openCard(user, 'Plan the week');

    await user.click(
      within(cardDialog).getByRole('button', { name: 'Add schedule', hidden: true }),
    );
    const scheduleDialog = screen.getByRole('dialog', { name: 'Add schedule', hidden: true });
    fireEvent.change(within(scheduleDialog).getByLabelText('Date'), {
      target: { value: '2020-01-06' },
    });
    await user.click(
      within(scheduleDialog).getByRole('button', { name: 'Add schedule', hidden: true }),
    );

    expect(await screen.findByText('Pick a later time')).toBeInTheDocument();
    expect(scheduleWrites).toEqual([]);
  });

  test('Run now moves the card to the top of its column and keeps the next run', async () => {
    const user = await openBoardPage();
    const cardDialog = await openCard(user, 'Pay rent');

    const actionsMenu = await scheduleMenu(user, cardDialog);
    await user.click(within(actionsMenu).getByRole('menuitem', { name: 'Run now', hidden: true }));

    expect(await screen.findByText('Moved to Doing')).toBeInTheDocument();
    await waitFor(() => expect(cardTitlesIn('Doing')).toEqual(['Pay rent', 'Ship the board']));
    expect(within(cardDialog).getByText(/^Next/)).toBeInTheDocument();
  });

  test('pausing hides the next run and the tile clock, and resuming brings them back', async () => {
    const user = await openBoardPage();
    expect(within(column('Backlog')).getByText(/Moves to Doing/)).toBeInTheDocument();
    const cardDialog = await openCard(user, 'Pay rent');

    await user.click(
      within(await scheduleMenu(user, cardDialog)).getByRole('menuitem', {
        name: 'Pause',
        hidden: true,
      }),
    );

    expect(await within(cardDialog).findByText('Paused')).toBeInTheDocument();
    expect(within(cardDialog).queryByText(/^Next/)).not.toBeInTheDocument();
    await waitFor(() =>
      expect(within(column('Backlog')).queryByText(/Moves to Doing/)).not.toBeInTheDocument(),
    );

    await user.click(
      within(await scheduleMenu(user, cardDialog)).getByRole('menuitem', {
        name: 'Resume',
        hidden: true,
      }),
    );

    await waitFor(() => expect(within(cardDialog).queryByText('Paused')).not.toBeInTheDocument());
    expect(await within(column('Backlog')).findByText(/Moves to Doing/)).toBeInTheDocument();
  });

  test('a schedule whose column was deleted is flagged until another column is picked', async () => {
    serverSchedules.set('card-plan', [
      scheduleRecord('schedule-orphan', {
        targetListId: null,
        targetListName: null,
        paused: true,
        nextRunAt: null,
      }),
    ]);
    const user = await openBoardPage();
    const cardDialog = await openCard(user, 'Plan the week');
    const scheduleSection = within(cardDialog).getByRole('region', {
      name: 'Schedule',
      hidden: true,
    });

    expect(
      await within(scheduleSection).findByText('Its column was deleted. Pick another.'),
    ).toBeInTheDocument();
    await user.click(
      within(cardDialog).getByRole('button', { name: 'Pick a column', hidden: true }),
    );
    const scheduleDialog = screen.getByRole('dialog', { name: 'Edit schedule', hidden: true });
    await user.selectOptions(within(scheduleDialog).getByLabelText('Move to'), 'Done');
    await user.click(within(scheduleDialog).getByRole('button', { name: 'Save', hidden: true }));

    await waitFor(() =>
      expect(
        within(scheduleSection).queryByText('Its column was deleted. Pick another.'),
      ).not.toBeInTheDocument(),
    );
    expect(
      within(cardDialog).getByText(
        (_, element) =>
          element?.tagName === 'P' && element.textContent?.startsWith('Move to Done') === true,
      ),
    ).toBeInTheDocument();
    expect(scheduleWrites[0]).toMatchObject({
      path: '/schedules/schedule-orphan',
      body: { targetListId: 'list-done' },
    });
  });

  test('deleting a schedule removes it and the tile clock', async () => {
    const user = await openBoardPage();
    const cardDialog = await openCard(user, 'Pay rent');

    await user.click(
      within(await scheduleMenu(user, cardDialog)).getByRole('menuitem', {
        name: 'Delete schedule',
        hidden: true,
      }),
    );

    expect(await within(cardDialog).findByText(/^Nothing scheduled/)).toBeInTheDocument();
    await waitFor(() =>
      expect(within(column('Backlog')).queryByText(/Moves to Doing/)).not.toBeInTheDocument(),
    );
  });

  test('past runs load when the run list is opened', async () => {
    serverRuns.set('schedule-rent', [
      {
        id: 'run-late',
        ranAt: '2026-11-10T02:04:00.000Z',
        how: 'late',
        moved: false,
        trackedMinutes: 0,
      },
      {
        id: 'run-by-hand',
        ranAt: '2026-11-03T17:00:00.000Z',
        how: 'byHand',
        moved: true,
        trackedMinutes: 90,
      },
    ]);
    const user = await openBoardPage();
    const cardDialog = await openCard(user, 'Pay rent');

    await user.click(await within(cardDialog).findByText('Runs'));

    expect(await within(cardDialog).findByText('Late')).toBeInTheDocument();
    expect(within(cardDialog).getByText('already there')).toBeInTheDocument();
    expect(within(cardDialog).getByText('By hand')).toBeInTheDocument();
    expect(within(cardDialog).getByText('1h 30m tracked')).toBeInTheDocument();
    expect(within(cardDialog).getByText('Mon 9 Nov, 18:04')).toBeInTheDocument();
  });
});

describe('card workflow, history and archive', () => {
  type ArchivedServerCard = { card: BoardCardRecord; fromListName: string; how: 'idle' | 'byHand' };
  let serverTriggers: Map<string, CardTriggers>;
  let archivedServerCards: Map<string, ArchivedServerCard>;
  let triggerWrites: unknown[];
  let historyRequests: string[];
  let isTriggerWriteFailing: boolean;

  const ARCHIVED_AT = '2026-11-08T09:00:00.000Z';

  const archiveOnServer = (cardId: string, how: ArchivedServerCard['how']) => {
    const heldBoard = boardHolding(holdsCard(cardId));
    const archivedCard = heldBoard.cards.find((card) => card.id === cardId) as BoardCardRecord;
    const fromList = heldBoard.lists.find((listRecord) => listRecord.id === archivedCard.listId);
    archivedServerCards.set(cardId, {
      card: archivedCard,
      fromListName: fromList?.name ?? '',
      how,
    });
    const changedBoard = applyBoardChange(heldBoard, { kind: 'deleteCard', cardId });
    serverBoards = serverBoards.map((serverBoard) =>
      serverBoard.board.id === changedBoard.board.id ? changedBoard : serverBoard,
    );
  };

  const restoreOnServer = (cardId: string) => {
    const archivedServerCard = archivedServerCards.get(cardId) as ArchivedServerCard;
    archivedServerCards.delete(cardId);
    const heldBoard = serverBoardOf('board-personal') as BoardRecord;
    const restoredBoard = applyBoardChange(
      applyBoardChange(heldBoard, { kind: 'addCard', cardRecord: archivedServerCard.card }),
      { kind: 'moveCard', cardId, listId: archivedServerCard.card.listId, position: 0 },
    );
    serverBoards = serverBoards.map((serverBoard) =>
      serverBoard.board.id === restoredBoard.board.id ? restoredBoard : serverBoard,
    );
    return restoredBoard;
  };

  beforeEach(() => {
    serverTriggers = new Map();
    archivedServerCards = new Map();
    triggerWrites = [];
    historyRequests = [];
    isTriggerWriteFailing = false;
    backendServer.use(
      http.get('/backend/cards/:cardId', ({ params }) => {
        const cardId = String(params.cardId);
        const archivedServerCard = archivedServerCards.get(cardId);
        const card =
          archivedServerCard === undefined
            ? boardHolding(holdsCard(cardId)).cards.find((cardItem) => cardItem.id === cardId)
            : { ...archivedServerCard.card, listId: null, position: null };
        const cardDetail: CardDetailRecord = {
          card: card as CardDetailRecord['card'],
          notes: DEFAULT_NOTES,
          linkedTasks: [],
          trackedEventCount: 0,
          schedules: [],
          triggers: serverTriggers.get(cardId) ?? { started: null, finished: null },
          archived:
            archivedServerCard === undefined
              ? null
              : { at: ARCHIVED_AT, how: archivedServerCard.how },
        };
        return HttpResponse.json(cardDetail);
      }),
      http.put('/backend/cards/:cardId/triggers', async ({ params, request }) => {
        const triggerChoice = (await request.json()) as {
          startedListId: string | null;
          finishedListId: string | null;
        };
        triggerWrites.push(triggerChoice);
        if (isTriggerWriteFailing) {
          return HttpResponse.json({ error: 'not found' }, { status: 404 });
        }
        const listsById = new Map(
          personalBoard.lists.map((listRecord) => [listRecord.id, listRecord.name]),
        );
        const targetOf = (listId: string | null) =>
          listId === null ? null : { listId, listName: listsById.get(listId) ?? null };
        const savedTriggers = {
          started: targetOf(triggerChoice.startedListId),
          finished: targetOf(triggerChoice.finishedListId),
        };
        serverTriggers.set(String(params.cardId), savedTriggers);
        return HttpResponse.json({ triggers: savedTriggers });
      }),
      http.get('/backend/cards/:cardId/history', ({ request }) => {
        const requestUrl = new URL(request.url);
        historyRequests.push(requestUrl.search);
        return HttpResponse.json(
          requestUrl.searchParams.get('before') === null
            ? {
                moves: [
                  {
                    id: 'move-2',
                    movedAt: '2026-11-09T10:00:00.000Z',
                    fromListName: 'Backlog',
                    toListName: 'Doing',
                    reason: 'started',
                    taskTitle: 'Draft the plan',
                  },
                ],
                hasMore: true,
              }
            : {
                moves: [
                  {
                    id: 'move-1',
                    movedAt: '2026-11-08T10:00:00.000Z',
                    fromListName: 'Done',
                    toListName: 'Backlog',
                    reason: 'byHand',
                    taskTitle: null,
                  },
                ],
                hasMore: false,
              },
        );
      }),
      http.post('/backend/cards/:cardId/archive', ({ params }) => {
        archiveOnServer(String(params.cardId), 'byHand');
        return HttpResponse.json({ status: 'archived' });
      }),
      http.post('/backend/cards/:cardId/restore', ({ params }) =>
        HttpResponse.json(restoreOnServer(String(params.cardId))),
      ),
      http.get('/backend/boards/:boardId/archived-cards', () =>
        HttpResponse.json({
          cards: [...archivedServerCards.values()].map((archivedServerCard) => ({
            id: archivedServerCard.card.id,
            title: archivedServerCard.card.title,
            fromListName: archivedServerCard.fromListName,
            archivedAt: ARCHIVED_AT,
            how: archivedServerCard.how,
          })),
          hasMore: false,
        }),
      ),
      http.delete('/backend/cards/:cardId', ({ params }) => {
        archivedServerCards.delete(String(params.cardId));
        return HttpResponse.json(serverBoardOf('board-personal'));
      }),
      http.patch('/backend/lists/:listId', async ({ params, request }) => {
        const { archiveAfter } = (await request.json()) as { archiveAfter: string | null };
        if (archiveAfter === '3x') {
          return HttpResponse.json(
            { error: 'Use days, weeks or months, like 3d, 2w or 1m' },
            { status: 422 },
          );
        }
        const heldBoard = boardHolding(holdsList(String(params.listId)));
        const changedBoard: BoardRecord = {
          ...heldBoard,
          lists: heldBoard.lists.map((listRecord) =>
            listRecord.id === params.listId
              ? { ...listRecord, archiveAfter: archiveAfter === '7d' ? '1w' : archiveAfter }
              : listRecord,
          ),
        };
        serverBoards = serverBoards.map((serverBoard) =>
          serverBoard.board.id === changedBoard.board.id ? changedBoard : serverBoard,
        );
        return HttpResponse.json(changedBoard);
      }),
    );
  });

  test('a trigger saves on change and goes back when the save fails', async () => {
    const user = await openBoardPage();
    const cardDialog = await openCard(user, 'Plan the week');
    const triggerSelect = (label: string) => within(cardDialog).getByLabelText(label);

    await user.selectOptions(triggerSelect('When started, move to'), 'Doing');
    await waitFor(() => expect(triggerWrites).toHaveLength(1));
    isTriggerWriteFailing = true;
    await user.selectOptions(triggerSelect('When finished, move to'), 'Done');

    expect(await screen.findByText('Not found.')).toBeInTheDocument();
    await waitFor(() => expect(triggerSelect('When finished, move to')).toHaveValue(''));
    expect(triggerSelect('When started, move to')).toHaveValue('list-doing');
    expect(triggerWrites).toEqual([
      { startedListId: 'list-doing', finishedListId: null },
      { startedListId: 'list-doing', finishedListId: 'list-done' },
    ]);
  });

  test('a flagged trigger shows until another column is picked', async () => {
    serverTriggers.set('card-plan', {
      started: { listId: null, listName: null },
      finished: null,
    });
    const user = await openBoardPage();
    const cardDialog = await openCard(user, 'Plan the week');

    expect(
      await within(cardDialog).findByText('Its column was deleted. Pick another.'),
    ).toBeInTheDocument();
    await user.selectOptions(within(cardDialog).getByLabelText('When started, move to'), 'Done');

    await waitFor(() =>
      expect(
        within(cardDialog).queryByText('Its column was deleted. Pick another.'),
      ).not.toBeInTheDocument(),
    );
  });

  test('History loads when it is opened and Show older moves pages back', async () => {
    const user = await openBoardPage();
    const cardDialog = await openCard(user, 'Plan the week');

    expect(historyRequests).toEqual([]);
    await user.click(within(cardDialog).getByText('History'));
    expect(await within(cardDialog).findByText('Started “Draft the plan”')).toBeInTheDocument();
    await user.click(
      within(cardDialog).getByRole('button', { name: 'Show older moves', hidden: true }),
    );

    expect(await within(cardDialog).findByText('Moved by hand')).toBeInTheDocument();
    expect(historyRequests).toEqual(['', '?before=move-2']);
    expect(
      within(cardDialog).queryByRole('button', { name: 'Show older moves', hidden: true }),
    ).not.toBeInTheDocument();
  });

  test('Archive takes the card off the board and Restore puts it back on top', async () => {
    const user = await openBoardPage();
    const cardDialog = await openCard(user, 'Plan the week');

    await user.click(within(cardDialog).getByRole('button', { name: 'Archive', hidden: true }));

    expect(await within(cardDialog).findByText(/^Archived on .*, by hand$/)).toBeInTheDocument();
    await waitFor(() => expect(cardTitlesIn('Backlog')).toEqual(['Pay rent']));
    await user.click(within(cardDialog).getByRole('button', { name: 'Restore', hidden: true }));

    await waitFor(() => expect(cardTitlesIn('Backlog')).toEqual(['Plan the week', 'Pay rent']));
    expect(within(cardDialog).queryByText(/^Archived on /)).not.toBeInTheDocument();
  });

  test('the Archived panel restores one card and deletes another', async () => {
    archiveOnServer('card-plan', 'idle');
    archiveOnServer('card-ship', 'byHand');
    const user = userEvent.setup();
    renderWithToaster(<BoardPage />);
    await screen.findByText('Pay rent');

    await user.click(screen.getByRole('button', { name: 'Archived' }));
    const archivedDialog = screen.getByRole('dialog', { name: 'Archived cards', hidden: true });
    expect(await within(archivedDialog).findByText('Plan the week')).toBeInTheDocument();
    expect(within(archivedDialog).getByText(/^From Backlog · .*, by idle$/)).toBeInTheDocument();
    await user.click(
      within(archivedDialog).getByRole('button', { name: 'Restore Plan the week', hidden: true }),
    );
    await waitFor(() => expect(cardTitlesIn('Backlog')).toEqual(['Plan the week', 'Pay rent']));
    await user.click(
      within(archivedDialog).getByRole('button', { name: 'Delete Ship the board', hidden: true }),
    );
    const deleteDialog = screen.getByRole('dialog', {
      name: 'Delete “Ship the board”?',
      hidden: true,
    });
    await user.click(
      within(deleteDialog).getByRole('button', { name: 'Delete card', hidden: true }),
    );

    await waitFor(() =>
      expect(within(archivedDialog).getByText('No archived cards.')).toBeInTheDocument(),
    );
    expect(archivedServerCards.size).toBe(0);
  });

  test('Archive after saves the tidied length and a bad one shows the hint', async () => {
    const user = await openBoardPage();
    const settingsDialog = await openBoardSettings(user);
    const doneLength = within(settingsDialog).getByLabelText(/^Done/);

    await user.type(doneLength, '7d{Enter}');

    expect(await within(column('Done')).findByText('Archives after 1w')).toBeInTheDocument();
    const savedLength = within(settingsDialog).getByLabelText(/^Done/);
    expect(savedLength).toHaveValue('1w');
    await user.clear(savedLength);
    await user.type(savedLength, '3x{Enter}');

    expect(
      await within(settingsDialog).findByText('Use days, weeks or months, like 3d, 2w or 1m.'),
    ).toBeInTheDocument();
    expect(within(settingsDialog).getByLabelText(/^Done/)).toHaveValue('1w');
  });
});

import type Board from '@/features/board/entities/board';
import type BoardCard from '@/features/board/entities/board-card';
import type BoardContents from '@/features/board/entities/board-contents';
import type BoardProperty from '@/features/board/entities/board-property';
import type CardDetail from '@/features/board/entities/card-detail';
import BoardPropertyKind from '@/features/board/enums/board-property-kind';

const sampleDueDate = (dayOffset: number): string => {
  const today = new Date();
  const dueDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset);
  const monthText = String(dueDay.getMonth() + 1).padStart(2, '0');
  const dayText = String(dueDay.getDate()).padStart(2, '0');
  return `${dueDay.getFullYear()}-${monthText}-${dayText}`;
};

const buildCard = (card: Partial<BoardCard> & Pick<BoardCard, 'id' | 'title'>): BoardCard => ({
  dueDate: null,
  dueTime: null,
  values: [],
  linkedTaskCount: 0,
  doneLinkedTaskCount: 0,
  ...card,
});

const personalProperties: BoardProperty[] = [
  {
    id: 'project',
    name: 'Project',
    kind: BoardPropertyKind.Choice,
    options: [
      { id: 'daibx', name: 'DaiBX', color: '#7c95bd' },
      { id: 'chinese', name: 'Chinese', color: '#be7e86' },
      { id: 'folio', name: 'Folio', color: '#c6afa3' },
      { id: 'trading', name: 'Trading', color: '#6f9a7d' },
    ],
  },
  {
    id: 'size',
    name: 'Size',
    kind: BoardPropertyKind.Choice,
    options: [
      { id: 'size-s', name: 'S', color: null },
      { id: 'size-m', name: 'M', color: null },
      { id: 'size-l', name: 'L', color: null },
    ],
  },
  { id: 'hours', name: 'Hours', kind: BoardPropertyKind.Number, options: [] },
  { id: 'link', name: 'Link', kind: BoardPropertyKind.Text, options: [] },
];

const shipBoardCard = buildCard({
  id: 'ship-board',
  title: 'Ship the board milestone',
  dueDate: sampleDueDate(2),
  dueTime: '18:00',
  values: [
    { propertyId: 'project', optionId: 'daibx' },
    { propertyId: 'size', optionId: 'size-l' },
    { propertyId: 'hours', number: '12.5' },
    { propertyId: 'link', text: 'dai-bx.vercel.app/board' },
  ],
  linkedTaskCount: 5,
  doneLinkedTaskCount: 2,
});

const personalBoardContents: BoardContents = {
  board: { id: 'personal', name: 'Personal' },
  properties: personalProperties,
  lists: [
    {
      id: 'backlog',
      name: 'Backlog',
      cards: [
        buildCard({
          id: 'saturday-market',
          title: 'Plan the Saturday market session',
          values: [
            { propertyId: 'project', optionId: 'trading' },
            { propertyId: 'size', optionId: 'size-m' },
          ],
        }),
        buildCard({
          id: 'adr-store',
          title: 'Write the ADR for Postgres-only storage',
          values: [{ propertyId: 'project', optionId: 'daibx' }],
        }),
      ],
    },
    {
      id: 'to-do',
      name: 'To do',
      cards: [
        buildCard({
          id: 'chinese-cards',
          title: 'Chinese – review this week’s cards',
          dueDate: sampleDueDate(-1),
          values: [
            { propertyId: 'project', optionId: 'chinese' },
            { propertyId: 'size', optionId: 'size-s' },
          ],
          linkedTaskCount: 3,
          doneLinkedTaskCount: 1,
        }),
        buildCard({
          id: 'rally-reader',
          title: 'Rally conversion: interpretation store',
          dueDate: sampleDueDate(6),
          values: [
            { propertyId: 'project', optionId: 'folio' },
            { propertyId: 'size', optionId: 'size-l' },
          ],
        }),
        buildCard({ id: 'clean-room', title: 'Clean room', dueDate: sampleDueDate(0) }),
      ],
    },
    {
      id: 'doing',
      name: 'Doing',
      cards: [
        shipBoardCard,
        buildCard({
          id: 'gold-journal',
          title: 'Journal last week’s gold trades',
          values: [{ propertyId: 'project', optionId: 'trading' }],
          linkedTaskCount: 4,
          doneLinkedTaskCount: 4,
        }),
      ],
    },
    {
      id: 'done',
      name: 'Done',
      cards: [
        buildCard({
          id: 'release-v3',
          title: 'Release DaiBX v3.0.0',
          values: [
            { propertyId: 'project', optionId: 'daibx' },
            { propertyId: 'size', optionId: 'size-l' },
          ],
          linkedTaskCount: 6,
          doneLinkedTaskCount: 6,
        }),
      ],
    },
    { id: 'someday', name: 'Someday', cards: [] },
  ],
};

const studiesBoardContents: BoardContents = {
  board: { id: 'studies', name: 'Studies' },
  properties: [],
  lists: [],
};

const sampleBoardContents = [personalBoardContents, studiesBoardContents];

const sampleCardDetail: CardDetail = {
  card: shipBoardCard,
  listName: 'Doing',
  notes: `## Outcome
Boards, lists and cards live in DaiBX, and a card can go from **Backlog** to **Done**.

## Context
- Replaces the Trello *Personal* board for daily planning.
- Spec: \`.kiro/specs/03-board/\`

## Open questions
- Does the switcher need search once there are many boards?

## Done when
A card survives a reload in the same place on [the live site](https://dai-bx.vercel.app/board).
`,
  linkedTasks: [
    {
      id: 'task-1',
      name: 'Static board screens',
      isDone: true,
      groupId: 'nov-3',
      groupName: 'Nov 3',
    },
    {
      id: 'task-2',
      name: 'Board schema migration',
      isDone: true,
      groupId: 'nov-3',
      groupName: 'Nov 3',
    },
    { id: 'task-3', name: 'Boards API', isDone: false, groupId: 'nov-4', groupName: 'Nov 4' },
    { id: 'task-4', name: 'Lists API', isDone: false, groupId: 'nov-4', groupName: 'Nov 4' },
    { id: 'task-5', name: 'Cards API', isDone: false, groupId: 'nov-4', groupName: 'Nov 4' },
  ],
};

const sampleBoardSource = {
  findBoards: (): Board[] => sampleBoardContents.map((boardContents) => boardContents.board),
  findBoardContents: (boardId: Board['id'] | undefined): BoardContents | undefined =>
    sampleBoardContents.find((boardContents) => boardContents.board.id === boardId) ??
    sampleBoardContents[0],
  findCardDetail: (): CardDetail => sampleCardDetail,
};

export default sampleBoardSource;

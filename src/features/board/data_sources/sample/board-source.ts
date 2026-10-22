import BoardCard from '@/features/board/entities/board-card';
import BoardList from '@/features/board/entities/board-list';
import ChecklistItem from '@/features/board/entities/checklist-item';

const buildCard = (card: Partial<BoardCard> & Pick<BoardCard, 'id' | 'title'>): BoardCard => ({
  labels: [],
  checklistDoneCount: null,
  checklistItemCount: null,
  dueLabel: null,
  recurrenceLabel: null,
  noteCount: 0,
  ...card,
});

const boardLists: BoardList[] = [
  {
    id: 'backlog',
    name: 'Backlog',
    cards: [
      buildCard({
        id: 'saturday-market',
        title: 'Plan the Saturday market session',
        labels: [{ name: 'Learning', tone: 'neutral' }],
      }),
      buildCard({
        id: 'adr-store',
        title: 'Write the ADR for Postgres-only storage',
        labels: [{ name: 'DaiBX', tone: 'primary' }],
        noteCount: 2,
      }),
    ],
  },
  {
    id: 'to-do',
    name: 'To do',
    cards: [
      buildCard({
        id: 'clean-room',
        title: 'Clean room',
        labels: [{ name: 'Home', tone: 'success' }],
        checklistDoneCount: 0,
        checklistItemCount: 6,
        recurrenceLabel: 'Every Saturday',
      }),
      buildCard({
        id: 'chinese-cards',
        title: 'Chinese – daily cards',
        labels: [{ name: 'Learning', tone: 'neutral' }],
        recurrenceLabel: 'Daily',
        checklistDoneCount: 1,
        checklistItemCount: 3,
      }),
      buildCard({
        id: 'workflow-editor',
        title: 'Design the workflow editor',
        labels: [{ name: 'DaiBX', tone: 'primary' }],
        dueLabel: 'Oct 28',
      }),
    ],
  },
  {
    id: 'doing',
    name: 'Doing',
    cards: [
      buildCard({
        id: 'ship-frontend',
        title: 'Ship the v3 frontend',
        labels: [
          { name: 'DaiBX', tone: 'primary' },
          { name: 'Release', tone: 'warning' },
        ],
        checklistDoneCount: 3,
        checklistItemCount: 5,
        dueLabel: 'Oct 24',
        noteCount: 4,
      }),
      buildCard({
        id: 'afk-review',
        title: 'Review the AFK check-in flow',
        labels: [{ name: 'DaiBX', tone: 'primary' }],
      }),
    ],
  },
  {
    id: 'done',
    name: 'Done',
    cards: [
      buildCard({
        id: 'shev-stack',
        title: 'Teach shev the new stack',
        labels: [{ name: 'Systems', tone: 'neutral' }],
        checklistDoneCount: 4,
        checklistItemCount: 4,
      }),
      buildCard({
        id: 'pick-lambda',
        title: 'Pick where the backend runs',
        labels: [{ name: 'DaiBX', tone: 'primary' }],
      }),
    ],
  },
];

const shipFrontendChecklist: ChecklistItem[] = [
  { id: 'c1', name: 'Scaffold Next.js on release/v3.0.0', isDone: true },
  { id: 'c2', name: 'Blue theme and core components', isDone: true },
  { id: 'c3', name: 'Marketing site and changelog', isDone: true },
  { id: 'c4', name: 'Tasks, board and calendar screens', isDone: false },
  { id: 'c5', name: 'Workflows and settings', isDone: false },
];

const sampleBoardSource = {
  findLists: (): BoardList[] => boardLists,
  findChecklist: (): ChecklistItem[] => shipFrontendChecklist,
};

export default sampleBoardSource;

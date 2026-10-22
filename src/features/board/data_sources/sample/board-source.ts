import BoardCard from '@/features/board/entities/board-card';
import BoardList from '@/features/board/entities/board-list';
import ChecklistItem from '@/features/board/entities/checklist-item';
import sampleCategories from '@/core/sample-categories';

const buildCard = (
  card: Partial<BoardCard> & Pick<BoardCard, 'id' | 'title' | 'category'>,
): BoardCard => ({
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
        category: sampleCategories.studies,
      }),
      buildCard({
        id: 'adr-store',
        title: 'Write the ADR for Postgres-only storage',
        category: sampleCategories.goals,
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
        category: sampleCategories.personal,
        checklistDoneCount: 0,
        checklistItemCount: 6,
        recurrenceLabel: 'Every Saturday',
      }),
      buildCard({
        id: 'chinese-cards',
        title: 'Chinese – daily cards',
        category: sampleCategories.studies,
        recurrenceLabel: 'Daily',
        checklistDoneCount: 1,
        checklistItemCount: 3,
      }),
      buildCard({
        id: 'workflow-editor',
        title: 'Design the workflow editor',
        category: sampleCategories.goals,
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
        category: sampleCategories.goals,
        labels: ['Release'],
        checklistDoneCount: 3,
        checklistItemCount: 5,
        dueLabel: 'Oct 24',
        noteCount: 4,
      }),
      buildCard({
        id: 'shift-notes',
        title: 'Prepare the shift notes',
        category: sampleCategories.work,
        dueLabel: 'Today',
        checklistDoneCount: 1,
        checklistItemCount: 2,
      }),
      buildCard({
        id: 'afk-review',
        title: 'Review the AFK check-in flow',
        category: sampleCategories.goals,
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
        category: sampleCategories.goals,
        checklistDoneCount: 4,
        checklistItemCount: 4,
      }),
      buildCard({
        id: 'pick-lambda',
        title: 'Pick where the backend runs',
        category: sampleCategories.goals,
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

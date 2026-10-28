import Task from '@/features/tasks/entities/task';
import GroupImportPreview from '@/features/tasks/entities/group-import-preview';
import GroupImportProblem from '@/features/tasks/entities/group-import-problem';
import MoveTarget from '@/features/tasks/entities/move-target';
import TaskGroup from '@/features/tasks/entities/task-group';
import sampleCategories from '@/core/sample-categories';

const buildTask = (task: Partial<Task> & Pick<Task, 'id' | 'name'>): Task => ({
  isDone: false,
  isOpen: false,
  isTracking: false,
  estimate: null,
  tasks: [],
  ...task,
});

const taskGroups: TaskGroup[] = [
  { id: 'today', name: 'Today', category: null, openTaskCount: 12, taskCount: 12 },
  { id: 'daibx', name: 'DaiBX', category: sampleCategories.goals, openTaskCount: 9, taskCount: 14 },
  { id: 'work', name: 'Shift', category: sampleCategories.work, openTaskCount: 7, taskCount: 11 },
  {
    id: 'learning',
    name: 'Chinese',
    category: sampleCategories.studies,
    openTaskCount: 5,
    taskCount: 8,
  },
  { id: 'home', name: 'Home', category: sampleCategories.personal, openTaskCount: 3, taskCount: 3 },
];

const daibxTasks: Task[] = [
  buildTask({
    id: 'ship-frontend',
    name: 'Ship the v3 frontend',
    isOpen: true,
    tasks: [
      buildTask({ id: 'design-marketing', name: 'Design the marketing site', isDone: true }),
      buildTask({
        id: 'build-changelog',
        name: 'Build the changelog',
        isOpen: true,
        tasks: [
          buildTask({
            id: 'write-changelog',
            name: 'Write the v3 changelog',
            isTracking: true,
            estimate: '45m',
          }),
          buildTask({ id: 'past-releases', name: 'Add the past releases', isDone: true }),
        ],
      }),
      buildTask({ id: 'calendar-week', name: 'Design the calendar week view', estimate: '2h' }),
    ],
  }),
  buildTask({
    id: 'plan-backend',
    name: 'Plan the backend on Lambda',
    isOpen: true,
    tasks: [
      buildTask({ id: 'supabase-project', name: 'Create the Supabase project', estimate: '20m' }),
      buildTask({ id: 'first-migration', name: 'Write the first migration', estimate: '1h' }),
    ],
  }),
  buildTask({ id: 'review-afk', name: 'Review the AFK check-in flow', estimate: '30m' }),
  buildTask({
    id: 'vault-decisions',
    name: 'Record the stack decisions in the vault',
    isDone: true,
    tasks: [buildTask({ id: 'vault-node', name: 'Create the project node', isDone: true })],
  }),
];

const importPreview: GroupImportPreview = {
  fileName: '2026-10-28.json',
  groupName: 'Today',
  taskCount: 12,
  deepestLevel: 3,
  topLevelTaskNames: [
    'DaiBX – Build the static task screens',
    'Chinese – Review this week’s cards',
    'Home – Clean the room',
    'Learn to trade – Saturday market session',
  ],
};

const importProblem: GroupImportProblem = {
  fileName: '2026-10-27.json',
  message: 'Every task needs a name.',
  path: 'tasks[2].tasks[0].name',
};

const moveTargets: MoveTarget[] = [
  { id: 'ship-frontend', name: 'Ship the v3 frontend', depth: 0, isDone: false },
  { id: 'design-marketing', name: 'Design the marketing site', depth: 1, isDone: true },
  { id: 'build-changelog', name: 'Build the changelog', depth: 1, isDone: false },
  { id: 'write-changelog', name: 'Write the v3 changelog', depth: 2, isDone: false },
  { id: 'calendar-week', name: 'Design the calendar week view', depth: 1, isDone: false },
  { id: 'review-afk', name: 'Review the AFK check-in flow', depth: 0, isDone: false },
  {
    id: 'vault-decisions',
    name: 'Record the stack decisions in the vault',
    depth: 0,
    isDone: true,
  },
];

const sampleTaskSource = {
  findGroups: (): TaskGroup[] => taskGroups,
  findTree: (): Task[] => daibxTasks,
  findImportPreview: (): GroupImportPreview => importPreview,
  findImportProblem: (): GroupImportProblem => importProblem,
  findMoveTargets: (): MoveTarget[] => moveTargets,
};

export default sampleTaskSource;

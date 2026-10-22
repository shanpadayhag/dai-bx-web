import Task from '@/features/tasks/entities/task';
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
  { id: 'daibx', name: 'DaiBX', category: sampleCategories.goals, openTaskCount: 9 },
  { id: 'work', name: 'Shift', category: sampleCategories.work, openTaskCount: 7 },
  { id: 'learning', name: 'Chinese', category: sampleCategories.studies, openTaskCount: 5 },
  { id: 'home', name: 'Home', category: sampleCategories.personal, openTaskCount: 3 },
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

const sampleTaskSource = {
  findGroups: (): TaskGroup[] => taskGroups,
  findTree: (): Task[] => daibxTasks,
};

export default sampleTaskSource;

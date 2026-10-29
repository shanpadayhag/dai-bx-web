import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { GroupTasks } from '@/features/tasks/entities/group-tasks';
import type TaskGroup from '@/features/tasks/entities/task-group';
import type TaskRecord from '@/features/tasks/entities/task-record';
import TasksPage from '@/features/tasks/pages/tasks-page';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const routerReplace = vi.hoisted(() => vi.fn());
const stableRouter = vi.hoisted(() => ({ push: vi.fn(), replace: routerReplace }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const backendServer = startBackendServer();

const goalsCategory = { id: 'category-goals', name: 'Goals', color: '#7c95bd' };
const studiesCategory = { id: 'category-studies', name: 'Studies', color: '#be7e86' };

const taskRecord = (
  id: string,
  name: string,
  parentId: string | null,
  position: number,
  overrides: Partial<TaskRecord> = {},
): TaskRecord => ({
  id,
  name,
  parentId,
  position,
  isDone: false,
  estimateMinutes: null,
  ...overrides,
});

const todayGroup: TaskGroup = {
  id: 'group-today',
  name: 'Today',
  category: null,
  openTaskCount: 3,
  taskCount: 3,
};
const daibxGroup: TaskGroup = {
  id: 'group-daibx',
  name: 'DaiBX',
  category: goalsCategory,
  openTaskCount: 1,
  taskCount: 1,
};

const todayTasks: TaskRecord[] = [
  taskRecord('task-plan', 'Plan the backend', null, 0),
  taskRecord('task-supabase', 'Create the Supabase project', 'task-plan', 0, {
    estimateMinutes: 20,
  }),
  taskRecord('task-review', 'Review the check-in flow', null, 1),
];

const groupTasksOf = (taskGroup: TaskGroup, tasks: TaskRecord[]): GroupTasks => {
  const openCount = tasks.filter((task) => !task.isDone).length;
  return {
    group: { id: taskGroup.id, name: taskGroup.name, category: taskGroup.category },
    tasks,
    openCount,
    doneCount: tasks.length - openCount,
  };
};

let currentGroups: TaskGroup[] = [];
let currentTasksByGroupId: Record<string, TaskRecord[]> = {};

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/tasks');
  currentGroups = [structuredClone(todayGroup), structuredClone(daibxGroup)];
  currentTasksByGroupId = {
    'group-today': structuredClone(todayTasks),
    'group-daibx': [taskRecord('task-ship', 'Ship the frontend', null, 0)],
  };
  backendServer.use(
    http.get('/backend/task-groups', () => HttpResponse.json(currentGroups)),
    http.get('/backend/categories', () => HttpResponse.json([goalsCategory, studiesCategory])),
    http.get('/backend/task-groups/:taskGroupId/tasks', ({ params }) => {
      const taskGroup = currentGroups.find((group) => group.id === params.taskGroupId);
      if (taskGroup === undefined)
        return HttpResponse.json({ error: 'not found' }, { status: 404 });
      return HttpResponse.json(groupTasksOf(taskGroup, currentTasksByGroupId[taskGroup.id] ?? []));
    }),
  );
});
afterEach(() => {
  routerReplace.mockReset();
});

const answerWith = (tasks: TaskRecord[]) => HttpResponse.json(groupTasksOf(todayGroup, tasks));

const openTasksPage = async () => {
  const user = userEvent.setup();
  renderWithToaster(<TasksPage />);
  await screen.findByText('Plan the backend');
  return user;
};

const taskRow = (taskName: string) => {
  const nameElement = screen.getByText(taskName);
  const row = nameElement.closest<HTMLElement>('.group\\/row');
  if (row === null) throw new Error(`${taskName} has no row`);
  return row;
};

test('opens the newest group and nests its tasks', async () => {
  await openTasksPage();

  expect(screen.getByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument();
  expect(screen.getByText('3 open · 0 done')).toBeInTheDocument();
  const parentItem = screen.getByText('Plan the backend').closest('li');
  expect(
    within(parentItem as HTMLElement).getByText('Create the Supabase project'),
  ).toBeInTheDocument();
  expect(within(taskRow('Create the Supabase project')).getByText('20m')).toBeInTheDocument();
});

test('opens the group named in the address, and remembers it', async () => {
  window.history.replaceState(null, '', '/tasks?group=group-daibx');
  renderWithToaster(<TasksPage />);

  expect(await screen.findByText('Ship the frontend')).toBeInTheDocument();
  expect(window.localStorage.getItem('daibx:last-task-group-id')).toBe('group-daibx');
});

test('choosing a group in the list opens it and puts it in the address', async () => {
  const user = await openTasksPage();

  await user.click(screen.getByRole('button', { name: /DaiBX/ }));

  expect(await screen.findByText('Ship the frontend')).toBeInTheDocument();
  expect(routerReplace).toHaveBeenCalledWith('/tasks?group=group-daibx', { scroll: false });
});

test('ticking a parent shows the cascade the server answers with', async () => {
  backendServer.use(
    http.post('/backend/tasks/task-plan/complete', () =>
      answerWith(
        todayTasks.map((task) => (task.id === 'task-review' ? task : { ...task, isDone: true })),
      ),
    ),
  );
  const user = await openTasksPage();

  await user.click(screen.getByRole('checkbox', { name: 'Mark Plan the backend as done' }));

  await waitFor(() =>
    expect(
      screen.getByRole('checkbox', { name: 'Mark Create the Supabase project as done' }),
    ).toHaveAttribute('aria-checked', 'true'),
  );
  expect(screen.getByText('1 open · 2 done')).toBeInTheDocument();
});

test('a failed write rolls back and says why', async () => {
  backendServer.use(
    http.post('/backend/tasks/task-review/complete', () =>
      HttpResponse.json({ error: 'internal server error' }, { status: 500 }),
    ),
  );
  const user = await openTasksPage();
  const reviewCheckbox = screen.getByRole('checkbox', {
    name: 'Mark Review the check-in flow as done',
  });

  await user.click(reviewCheckbox);

  expect(await screen.findByText('Something broke on our side')).toBeInTheDocument();
  await waitFor(() => expect(reviewCheckbox).toHaveAttribute('aria-checked', 'false'));
});

test('adding a task sends its name and shows the server list', async () => {
  let receivedBody: unknown;
  backendServer.use(
    http.post('/backend/task-groups/group-today/tasks', async ({ request }) => {
      receivedBody = await request.json();
      return answerWith([...todayTasks, taskRecord('task-new', 'Write the migration', null, 2)]);
    }),
  );
  const user = await openTasksPage();

  await user.type(
    screen.getByRole('textbox', { name: 'Add a task to Today' }),
    'Write the migration{Enter}',
  );

  expect(await screen.findByText('Write the migration')).toBeInTheDocument();
  expect(receivedBody).toEqual({ name: 'Write the migration', parentId: null });
  expect(screen.getByRole('textbox', { name: 'Add a task to Today' })).toHaveValue('');
});

test('adding a subtask sends its parent', async () => {
  let receivedBody: unknown;
  backendServer.use(
    http.post('/backend/task-groups/group-today/tasks', async ({ request }) => {
      receivedBody = await request.json();
      return answerWith([
        ...todayTasks,
        taskRecord('task-child', 'Check the logs', 'task-review', 0),
      ]);
    }),
  );
  const user = await openTasksPage();

  await user.click(
    screen.getByRole('button', { name: 'Add a subtask to Review the check-in flow' }),
  );
  await user.type(screen.getByRole('textbox', { name: 'New subtask' }), 'Check the logs{Enter}');

  expect(await screen.findByText('Check the logs')).toBeInTheDocument();
  expect(receivedBody).toEqual({ name: 'Check the logs', parentId: 'task-review' });
});

test('editing a task saves its name and estimate', async () => {
  let receivedBody: unknown;
  backendServer.use(
    http.patch('/backend/tasks/task-review', async ({ request }) => {
      receivedBody = await request.json();
      return answerWith(
        todayTasks.map((task) =>
          task.id === 'task-review' ? { ...task, name: 'Review it', estimateMinutes: 90 } : task,
        ),
      );
    }),
  );
  const user = await openTasksPage();

  await user.click(screen.getByRole('button', { name: 'Rename Review the check-in flow' }));
  const nameInput = screen.getByRole('textbox', { name: 'Task name' });
  await user.clear(nameInput);
  await user.type(nameInput, 'Review it');
  await user.type(screen.getByRole('textbox', { name: 'Estimate' }), '1h 30m');
  await user.click(screen.getByRole('button', { name: /Save/ }));

  expect(await screen.findByText('1h 30m')).toBeInTheDocument();
  expect(receivedBody).toEqual({ name: 'Review it', estimateMinutes: 90 });
});

test('an estimate it cannot read is refused before anything is sent', async () => {
  const user = await openTasksPage();

  await user.click(screen.getByRole('button', { name: 'Rename Review the check-in flow' }));
  await user.type(screen.getByRole('textbox', { name: 'Estimate' }), 'soon');
  await user.click(screen.getByRole('button', { name: /Save/ }));

  expect(await screen.findByText('Check the estimate')).toBeInTheDocument();
});

test('deleting a task asks first and names its subtasks', async () => {
  let isDeleted = false;
  backendServer.use(
    http.delete('/backend/tasks/task-plan', () => {
      isDeleted = true;
      return answerWith(todayTasks.filter((task) => task.id === 'task-review'));
    }),
  );
  const user = await openTasksPage();

  await user.click(screen.getByRole('button', { name: 'Delete Plan the backend' }));
  const deleteDialog = screen.getByRole('dialog', { name: 'Delete task', hidden: true });
  expect(within(deleteDialog).getByText('Delete “Plan the backend”?')).toBeInTheDocument();
  expect(within(deleteDialog).getByText(/Its 1 subtask is deleted with it/)).toBeInTheDocument();
  await user.click(within(deleteDialog).getByRole('button', { name: /Delete task/, hidden: true }));

  await waitFor(() => expect(screen.queryByText('Plan the backend')).not.toBeInTheDocument());
  expect(isDeleted).toBe(true);
});

test('the Open view hides done tasks and is remembered on this device', async () => {
  currentTasksByGroupId['group-today'] = todayTasks.map((task) =>
    task.id === 'task-review' ? { ...task, isDone: true } : task,
  );
  const user = await openTasksPage();

  await user.click(screen.getByRole('radio', { name: 'Open' }));

  expect(screen.queryByText('Review the check-in flow')).not.toBeInTheDocument();
  expect(screen.getByText('Plan the backend')).toBeInTheDocument();
  expect(window.localStorage.getItem('daibx:task-view')).toBe('open');
});

test('the start button stays disabled until the calendar arrives', async () => {
  await openTasksPage();

  expect(screen.getByRole('button', { name: 'Start Review the check-in flow' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
});

test('creating a group sends its name and category and opens it', async () => {
  let receivedBody: unknown;
  backendServer.use(
    http.post('/backend/task-groups', async ({ request }) => {
      receivedBody = await request.json();
      const createdGroup: TaskGroup = {
        id: 'group-chinese',
        name: 'Chinese',
        category: studiesCategory,
        openTaskCount: 0,
        taskCount: 0,
      };
      currentGroups = [createdGroup, ...currentGroups];
      currentTasksByGroupId['group-chinese'] = [];
      return HttpResponse.json(createdGroup, { status: 201 });
    }),
  );
  const user = await openTasksPage();

  await user.click(screen.getAllByRole('button', { name: 'New group' })[0] as HTMLElement);
  const newGroupDialog = screen.getByRole('dialog', { name: 'New group', hidden: true });
  await user.type(
    within(newGroupDialog).getByRole('textbox', { name: 'Name', hidden: true }),
    'Chinese',
  );
  await user.click(within(newGroupDialog).getByText('Studies'));
  await user.click(
    within(newGroupDialog).getByRole('button', { name: 'Create group', hidden: true }),
  );

  expect(await screen.findByRole('heading', { level: 1, name: 'Chinese' })).toBeInTheDocument();
  expect(receivedBody).toEqual({ name: 'Chinese', categoryId: 'category-studies' });
  expect(screen.getByText(/has no tasks yet/)).toBeInTheDocument();
});

test('group settings rename the group and change its category', async () => {
  let receivedBody: unknown;
  backendServer.use(
    http.patch('/backend/task-groups/group-today', async ({ request }) => {
      receivedBody = await request.json();
      return HttpResponse.json({ ...todayGroup, name: 'Monday', category: goalsCategory });
    }),
  );
  const user = await openTasksPage();

  await user.click(screen.getByRole('button', { name: 'Group settings' }));
  const settingsDialog = screen.getByRole('dialog', { name: 'Group settings', hidden: true });
  const nameInput = within(settingsDialog).getByRole('textbox', { name: 'Name', hidden: true });
  await user.clear(nameInput);
  await user.type(nameInput, 'Monday');
  await user.click(within(settingsDialog).getByText('Goals'));
  await user.click(within(settingsDialog).getByRole('button', { name: 'Save', hidden: true }));

  expect(await screen.findByRole('heading', { level: 1, name: 'Monday' })).toBeInTheDocument();
  expect(receivedBody).toEqual({ name: 'Monday', categoryId: 'category-goals' });
});

test('deleting a group asks first, then opens the next one', async () => {
  backendServer.use(
    http.delete('/backend/task-groups/group-today', () => {
      currentGroups = currentGroups.filter((group) => group.id !== 'group-today');
      return HttpResponse.json({ status: 'deleted' });
    }),
  );
  const user = await openTasksPage();

  await user.click(screen.getByRole('button', { name: 'Group settings' }));
  await user.click(
    within(screen.getByRole('dialog', { name: 'Group settings', hidden: true })).getByRole(
      'button',
      {
        name: /Delete group/,
        hidden: true,
      },
    ),
  );
  const deleteDialog = screen.getByRole('dialog', { name: 'Delete group', hidden: true });
  expect(within(deleteDialog).getByText(/All 3 of its tasks/)).toBeInTheDocument();
  await user.click(
    within(deleteDialog).getByRole('button', { name: 'Delete group and tasks', hidden: true }),
  );

  expect(await screen.findByText('Ship the frontend')).toBeInTheDocument();
});

test('with no groups it offers to create or import one', async () => {
  currentGroups = [];
  renderWithToaster(<TasksPage />);

  expect(await screen.findByText('No groups yet')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /Import a group/ }).length).toBeGreaterThan(0);
});

const captureMove = (taskId: string, answer: () => Response) => {
  let receivedBody: unknown;
  backendServer.use(
    http.post(`/backend/tasks/${taskId}/move`, async ({ request }) => {
      receivedBody = await request.json();
      return answer();
    }),
  );
  return () => receivedBody;
};

const movedAnswer = (tasks: TaskRecord[], affectedGroups: unknown[] = []) =>
  HttpResponse.json({ ...groupTasksOf(todayGroup, tasks), affectedGroups });

const topLevelNames = () =>
  [...document.querySelectorAll('ul[aria-label="Tasks"] > li > .group\\/row .min-w-0.flex-1')].map(
    (nameElement) => nameElement.textContent,
  );

const openTaskMenu = async (user: ReturnType<typeof userEvent.setup>, taskName: string) => {
  await user.click(screen.getByRole('button', { name: `More actions for ${taskName}` }));
  return screen.getByRole('menu', { name: 'Task actions', hidden: true });
};

test('Move down in the task menu moves the task one place down', async () => {
  const readMoveBody = captureMove('task-plan', () =>
    movedAnswer([
      { ...todayTasks[0], position: 1 } as TaskRecord,
      todayTasks[1] as TaskRecord,
      { ...todayTasks[2], position: 0 } as TaskRecord,
    ]),
  );
  const user = await openTasksPage();

  const taskMenu = await openTaskMenu(user, 'Plan the backend');
  await user.click(within(taskMenu).getByRole('menuitem', { name: 'Move down', hidden: true }));

  await waitFor(() =>
    expect(topLevelNames()).toEqual(['Review the check-in flow', 'Plan the backend']),
  );
  expect(readMoveBody()).toEqual({ groupId: 'group-today', parentId: null, position: 1 });
});

test('Move up is off for the first task in its list', async () => {
  const user = await openTasksPage();

  const taskMenu = await openTaskMenu(user, 'Plan the backend');

  expect(within(taskMenu).getByRole('menuitem', { name: 'Move up', hidden: true })).toBeDisabled();
});

test('dragging a task onto another row puts it in that place', async () => {
  const readMoveBody = captureMove('task-review', () =>
    movedAnswer([
      { ...todayTasks[0], position: 1 } as TaskRecord,
      todayTasks[1] as TaskRecord,
      { ...todayTasks[2], position: 0 } as TaskRecord,
    ]),
  );
  await openTasksPage();
  const dragData = new Map<string, string>();
  const dataTransfer = {
    setData: (dataType: string, dataValue: string) => dragData.set(dataType, dataValue),
    getData: (dataType: string) => dragData.get(dataType) ?? '',
    effectAllowed: 'move',
    dropEffect: 'move',
  };

  fireEvent.dragStart(within(taskRow('Review the check-in flow')).getByTitle('Drag to reorder'), {
    dataTransfer,
  });
  fireEvent.dragOver(taskRow('Plan the backend'), { dataTransfer });
  fireEvent.drop(taskRow('Plan the backend'), { dataTransfer });

  await waitFor(() =>
    expect(topLevelNames()).toEqual(['Review the check-in flow', 'Plan the backend']),
  );
  expect(readMoveBody()).toEqual({ groupId: 'group-today', parentId: null, position: 0 });
});

test('Move to puts a task under a task in another group and updates both counts', async () => {
  const readMoveBody = captureMove('task-plan', () =>
    movedAnswer(
      [{ ...todayTasks[2], position: 0 } as TaskRecord],
      [
        { id: 'group-today', openTaskCount: 1, taskCount: 1 },
        { id: 'group-daibx', openTaskCount: 3, taskCount: 3 },
      ],
    ),
  );
  const user = await openTasksPage();

  const taskMenu = await openTaskMenu(user, 'Plan the backend');
  await user.click(within(taskMenu).getByRole('menuitem', { name: 'Move to…', hidden: true }));
  const moveDialog = screen.getByRole('dialog', { name: 'Move Plan the backend', hidden: true });
  await user.click(within(moveDialog).getByText('DaiBX'));
  await user.click(await within(moveDialog).findByText('Under Ship the frontend'));
  await user.click(within(moveDialog).getByRole('button', { name: 'Move task', hidden: true }));

  await waitFor(() => expect(screen.queryByText('Plan the backend')).not.toBeInTheDocument());
  expect(readMoveBody()).toEqual({ groupId: 'group-daibx', parentId: 'task-ship', position: 0 });
  expect(within(screen.getByRole('button', { name: /DaiBX/ })).getByText('3')).toBeInTheDocument();
});

const chooseImportFile = async (
  user: ReturnType<typeof userEvent.setup>,
  fileName: string,
  fileText: string,
) => {
  await user.click(screen.getAllByRole('button', { name: /Import a group/ })[0] as HTMLElement);
  const importDialog = screen.getByRole('dialog', { name: 'Import a group', hidden: true });
  const fileInput = importDialog.querySelector<HTMLInputElement>('input[type="file"]');
  if (fileInput === null) throw new Error('the import dialog has no file input');
  await user.upload(fileInput, new File([fileText], fileName, { type: 'application/json' }));
  return importDialog;
};

const planFile = {
  name: 'Today',
  tasks: [
    { name: 'DaiBX – Wire the page', tasks: [{ name: 'Check it', tasks: [] }] },
    { name: 'Chinese – Cards', tasks: [] },
  ],
};

test('importing a plan file previews it, sends it as it is and opens the new group', async () => {
  let receivedBody: unknown;
  backendServer.use(
    http.post('/backend/task-groups/import', async ({ request }) => {
      receivedBody = await request.json();
      const importedGroup: TaskGroup = {
        id: 'group-imported',
        name: 'Today',
        category: null,
        openTaskCount: 3,
        taskCount: 3,
      };
      return HttpResponse.json(
        groupTasksOf(importedGroup, [
          taskRecord('i1', 'DaiBX – Wire the page', null, 0),
          taskRecord('i2', 'Check it', 'i1', 0),
          taskRecord('i3', 'Chinese – Cards', null, 1),
        ]),
        { status: 201 },
      );
    }),
  );
  const user = await openTasksPage();

  const importDialog = await chooseImportFile(user, '2026-10-29.json', JSON.stringify(planFile));
  expect(within(importDialog).getByText('New group “Today”')).toBeInTheDocument();
  expect(within(importDialog).getByText(/3 tasks · 2 levels deep/)).toBeInTheDocument();
  await user.click(
    within(importDialog).getByRole('button', { name: 'Import group', hidden: true }),
  );

  expect(await screen.findByText('Check it')).toBeInTheDocument();
  expect(receivedBody).toEqual(planFile);
  expect(screen.getAllByRole('button', { name: /^Today/ })).toHaveLength(2);
});

test('a problem the server finds is shown with where it is', async () => {
  backendServer.use(
    http.post('/backend/task-groups/import', () =>
      HttpResponse.json(
        { error: 'every task needs a name', path: 'tasks[0].tasks[0].name' },
        { status: 422 },
      ),
    ),
  );
  const user = await openTasksPage();

  const importDialog = await chooseImportFile(user, 'bad.json', JSON.stringify(planFile));
  await user.click(
    within(importDialog).getByRole('button', { name: 'Import group', hidden: true }),
  );

  expect(await within(importDialog).findByText('Every task needs a name.')).toBeInTheDocument();
  expect(within(importDialog).getByText('tasks[0].tasks[0].name')).toBeInTheDocument();
  expect(
    within(importDialog).getByRole('button', { name: 'Import group', hidden: true }),
  ).toBeDisabled();
});

test('a file that is not JSON is refused before anything is sent', async () => {
  const user = await openTasksPage();

  const importDialog = await chooseImportFile(user, 'notes.json', '{ nope');

  expect(within(importDialog).getByText("The file isn't valid JSON.")).toBeInTheDocument();
  expect(
    within(importDialog).getByRole('button', { name: 'Import group', hidden: true }),
  ).toBeDisabled();
});

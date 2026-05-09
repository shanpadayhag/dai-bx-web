import {
  buildTreeFromRows,
  collectSubtreeIds,
  deleteTaskById,
  findTaskInTree,
  flattenTasks,
  getSiblingsOf,
  insertSubtask,
  isVisibleToday,
  reorderTasksByParent,
  toTaskRow,
  toggleTaskCompletionById,
  toggleTaskOpenById,
} from '@features/tasks/data-access/tasks.tree';
import type { Task, TaskRow } from '@features/tasks/data-access/tasks.types';

const today = new Date().toISOString().slice(0, 10);

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: overrides.id ?? 't',
  name: overrides.name ?? 'Task',
  order: overrides.order ?? 0,
  hiddenUntil: overrides.hiddenUntil ?? null,
  completedDate: overrides.completedDate ?? null,
  isOpen: overrides.isOpen ?? true,
  alarm: overrides.alarm ?? null,
  tasks: overrides.tasks ?? [],
});

describe('isVisibleToday', () => {
  it('returns true when hiddenUntil is null', () => {
    expect(isVisibleToday(makeTask({ hiddenUntil: null }))).toBe(true);
  });

  it('returns false when hiddenUntil is after today', () => {
    expect(isVisibleToday(makeTask({ hiddenUntil: '9999-12-31' }))).toBe(false);
  });
});

describe('insertSubtask', () => {
  it('appends the provided task under the matching parent', () => {
    const tasks: Task[] = [makeTask({ id: 'a' })];
    const child = makeTask({ id: 'a-1', name: 'child' });
    const next = insertSubtask(tasks, 'a', child);

    expect(next[0].tasks.length).toBe(1);
    expect(next[0].tasks[0]).toBe(child);
  });

  it('walks into nested parents', () => {
    const tasks: Task[] = [makeTask({ id: 'a', tasks: [makeTask({ id: 'b' })] })];
    const grand = makeTask({ id: 'b-1', name: 'grand' });
    const next = insertSubtask(tasks, 'b', grand);
    expect(next[0].tasks[0].tasks[0]).toBe(grand);
  });

  it('does not mutate the input tree', () => {
    const tasks: Task[] = [makeTask({ id: 'a' })];
    insertSubtask(tasks, 'a', makeTask({ id: 'a-1' }));
    expect(tasks[0].tasks.length).toBe(0);
  });
});

describe('deleteTaskById', () => {
  it('removes a top-level task', () => {
    const tasks: Task[] = [makeTask({ id: 'a' }), makeTask({ id: 'b' })];
    expect(deleteTaskById(tasks, 'a').map((t) => t.id)).toEqual(['b']);
  });

  it('removes a nested task without dropping its siblings', () => {
    const tasks: Task[] = [
      makeTask({ id: 'a', tasks: [makeTask({ id: 'b' }), makeTask({ id: 'c' })] }),
    ];
    expect(deleteTaskById(tasks, 'b')[0].tasks.map((t) => t.id)).toEqual(['c']);
  });
});

describe('toggleTaskCompletionById', () => {
  it('marks an uncompleted task as completed today', () => {
    const next = toggleTaskCompletionById([makeTask({ id: 'a' })], 'a');
    expect(next[0].completedDate).toBe(today);
  });

  it('clears completion when toggled while already completed today', () => {
    const next = toggleTaskCompletionById([makeTask({ id: 'a', completedDate: today })], 'a');
    expect(next[0].completedDate).toBeNull();
  });

  it('cascades the completion state to all descendants', () => {
    const tasks: Task[] = [
      makeTask({ id: 'a', tasks: [makeTask({ id: 'b', tasks: [makeTask({ id: 'c' })] })] }),
    ];
    const next = toggleTaskCompletionById(tasks, 'a');
    expect(next[0].completedDate).toBe(today);
    expect(next[0].tasks[0].completedDate).toBe(today);
    expect(next[0].tasks[0].tasks[0].completedDate).toBe(today);
  });
});

describe('toggleTaskOpenById', () => {
  it('flips a nested task open state', () => {
    const tasks: Task[] = [makeTask({ id: 'a', tasks: [makeTask({ id: 'b', isOpen: true })] })];
    const next = toggleTaskOpenById(tasks, 'b', false);
    expect(next[0].tasks[0].isOpen).toBe(false);
    expect(next[0].isOpen).toBe(true);
  });
});

describe('reorderTasksByParent', () => {
  it('reorders root tasks and reindexes order', () => {
    const tasks: Task[] = [
      makeTask({ id: 'a', order: 0 }),
      makeTask({ id: 'b', order: 1 }),
      makeTask({ id: 'c', order: 2 }),
    ];
    const next = reorderTasksByParent(tasks, null, 0, 2);
    expect(next.map((t) => t.id)).toEqual(['b', 'c', 'a']);
    expect(next.map((t) => t.order)).toEqual([0, 1, 2]);
  });

  it('reorders subtasks of a specific parent', () => {
    const tasks: Task[] = [
      makeTask({
        id: 'a',
        tasks: [
          makeTask({ id: 'a1', order: 0 }),
          makeTask({ id: 'a2', order: 1 }),
          makeTask({ id: 'a3', order: 2 }),
        ],
      }),
    ];
    const next = reorderTasksByParent(tasks, 'a', 2, 0);
    expect(next[0].tasks.map((t) => t.id)).toEqual(['a3', 'a1', 'a2']);
  });

  it('ignores out-of-bounds indices', () => {
    const tasks: Task[] = [makeTask({ id: 'a' })];
    expect(reorderTasksByParent(tasks, null, 0, 5).map((t) => t.id)).toEqual(['a']);
  });
});

describe('collectSubtreeIds', () => {
  it('returns the task and all descendants in pre-order', () => {
    const task = makeTask({
      id: 'root',
      tasks: [makeTask({ id: 'a', tasks: [makeTask({ id: 'a1' })] }), makeTask({ id: 'b' })],
    });
    expect(collectSubtreeIds(task)).toEqual(['root', 'a', 'a1', 'b']);
  });
});

describe('findTaskInTree', () => {
  it('finds a root task and reports null parent', () => {
    const tasks: Task[] = [makeTask({ id: 'a' })];
    const ctx = findTaskInTree(tasks, 'a');
    expect(ctx?.parentId).toBeNull();
    expect(ctx?.task.id).toBe('a');
  });

  it('finds a nested task and reports the correct parent', () => {
    const tasks: Task[] = [makeTask({ id: 'a', tasks: [makeTask({ id: 'a1' })] })];
    const ctx = findTaskInTree(tasks, 'a1');
    expect(ctx?.parentId).toBe('a');
  });

  it('returns null when the task is not present', () => {
    expect(findTaskInTree([makeTask({ id: 'a' })], 'missing')).toBeNull();
  });
});

describe('getSiblingsOf', () => {
  it('returns root tasks when parentId is null', () => {
    const tasks: Task[] = [makeTask({ id: 'a' }), makeTask({ id: 'b' })];
    expect(getSiblingsOf(tasks, null).map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('returns child tasks of the named parent', () => {
    const tasks: Task[] = [
      makeTask({ id: 'a', tasks: [makeTask({ id: 'a1' }), makeTask({ id: 'a2' })] }),
    ];
    expect(getSiblingsOf(tasks, 'a').map((t) => t.id)).toEqual(['a1', 'a2']);
  });
});

describe('toTaskRow', () => {
  it('converts a Task into a TaskRow with foreign keys', () => {
    const row = toTaskRow(makeTask({ id: 't', name: 'X', order: 2 }), 'g', 'parent');
    expect(row).toEqual({
      id: 't',
      groupId: 'g',
      parentId: 'parent',
      name: 'X',
      order: 2,
      hiddenUntil: null,
      completedDate: null,
      isOpen: true,
      alarm: null,
    });
  });
});

describe('flattenTasks', () => {
  it('emits a row for every task with the right parent links', () => {
    const tasks: Task[] = [
      makeTask({ id: 'a', tasks: [makeTask({ id: 'a1' })] }),
      makeTask({ id: 'b' }),
    ];
    const rows = flattenTasks(tasks, 'g');
    expect(rows.map((r) => [r.id, r.parentId])).toEqual([
      ['a', null],
      ['a1', 'a'],
      ['b', null],
    ]);
  });
});

describe('buildTreeFromRows', () => {
  it('reconstructs a nested tree sorted by order', () => {
    const rows: TaskRow[] = [
      {
        id: 'a1',
        groupId: 'g',
        parentId: 'a',
        name: 'a1',
        order: 1,
        hiddenUntil: null,
        completedDate: null,
        isOpen: true,
        alarm: null,
      },
      {
        id: 'a',
        groupId: 'g',
        parentId: null,
        name: 'a',
        order: 0,
        hiddenUntil: null,
        completedDate: null,
        isOpen: true,
        alarm: null,
      },
      {
        id: 'b',
        groupId: 'g',
        parentId: null,
        name: 'b',
        order: 1,
        hiddenUntil: null,
        completedDate: null,
        isOpen: true,
        alarm: null,
      },
      {
        id: 'a0',
        groupId: 'g',
        parentId: 'a',
        name: 'a0',
        order: 0,
        hiddenUntil: null,
        completedDate: null,
        isOpen: true,
        alarm: null,
      },
    ];
    const tree = buildTreeFromRows(rows);
    expect(tree.map((t) => t.id)).toEqual(['a', 'b']);
    expect(tree[0].tasks.map((t) => t.id)).toEqual(['a0', 'a1']);
  });
});

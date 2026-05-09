import {
  addSubtaskById,
  deleteTaskById,
  isVisibleToday,
  reorderTasksByParent,
  toggleTaskCompletionById,
  toggleTaskOpenById,
} from '@features/tasks/data-access/tasks.tree';
import type { Task } from '@features/tasks/data-access/tasks.types';

const today = new Date().toISOString().slice(0, 10);

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: overrides.id ?? 't',
  name: overrides.name ?? 'Task',
  order: overrides.order ?? 0,
  hiddenUntil: overrides.hiddenUntil ?? null,
  completedDate: overrides.completedDate ?? null,
  isOpen: overrides.isOpen ?? true,
  tasks: overrides.tasks ?? [],
});

describe('isVisibleToday', () => {
  it('returns true when hiddenUntil is null', () => {
    expect(isVisibleToday(makeTask({ hiddenUntil: null }))).toBe(true);
  });

  it('returns true when hiddenUntil is on or before today', () => {
    expect(isVisibleToday(makeTask({ hiddenUntil: today }))).toBe(true);
    expect(isVisibleToday(makeTask({ hiddenUntil: '2000-01-01' }))).toBe(true);
  });

  it('returns false when hiddenUntil is after today', () => {
    expect(isVisibleToday(makeTask({ hiddenUntil: '9999-12-31' }))).toBe(false);
  });
});

describe('addSubtaskById', () => {
  it('appends a subtask to the matching parent', () => {
    const tasks: Task[] = [makeTask({ id: 'a', name: 'A' })];
    const next = addSubtaskById(tasks, 'a', 'child');

    expect(next[0].tasks.length).toBe(1);
    expect(next[0].tasks[0].name).toBe('child');
    expect(next[0].tasks[0].order).toBe(0);
    expect(next[0].tasks[0].isOpen).toBe(true);
  });

  it('appends to the correct nested parent', () => {
    const tasks: Task[] = [
      makeTask({
        id: 'a',
        tasks: [makeTask({ id: 'b', tasks: [] })],
      }),
    ];

    const next = addSubtaskById(tasks, 'b', 'grand');
    expect(next[0].tasks[0].tasks.length).toBe(1);
    expect(next[0].tasks[0].tasks[0].name).toBe('grand');
  });

  it('returns a new tree without mutating the input', () => {
    const tasks: Task[] = [makeTask({ id: 'a' })];
    const next = addSubtaskById(tasks, 'a', 'x');
    expect(next).not.toBe(tasks);
    expect(tasks[0].tasks.length).toBe(0);
  });
});

describe('deleteTaskById', () => {
  it('removes a top-level task', () => {
    const tasks: Task[] = [makeTask({ id: 'a' }), makeTask({ id: 'b' })];
    const next = deleteTaskById(tasks, 'a');
    expect(next.length).toBe(1);
    expect(next[0].id).toBe('b');
  });

  it('removes a nested task without dropping its siblings', () => {
    const tasks: Task[] = [
      makeTask({
        id: 'a',
        tasks: [makeTask({ id: 'b' }), makeTask({ id: 'c' })],
      }),
    ];
    const next = deleteTaskById(tasks, 'b');
    expect(next[0].tasks.length).toBe(1);
    expect(next[0].tasks[0].id).toBe('c');
  });
});

describe('toggleTaskCompletionById', () => {
  it('marks an uncompleted task as completed today', () => {
    const tasks: Task[] = [makeTask({ id: 'a', completedDate: null })];
    const next = toggleTaskCompletionById(tasks, 'a');
    expect(next[0].completedDate).toBe(today);
  });

  it('clears completion when toggled while already completed today', () => {
    const tasks: Task[] = [makeTask({ id: 'a', completedDate: today })];
    const next = toggleTaskCompletionById(tasks, 'a');
    expect(next[0].completedDate).toBeNull();
  });

  it('cascades the completion state to all descendants', () => {
    const tasks: Task[] = [
      makeTask({
        id: 'a',
        tasks: [
          makeTask({
            id: 'b',
            tasks: [makeTask({ id: 'c' })],
          }),
        ],
      }),
    ];
    const next = toggleTaskCompletionById(tasks, 'a');
    expect(next[0].completedDate).toBe(today);
    expect(next[0].tasks[0].completedDate).toBe(today);
    expect(next[0].tasks[0].tasks[0].completedDate).toBe(today);
  });
});

describe('toggleTaskOpenById', () => {
  it('flips a nested task open state', () => {
    const tasks: Task[] = [
      makeTask({
        id: 'a',
        isOpen: true,
        tasks: [makeTask({ id: 'b', isOpen: true })],
      }),
    ];
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
    expect(next[0].tasks.map((t) => t.order)).toEqual([0, 1, 2]);
  });

  it('returns the same shape when from === to', () => {
    const tasks: Task[] = [makeTask({ id: 'a' }), makeTask({ id: 'b' })];
    const next = reorderTasksByParent(tasks, null, 1, 1);
    expect(next.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('ignores out-of-bounds indices', () => {
    const tasks: Task[] = [makeTask({ id: 'a' })];
    const next = reorderTasksByParent(tasks, null, 0, 5);
    expect(next.map((t) => t.id)).toEqual(['a']);
  });
});

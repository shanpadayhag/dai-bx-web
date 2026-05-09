import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TasksRepository } from '@features/tasks/data-access/tasks.repository';
import { TasksState } from '@features/tasks/data-access/tasks.state';
import type { TaskRow } from '@features/tasks/data-access/tasks.types';

class FakeTasksRepository implements Pick<
  TasksRepository,
  'listAll' | 'listByGroup' | 'put' | 'putBatch' | 'deleteByIds'
> {
  rows = new Map<string, TaskRow>();
  putCalls = 0;
  putBatchCalls = 0;
  deleteByIdsCalls = 0;

  async listAll(): Promise<TaskRow[]> {
    return Array.from(this.rows.values());
  }
  async listByGroup(groupId: string): Promise<TaskRow[]> {
    return Array.from(this.rows.values()).filter((t) => t.groupId === groupId);
  }
  async put(row: TaskRow): Promise<void> {
    this.putCalls++;
    this.rows.set(row.id, { ...row });
  }
  async putBatch(rows: TaskRow[]): Promise<void> {
    this.putBatchCalls++;
    for (const r of rows) this.rows.set(r.id, { ...r });
  }
  async deleteByIds(ids: string[]): Promise<void> {
    this.deleteByIdsCalls++;
    for (const id of ids) this.rows.delete(id);
  }
}

describe('TasksState', () => {
  let state: TasksState;
  let repo: FakeTasksRepository;

  beforeEach(() => {
    repo = new FakeTasksRepository();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: TasksRepository, useValue: repo }],
    });
    state = TestBed.inject(TasksState);
  });

  it('returns an empty list for an unknown group before load', () => {
    expect(state.tasksFor('g')).toEqual([]);
    expect(state.isLoaded()).toBe(false);
  });

  it('loadAll groups rows by groupId and builds nested trees', async () => {
    repo.rows.set('t1', {
      id: 't1',
      groupId: 'g1',
      parentId: null,
      name: 'one',
      order: 0,
      hiddenUntil: null,
      completedDate: null,
      isOpen: true,
      alarm: null,
      timerSets: [],
      activeTimerSetId: null,
    });
    repo.rows.set('t1-1', {
      id: 't1-1',
      groupId: 'g1',
      parentId: 't1',
      name: 'child',
      order: 0,
      hiddenUntil: null,
      completedDate: null,
      isOpen: true,
      alarm: null,
      timerSets: [],
      activeTimerSetId: null,
    });
    repo.rows.set('t2', {
      id: 't2',
      groupId: 'g2',
      parentId: null,
      name: 'other group',
      order: 0,
      hiddenUntil: null,
      completedDate: null,
      isOpen: true,
      alarm: null,
      timerSets: [],
      activeTimerSetId: null,
    });

    await state.loadAll();
    expect(state.isLoaded()).toBe(true);
    expect(state.tasksFor('g1').map((t) => t.id)).toEqual(['t1']);
    expect(state.tasksFor('g1')[0].tasks.map((t) => t.id)).toEqual(['t1-1']);
    expect(state.tasksFor('g2').map((t) => t.id)).toEqual(['t2']);
  });

  it('addRoot persists a single row tied to the group', () => {
    state.addRoot('g', 'first');
    expect(state.tasksFor('g').map((t) => t.name)).toEqual(['first']);
    expect(repo.rows.size).toBe(1);
    const row = Array.from(repo.rows.values())[0];
    expect(row.groupId).toBe('g');
    expect(row.parentId).toBeNull();
    expect(row.order).toBe(0);
  });

  it('addRoot ignores empty names', () => {
    state.addRoot('g', '   ');
    expect(state.tasksFor('g')).toEqual([]);
    expect(repo.putCalls).toBe(0);
  });

  it('addSubtask records the parent foreign key', () => {
    state.addRoot('g', 'parent');
    const parentId = state.tasksFor('g')[0].id;
    state.addSubtask('g', parentId, 'child');
    const childRow = Array.from(repo.rows.values()).find((t) => t.name === 'child');
    expect(childRow?.parentId).toBe(parentId);
  });

  it('remove deletes the task and its descendants', () => {
    state.addRoot('g', 'parent');
    const parentId = state.tasksFor('g')[0].id;
    state.addSubtask('g', parentId, 'child');
    const childId = state.tasksFor('g')[0].tasks[0].id;
    state.addSubtask('g', childId, 'grand');

    state.remove('g', parentId);
    expect(state.tasksFor('g')).toEqual([]);
    expect(repo.rows.size).toBe(0);
    expect(repo.deleteByIdsCalls).toBe(1);
  });

  it('toggleCompletion writes the affected subtree', () => {
    state.addRoot('g', 'parent');
    const parentId = state.tasksFor('g')[0].id;
    state.addSubtask('g', parentId, 'child');

    const before = repo.putBatchCalls;
    state.toggleCompletion('g', parentId);
    const today = new Date().toISOString().slice(0, 10);
    expect(state.tasksFor('g')[0].completedDate).toBe(today);
    expect(state.tasksFor('g')[0].tasks[0].completedDate).toBe(today);
    expect(repo.putBatchCalls - before).toBe(1);
  });

  it('reorder reorders siblings and persists the affected rows', () => {
    state.addRoot('g', 'one');
    state.addRoot('g', 'two');
    state.addRoot('g', 'three');

    const before = repo.putBatchCalls;
    state.reorder('g', null, 0, 2);
    expect(state.tasksFor('g').map((t) => t.name)).toEqual(['two', 'three', 'one']);
    expect(repo.putBatchCalls - before).toBe(1);
  });

  it('clearForGroup drops in-memory tasks for that group only', () => {
    state.addRoot('g1', 'a');
    state.addRoot('g2', 'b');
    state.clearForGroup('g1');
    expect(state.tasksFor('g1')).toEqual([]);
    expect(state.tasksFor('g2').map((t) => t.name)).toEqual(['b']);
  });

  it('setTimerSets persists the new sets and selects a default active id', () => {
    state.addRoot('g', 'parent');
    const id = state.tasksFor('g')[0].id;
    state.setTimerSets('g', id, [
      { id: 's1', name: 'Standard', order: 0, autoAdvance: true, soundId: null, timers: [] },
      { id: 's2', name: 'Long', order: 1, autoAdvance: true, soundId: null, timers: [] },
    ]);
    const task = state.tasksFor('g')[0];
    expect(task.timerSets.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(task.activeTimerSetId).toBe('s1');
    expect(repo.rows.get(id)?.timerSets.length).toBe(2);
  });

  it('setActiveTimerSetId switches between sets', () => {
    state.addRoot('g', 'parent');
    const id = state.tasksFor('g')[0].id;
    state.setTimerSets('g', id, [
      { id: 's1', name: 'a', order: 0, autoAdvance: true, soundId: null, timers: [] },
      { id: 's2', name: 'b', order: 1, autoAdvance: true, soundId: null, timers: [] },
    ]);
    state.setActiveTimerSetId('g', id, 's2');
    expect(state.tasksFor('g')[0].activeTimerSetId).toBe('s2');
  });

  it('findTask locates a task across groups', () => {
    state.addRoot('g1', 'one');
    state.addRoot('g2', 'two');
    const id = state.tasksFor('g2')[0].id;
    expect(state.findTask(id)?.groupId).toBe('g2');
    expect(state.findTask('missing')).toBeNull();
  });
});

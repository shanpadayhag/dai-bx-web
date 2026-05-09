import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SoundsState } from '@features/sounds/data-access/sounds.state';
import { TasksRepository } from '@features/tasks/data-access/tasks.repository';
import { TasksState } from '@features/tasks/data-access/tasks.state';
import type { TaskRow } from '@features/tasks/data-access/tasks.types';
import { TimersRunner } from '@features/timers/data-access/timers.runner';
import type { TimerSet } from '@features/timers/data-access/timers.types';

const STORAGE_KEY = 'daibx_timer_run';

class FakeTasksRepository implements Pick<
  TasksRepository,
  'listAll' | 'listByGroup' | 'put' | 'putBatch' | 'deleteByIds'
> {
  rows = new Map<string, TaskRow>();
  async listAll(): Promise<TaskRow[]> {
    return Array.from(this.rows.values());
  }
  async listByGroup(): Promise<TaskRow[]> {
    return [];
  }
  async put(row: TaskRow): Promise<void> {
    this.rows.set(row.id, { ...row });
  }
  async putBatch(rows: TaskRow[]): Promise<void> {
    for (const r of rows) this.rows.set(r.id, { ...r });
  }
  async deleteByIds(): Promise<void> {}
}

class FakeSoundsState {
  defaultSoundIdValue: string | null = null;
  defaultSoundId(): string | null {
    return this.defaultSoundIdValue;
  }
  async getBlob(): Promise<Blob | null> {
    return null;
  }
}

const seed = (overrides: Partial<TimerSet> = {}): TimerSet => ({
  id: overrides.id ?? 's1',
  name: overrides.name ?? 'Standard',
  order: overrides.order ?? 0,
  autoAdvance: overrides.autoAdvance ?? true,
  soundId: overrides.soundId ?? null,
  timers: overrides.timers ?? [
    { id: 'a', durationMinutes: 3, order: 0 },
    { id: 'b', durationMinutes: 8, order: 1 },
  ],
});

const buildTask = (timerSets: TimerSet[]): TaskRow => ({
  id: 't1',
  groupId: 'g1',
  parentId: null,
  name: 'Task',
  order: 0,
  hiddenUntil: null,
  completedDate: null,
  isOpen: true,
  alarm: null,
  timerSets,
  activeTimerSetId: timerSets[0]?.id ?? null,
});

describe('TimersRunner', () => {
  let runner: TimersRunner;
  let tasks: TasksState;
  let repo: FakeTasksRepository;

  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);
    jasmine.clock().uninstall();
    jasmine.clock().install();

    repo = new FakeTasksRepository();
    repo.rows.set('t1', buildTask([seed()]));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: TasksRepository, useValue: repo },
        { provide: SoundsState, useClass: FakeSoundsState },
      ],
    });

    tasks = TestBed.inject(TasksState);
    await tasks.loadAll();
    runner = TestBed.inject(TimersRunner);
    TestBed.tick();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    localStorage.removeItem(STORAGE_KEY);
  });

  it('starts in idle state', () => {
    expect(runner.run().status).toBe('idle');
  });

  it('start() transitions to running on the first step', () => {
    runner.start('g1', 't1', 's1');
    const r = runner.run();
    expect(r.status).toBe('running');
    if (r.status === 'running') expect(r.currentIndex).toBe(0);
  });

  it('start() is a no-op when the timer set is unknown', () => {
    runner.start('g1', 't1', 'missing');
    expect(runner.run().status).toBe('idle');
  });

  it('start() is a no-op when the set has no timers', async () => {
    repo.rows.set('t1', buildTask([{ ...seed(), timers: [] }]));
    await tasks.loadAll();
    TestBed.tick();
    runner.start('g1', 't1', 's1');
    expect(runner.run().status).toBe('idle');
  });

  it('auto-advances to the next step when autoAdvance is true', () => {
    runner.start('g1', 't1', 's1');
    TestBed.tick();
    jasmine.clock().tick(3 * 60_000 + 10);
    TestBed.tick();
    const r = runner.run();
    expect(r.status).toBe('running');
    if (r.status === 'running') expect(r.currentIndex).toBe(1);
  });

  it('lands in completed after the final step finishes', () => {
    runner.start('g1', 't1', 's1');
    TestBed.tick();
    jasmine.clock().tick(3 * 60_000 + 10);
    TestBed.tick();
    jasmine.clock().tick(8 * 60_000 + 10);
    TestBed.tick();
    expect(runner.run().status).toBe('completed');
  });

  it('waits for advance() when autoAdvance is false', async () => {
    repo.rows.set('t1', buildTask([{ ...seed(), autoAdvance: false }]));
    await tasks.loadAll();
    TestBed.tick();

    runner.start('g1', 't1', 's1');
    TestBed.tick();
    jasmine.clock().tick(3 * 60_000 + 10);
    TestBed.tick();

    const paused = runner.run();
    expect(paused.status).toBe('awaitingAdvance');

    runner.advance();
    TestBed.tick();
    const resumed = runner.run();
    expect(resumed.status).toBe('running');
    if (resumed.status === 'running') expect(resumed.currentIndex).toBe(1);
  });

  it('cancel() returns to idle', () => {
    runner.start('g1', 't1', 's1');
    runner.cancel();
    expect(runner.run().status).toBe('idle');
  });

  it('persists running state to localStorage', () => {
    runner.start('g1', 't1', 's1');
    TestBed.tick();
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).status).toBe('running');
  });

  it('clears stored state when returning to idle', () => {
    runner.start('g1', 't1', 's1');
    TestBed.tick();
    runner.cancel();
    TestBed.tick();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('drops a hydrated run if its task disappeared', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        status: 'running',
        taskId: 'gone',
        groupId: 'g1',
        timerSetId: 's1',
        currentIndex: 0,
        stepStartedAt: new Date().toISOString(),
      }),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: TasksRepository, useValue: repo },
        { provide: SoundsState, useClass: FakeSoundsState },
      ],
    });
    const freshTasks = TestBed.inject(TasksState);
    await freshTasks.loadAll();
    const fresh = TestBed.inject(TimersRunner);
    TestBed.tick();
    expect(fresh.run().status).toBe('idle');
  });
});

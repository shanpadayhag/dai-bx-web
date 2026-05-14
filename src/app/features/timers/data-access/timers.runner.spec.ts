import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SoundsState } from '@features/sounds/data-access/sounds.state';
import { TasksRepository } from '@features/tasks/data-access/tasks.repository';
import { TasksState } from '@features/tasks/data-access/tasks.state';
import type { TaskRow } from '@features/tasks/data-access/tasks.types';
import { TimersRunner } from '@features/timers/data-access/timers.runner';
import type { TimerSet } from '@features/timers/data-access/timers.types';

const STORAGE_KEY = 'daibx_timer_runs';
const LEGACY_STORAGE_KEY = 'daibx_timer_run';

class FakeTasksRepository
  implements Pick<TasksRepository, 'listAll' | 'listByGroup' | 'put' | 'putBatch' | 'deleteByIds'>
{
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
  async deleteByIds(): Promise<void> {
    /* no-op */
  }
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

const buildTask = (id: string, timerSets: TimerSet[]): TaskRow => ({
  id,
  groupId: 'g1',
  parentId: null,
  name: `Task ${id}`,
  order: 0,
  hiddenUntil: null,
  completedDate: null,
  isOpen: true,
  alarm: null,
  timerSets,
  activeTimerSetId: timerSets[0]?.id ?? null,
});

const setupRunner = async (
  repo: FakeTasksRepository,
): Promise<{ runner: TimersRunner; tasks: TasksState }> => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: TasksRepository, useValue: repo },
      { provide: SoundsState, useClass: FakeSoundsState },
    ],
  });
  const tasks = TestBed.inject(TasksState);
  await tasks.loadAll();
  const runner = TestBed.inject(TimersRunner);
  TestBed.tick();
  return { runner, tasks };
};

describe('TimersRunner', () => {
  let repo: FakeTasksRepository;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    jasmine.clock().uninstall();
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(0));

    repo = new FakeTasksRepository();
    repo.rows.set('t1', buildTask('t1', [seed({ id: 's1' })]));
    repo.rows.set(
      't2',
      buildTask('t2', [
        {
          ...seed({ id: 's2' }),
          timers: [
            { id: 'a2', durationMinutes: 10, order: 0 },
            { id: 'b2', durationMinutes: 5, order: 1 },
          ],
        },
      ]),
    );
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  });

  it('starts with no runs', async () => {
    const { runner } = await setupRunner(repo);
    expect(Object.keys(runner.runs()).length).toBe(0);
  });

  it('start() creates a running entry for the given task', async () => {
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 's1');
    TestBed.tick();
    const r = runner.runForTask('t1');
    expect(r?.status).toBe('running');
    if (r?.status === 'running') expect(r.currentIndex).toBe(0);
  });

  it('starting on a second task keeps the first task running', async () => {
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 's1');
    runner.start('g1', 't2', 's2');
    TestBed.tick();
    expect(runner.runForTask('t1')?.status).toBe('running');
    expect(runner.runForTask('t2')?.status).toBe('running');
    expect(Object.keys(runner.runs()).length).toBe(2);
  });

  it('starting again on a task with an active run replaces only that task', async () => {
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 's1');
    runner.start('g1', 't2', 's2');
    TestBed.tick();
    runner.start('g1', 't1', 's1');
    TestBed.tick();
    expect(runner.runForTask('t1')?.status).toBe('running');
    expect(runner.runForTask('t2')?.status).toBe('running');
  });

  it('start() is a no-op when the timer set is unknown', async () => {
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 'missing');
    expect(runner.runForTask('t1')).toBeNull();
  });

  it('start() is a no-op when the set has no timers', async () => {
    repo.rows.set('t1', buildTask('t1', [{ ...seed({ id: 's1' }), timers: [] }]));
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 's1');
    expect(runner.runForTask('t1')).toBeNull();
  });

  it('a step end transitions only that task', async () => {
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 's1');
    runner.start('g1', 't2', 's2');
    TestBed.tick();
    jasmine.clock().tick(3 * 60_000 + 10);
    TestBed.tick();
    const r1 = runner.runForTask('t1');
    const r2 = runner.runForTask('t2');
    expect(r1?.status).toBe('running');
    if (r1?.status === 'running') expect(r1.currentIndex).toBe(1);
    expect(r2?.status).toBe('running');
    if (r2?.status === 'running') expect(r2.currentIndex).toBe(0);
  });

  it('completes the last step', async () => {
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 's1');
    TestBed.tick();
    jasmine.clock().tick(3 * 60_000 + 10);
    TestBed.tick();
    jasmine.clock().tick(8 * 60_000 + 10);
    TestBed.tick();
    expect(runner.runForTask('t1')?.status).toBe('completed');
  });

  it('waits for advance(taskId) when autoAdvance is false', async () => {
    repo.rows.set(
      't1',
      buildTask('t1', [{ ...seed({ id: 's1' }), autoAdvance: false }]),
    );
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 's1');
    TestBed.tick();
    jasmine.clock().tick(3 * 60_000 + 10);
    TestBed.tick();
    expect(runner.runForTask('t1')?.status).toBe('awaitingAdvance');
    runner.advance('t1');
    TestBed.tick();
    const r = runner.runForTask('t1');
    expect(r?.status).toBe('running');
    if (r?.status === 'running') expect(r.currentIndex).toBe(1);
  });

  it('cancel(taskId) removes only that task run', async () => {
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 's1');
    runner.start('g1', 't2', 's2');
    TestBed.tick();
    runner.cancel('t1');
    TestBed.tick();
    expect(runner.runForTask('t1')).toBeNull();
    expect(runner.runForTask('t2')?.status).toBe('running');
  });

  it('runningRuns is sorted by soonest end time', async () => {
    repo.rows.set(
      't1',
      buildTask('t1', [
        { ...seed({ id: 's1' }), timers: [{ id: 'a1', durationMinutes: 5, order: 0 }] },
      ]),
    );
    repo.rows.set(
      't2',
      buildTask('t2', [
        { ...seed({ id: 's2' }), timers: [{ id: 'a2', durationMinutes: 2, order: 0 }] },
      ]),
    );
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 's1');
    runner.start('g1', 't2', 's2');
    TestBed.tick();
    const order = runner.runningRuns().map((r) => r.taskId);
    expect(order).toEqual(['t2', 't1']);
  });

  it('attentionRuns is sorted by finishedAt ascending', async () => {
    repo.rows.set(
      't1',
      buildTask('t1', [
        {
          ...seed({ id: 's1' }),
          autoAdvance: false,
          timers: [{ id: 'a1', durationMinutes: 1, order: 0 }],
        },
      ]),
    );
    repo.rows.set(
      't2',
      buildTask('t2', [
        {
          ...seed({ id: 's2' }),
          autoAdvance: false,
          timers: [{ id: 'a2', durationMinutes: 2, order: 0 }],
        },
      ]),
    );
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't2', 's2');
    runner.start('g1', 't1', 's1');
    TestBed.tick();
    jasmine.clock().tick(2 * 60_000 + 10);
    TestBed.tick();
    const order = runner.attentionRuns().map((r) => r.taskId);
    expect(order).toEqual(['t1', 't2']);
  });

  it('focusedRun snaps to first attention entry by default', async () => {
    repo.rows.set(
      't1',
      buildTask('t1', [
        {
          ...seed({ id: 's1' }),
          autoAdvance: false,
          timers: [{ id: 'a1', durationMinutes: 1, order: 0 }],
        },
      ]),
    );
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 's1');
    TestBed.tick();
    jasmine.clock().tick(60_000 + 10);
    TestBed.tick();
    const f = runner.focusedRun();
    expect(f?.taskId).toBe('t1');
    expect(f?.total).toBe(1);
    expect(f?.index).toBe(0);
  });

  it('focusNext / focusPrev cycle with wrap-around', async () => {
    for (const id of ['t1', 't2', 't3']) {
      repo.rows.set(
        id,
        buildTask(id, [
          {
            ...seed({ id: `set-${id}` }),
            autoAdvance: false,
            timers: [{ id: `step-${id}`, durationMinutes: 1, order: 0 }],
          },
        ]),
      );
    }
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 'set-t1');
    runner.start('g1', 't2', 'set-t2');
    runner.start('g1', 't3', 'set-t3');
    TestBed.tick();
    jasmine.clock().tick(60_000 + 10);
    TestBed.tick();

    const ids = runner.attentionRuns().map((r) => r.taskId);
    expect(ids.length).toBe(3);

    expect(runner.focusedRun()?.taskId).toBe(ids[0]);
    runner.focusNext();
    expect(runner.focusedRun()?.taskId).toBe(ids[1]);
    runner.focusNext();
    expect(runner.focusedRun()?.taskId).toBe(ids[2]);
    runner.focusNext();
    expect(runner.focusedRun()?.taskId).toBe(ids[0]);
    runner.focusPrev();
    expect(runner.focusedRun()?.taskId).toBe(ids[2]);
  });

  it('focus snaps to the next entry when the focused run is removed', async () => {
    for (const id of ['t1', 't2']) {
      repo.rows.set(
        id,
        buildTask(id, [
          {
            ...seed({ id: `set-${id}` }),
            autoAdvance: false,
            timers: [{ id: `step-${id}`, durationMinutes: 1, order: 0 }],
          },
        ]),
      );
    }
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 'set-t1');
    runner.start('g1', 't2', 'set-t2');
    TestBed.tick();
    jasmine.clock().tick(60_000 + 10);
    TestBed.tick();

    const first = runner.focusedRun()?.taskId;
    expect(first).toBeTruthy();
    runner.dismiss(first!);
    TestBed.tick();
    const remaining = runner.focusedRun()?.taskId;
    expect(remaining).toBeTruthy();
    expect(remaining).not.toBe(first);
  });

  it('drops a run when its task is removed from TasksState', async () => {
    const { runner, tasks } = await setupRunner(repo);
    runner.start('g1', 't1', 's1');
    TestBed.tick();
    expect(runner.runForTask('t1')?.status).toBe('running');
    repo.rows.delete('t1');
    await tasks.loadAll();
    TestBed.tick();
    expect(runner.runForTask('t1')).toBeNull();
    expect(runner.runForTask('t2')).toBeNull();
  });

  it('drops a run when its timer set is removed', async () => {
    const { runner, tasks } = await setupRunner(repo);
    runner.start('g1', 't1', 's1');
    TestBed.tick();
    repo.rows.set('t1', buildTask('t1', []));
    await tasks.loadAll();
    TestBed.tick();
    expect(runner.runForTask('t1')).toBeNull();
  });

  it('persists runs under the v2 envelope', async () => {
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 's1');
    TestBed.tick();
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { v: number; runs: Record<string, { status: string }> };
    expect(parsed.v).toBe(2);
    expect(parsed.runs['t1'].status).toBe('running');
  });

  it('clears stored runs when the last run is removed', async () => {
    const { runner } = await setupRunner(repo);
    runner.start('g1', 't1', 's1');
    TestBed.tick();
    runner.cancel('t1');
    TestBed.tick();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('migrates legacy single-run payload and removes the legacy key', async () => {
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({
        status: 'running',
        taskId: 't1',
        groupId: 'g1',
        timerSetId: 's1',
        currentIndex: 0,
        stepStartedAt: new Date().toISOString(),
      }),
    );
    const { runner } = await setupRunner(repo);
    expect(runner.runForTask('t1')?.status).toBe('running');
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it('drops legacy idle payload without creating a run', async () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ status: 'idle' }));
    const { runner } = await setupRunner(repo);
    expect(Object.keys(runner.runs()).length).toBe(0);
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it('drops a hydrated run if its task disappeared', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        v: 2,
        runs: {
          gone: {
            status: 'running',
            taskId: 'gone',
            groupId: 'g1',
            timerSetId: 's1',
            currentIndex: 0,
            stepStartedAt: new Date().toISOString(),
          },
        },
      }),
    );
    const { runner } = await setupRunner(repo);
    expect(runner.runForTask('gone')).toBeNull();
    expect(Object.keys(runner.runs()).length).toBe(0);
  });

  it('replays a running run whose step end already passed', async () => {
    const past = new Date(Date.now() - 10 * 60_000).toISOString();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        v: 2,
        runs: {
          t1: {
            status: 'running',
            taskId: 't1',
            groupId: 'g1',
            timerSetId: 's1',
            currentIndex: 0,
            stepStartedAt: past,
          },
        },
      }),
    );
    const { runner } = await setupRunner(repo);
    jasmine.clock().tick(1);
    TestBed.tick();
    const r = runner.runForTask('t1');
    expect(r?.status).toBe('running');
    if (r?.status === 'running') expect(r.currentIndex).toBe(1);
  });
});

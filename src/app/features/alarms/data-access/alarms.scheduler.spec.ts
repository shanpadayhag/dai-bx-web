import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AlarmsScheduler } from '@features/alarms/data-access/alarms.scheduler';
import type { AlarmSpec } from '@features/alarms/data-access/alarms.types';
import { SoundsState } from '@features/sounds/data-access/sounds.state';
import { TasksRepository } from '@features/tasks/data-access/tasks.repository';
import { TasksState } from '@features/tasks/data-access/tasks.state';
import type { TaskRow } from '@features/tasks/data-access/tasks.types';

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

const buildTask = (id: string, alarm: AlarmSpec | null): TaskRow => ({
  id,
  groupId: 'g1',
  parentId: null,
  name: `Task ${id}`,
  order: 0,
  hiddenUntil: null,
  completedDate: null,
  isOpen: true,
  alarm,
  timerSets: [],
  activeTimerSetId: null,
});

const alarmSpec = (overrides: Partial<AlarmSpec> = {}): AlarmSpec => ({
  firesAt: overrides.firesAt ?? new Date(Date.now() + 60_000).toISOString(),
  soundId: overrides.soundId ?? null,
  enabled: overrides.enabled ?? true,
  repeat: overrides.repeat ?? 'none',
});

const setup = async (
  repo: FakeTasksRepository,
): Promise<{ scheduler: AlarmsScheduler; tasks: TasksState }> => {
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
  const scheduler = TestBed.inject(AlarmsScheduler);
  TestBed.tick();
  return { scheduler, tasks };
};

describe('AlarmsScheduler', () => {
  let repo: FakeTasksRepository;

  beforeEach(() => {
    jasmine.clock().uninstall();
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(1_700_000_000_000));

    repo = new FakeTasksRepository();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('does not fire a disabled alarm', async () => {
    repo.rows.set(
      't1',
      buildTask('t1', alarmSpec({ firesAt: new Date(Date.now() + 60_000).toISOString(), enabled: false })),
    );
    const { scheduler } = await setup(repo);
    jasmine.clock().tick(120_000);
    TestBed.tick();
    expect(scheduler.firing()).toBeNull();
  });

  it('fires an enabled one-shot alarm and disables it after firing', async () => {
    repo.rows.set(
      't1',
      buildTask(
        't1',
        alarmSpec({ firesAt: new Date(Date.now() + 60_000).toISOString(), repeat: 'none' }),
      ),
    );
    const { scheduler, tasks } = await setup(repo);
    jasmine.clock().tick(60_000 + 10);
    TestBed.tick();
    expect(scheduler.firing()?.task.id).toBe('t1');
    expect(tasks.findTask('t1')?.task.alarm?.enabled).toBe(false);
  });

  it('fires a daily alarm and advances firesAt by 24h', async () => {
    const startAt = new Date(Date.now() + 60_000).toISOString();
    repo.rows.set('t1', buildTask('t1', alarmSpec({ firesAt: startAt, repeat: 'daily' })));
    const { scheduler, tasks } = await setup(repo);
    jasmine.clock().tick(60_000 + 10);
    TestBed.tick();
    expect(scheduler.firing()?.task.id).toBe('t1');
    const updated = tasks.findTask('t1')?.task.alarm;
    expect(updated?.enabled).toBe(true);
    expect(updated?.repeat).toBe('daily');
    expect(Date.parse(updated!.firesAt)).toBe(Date.parse(startAt) + 24 * 60 * 60 * 1000);
  });

  it('catches up a daily alarm whose firesAt is multiple days in the past in one step', async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60_000).toISOString();
    repo.rows.set(
      't1',
      buildTask('t1', alarmSpec({ firesAt: threeDaysAgo, repeat: 'daily' })),
    );
    const { scheduler, tasks } = await setup(repo);
    jasmine.clock().tick(10);
    TestBed.tick();
    expect(scheduler.firing()?.task.id).toBe('t1');
    const updated = tasks.findTask('t1')?.task.alarm;
    expect(updated).toBeTruthy();
    expect(Date.parse(updated!.firesAt)).toBeGreaterThan(Date.now());
    expect(Date.parse(updated!.firesAt) - Date.parse(threeDaysAgo)).toBe(3 * 24 * 60 * 60 * 1000);
  });

  it('dismiss() clears firing without modifying the alarm', async () => {
    repo.rows.set('t1', buildTask('t1', alarmSpec({ firesAt: new Date(Date.now() + 60_000).toISOString() })));
    const { scheduler, tasks } = await setup(repo);
    jasmine.clock().tick(60_000 + 10);
    TestBed.tick();
    expect(scheduler.firing()).not.toBeNull();
    const before = tasks.findTask('t1')?.task.alarm;
    scheduler.dismiss();
    TestBed.tick();
    expect(scheduler.firing()).toBeNull();
    const after = tasks.findTask('t1')?.task.alarm;
    expect(after).toEqual(before);
  });

  it('with two alarms (one disabled, one enabled), only the enabled one fires', async () => {
    repo.rows.set(
      't1',
      buildTask(
        't1',
        alarmSpec({ firesAt: new Date(Date.now() + 30_000).toISOString(), enabled: false }),
      ),
    );
    repo.rows.set(
      't2',
      buildTask('t2', alarmSpec({ firesAt: new Date(Date.now() + 60_000).toISOString() })),
    );
    const { scheduler } = await setup(repo);
    jasmine.clock().tick(60_000 + 10);
    TestBed.tick();
    expect(scheduler.firing()?.task.id).toBe('t2');
  });
});

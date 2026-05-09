import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LegacyDataService, type LegacyGroupShape } from '@core/db/legacy-data.service';
import { GroupsRepository } from '@features/groups/data-access/groups.repository';
import type { Group } from '@features/groups/data-access/groups.types';
import { TasksRepository } from '@features/tasks/data-access/tasks.repository';
import type { TaskRow } from '@features/tasks/data-access/tasks.types';
import { WorkspaceState } from '@features/workspace/data-access/workspace.state';

class FakeGroupsRepository implements Pick<
  GroupsRepository,
  'listAll' | 'put' | 'putBatch' | 'deleteCascade'
> {
  rows = new Map<string, Group>();
  async listAll(): Promise<Group[]> {
    return Array.from(this.rows.values()).sort((a, b) => a.order - b.order);
  }
  async put(row: Group): Promise<void> {
    this.rows.set(row.id, { ...row });
  }
  async putBatch(rows: Group[]): Promise<void> {
    for (const r of rows) this.rows.set(r.id, { ...r });
  }
  async deleteCascade(id: string): Promise<void> {
    this.rows.delete(id);
  }
}

class FakeTasksRepository implements Pick<
  TasksRepository,
  'listAll' | 'listByGroup' | 'put' | 'putBatch' | 'deleteByIds'
> {
  rows = new Map<string, TaskRow>();
  async listAll(): Promise<TaskRow[]> {
    return Array.from(this.rows.values());
  }
  async listByGroup(groupId: string): Promise<TaskRow[]> {
    return Array.from(this.rows.values()).filter((t) => t.groupId === groupId);
  }
  async put(row: TaskRow): Promise<void> {
    this.rows.set(row.id, { ...row });
  }
  async putBatch(rows: TaskRow[]): Promise<void> {
    for (const r of rows) this.rows.set(r.id, { ...r });
  }
  async deleteByIds(ids: string[]): Promise<void> {
    for (const id of ids) this.rows.delete(id);
  }
}

class FakeLegacyDataService implements Pick<LegacyDataService, 'load' | 'clear'> {
  data: LegacyGroupShape[] | null = null;
  clearCalls = 0;
  async load(): Promise<LegacyGroupShape[] | null> {
    return this.data;
  }
  async clear(): Promise<void> {
    this.clearCalls++;
    this.data = null;
  }
}

const waitForLoaded = async (state: WorkspaceState): Promise<void> => {
  for (let i = 0; i < 50 && !state.isLoaded(); i++) {
    await Promise.resolve();
  }
};

const setUp = async (
  configure?: (fakes: {
    groupsRepo: FakeGroupsRepository;
    tasksRepo: FakeTasksRepository;
    legacy: FakeLegacyDataService;
  }) => void,
) => {
  const groupsRepo = new FakeGroupsRepository();
  const tasksRepo = new FakeTasksRepository();
  const legacy = new FakeLegacyDataService();
  configure?.({ groupsRepo, tasksRepo, legacy });
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: GroupsRepository, useValue: groupsRepo },
      { provide: TasksRepository, useValue: tasksRepo },
      { provide: LegacyDataService, useValue: legacy },
    ],
  });
  const state = TestBed.inject(WorkspaceState);
  await waitForLoaded(state);
  return { state, groupsRepo, tasksRepo, legacy };
};

describe('WorkspaceState', () => {
  it('hydrates groups + tasks from the repos on initialize', async () => {
    const { state } = await setUp((f) => {
      f.groupsRepo.rows.set('g1', { id: 'g1', name: 'A', order: 0, isOpen: true });
      f.tasksRepo.rows.set('t1', {
        id: 't1',
        groupId: 'g1',
        parentId: null,
        name: 'one',
        order: 0,
        hiddenUntil: null,
        completedDate: null,
        isOpen: true,
      });
    });
    expect(state.groups().length).toBe(1);
    expect(state.tasksFor('g1').map((t) => t.id)).toEqual(['t1']);
  });

  it('detects legacy data and exposes the hasLegacyData signal', async () => {
    const { state } = await setUp((f) => {
      f.legacy.data = [{ id: 'g', name: 'Legacy', tasks: [] }];
    });
    expect(state.hasLegacyData()).toBe(true);
  });

  it('deleteGroup cascades on the repo and drops in-memory tasks', async () => {
    const { state, groupsRepo, tasksRepo } = await setUp((f) => {
      f.groupsRepo.rows.set('g1', { id: 'g1', name: 'A', order: 0, isOpen: true });
      f.tasksRepo.rows.set('t1', {
        id: 't1',
        groupId: 'g1',
        parentId: null,
        name: 'one',
        order: 0,
        hiddenUntil: null,
        completedDate: null,
        isOpen: true,
      });
    });

    state.deleteGroup('g1');
    expect(state.groups()).toEqual([]);
    expect(state.tasksFor('g1')).toEqual([]);
    expect(groupsRepo.rows.size).toBe(0);
    // tasks are kept in DB until the cascade transaction runs (real impl). Fake doesn't cascade,
    // so we only assert in-memory clearance, which is what the workspace state guarantees.
    expect(tasksRepo.rows.size).toBe(1);
  });

  it('previewLegacy normalizes the raw legacy shape', async () => {
    const { state } = await setUp((f) => {
      f.legacy.data = [
        { id: 'g1', name: 'Legacy', order: 0, isOpen: true, tasks: [] },
        { name: 'no id', tasks: [] },
      ];
    });
    const preview = await state.previewLegacy();
    expect(preview?.[0].name).toBe('Legacy');
    expect(preview?.[1].id).toBe('legacy-1');
  });

  it('importLegacy writes group + task rows, clears legacy, and refreshes', async () => {
    const { state, groupsRepo, tasksRepo, legacy } = await setUp((f) => {
      f.legacy.data = [
        {
          id: 'g1',
          name: 'Legacy',
          order: 0,
          isOpen: true,
          tasks: [
            {
              id: 't1',
              name: 'Buy milk',
              order: 0,
              hiddenUntil: null,
              completedDate: null,
              isOpen: true,
              tasks: [],
            },
          ],
        },
      ];
    });

    const preview = await state.previewLegacy();
    await state.importLegacy(preview ?? []);

    expect(legacy.clearCalls).toBe(1);
    expect(groupsRepo.rows.size).toBe(1);
    expect(tasksRepo.rows.size).toBe(1);
    expect(state.groups().length).toBe(1);
    expect(state.tasksFor(state.groups()[0].id)[0].name).toBe('Buy milk');
    expect(state.hasLegacyData()).toBe(false);
  });
});

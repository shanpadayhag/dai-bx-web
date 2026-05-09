import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DatabaseService } from '@core/db/database.service';
import { DB_NAME } from '@core/db/database.schema';
import { TasksRepository } from '@features/tasks/data-access/tasks.repository';
import type { TaskRow } from '@features/tasks/data-access/tasks.types';

const wipe = (): Promise<void> =>
  new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });

const makeRow = (overrides: Partial<TaskRow>): TaskRow => ({
  id: overrides.id ?? 't',
  groupId: overrides.groupId ?? 'g',
  parentId: overrides.parentId ?? null,
  name: overrides.name ?? 'Task',
  order: overrides.order ?? 0,
  hiddenUntil: overrides.hiddenUntil ?? null,
  completedDate: overrides.completedDate ?? null,
  isOpen: overrides.isOpen ?? true,
  alarm: overrides.alarm ?? null,
});

describe('TasksRepository', () => {
  let repo: TasksRepository;
  let database: DatabaseService;

  beforeEach(async () => {
    await wipe();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    database = TestBed.inject(DatabaseService);
    repo = TestBed.inject(TasksRepository);
  });

  afterEach(async () => {
    await database.close();
    await wipe();
  });

  it('listAll returns an empty array when nothing has been written', async () => {
    expect(await repo.listAll()).toEqual([]);
  });

  it("put then listByGroup returns only that group's rows", async () => {
    await repo.put(makeRow({ id: 't1', groupId: 'g1' }));
    await repo.put(makeRow({ id: 't2', groupId: 'g2' }));
    await repo.put(makeRow({ id: 't3', groupId: 'g1', parentId: 't1' }));

    const inG1 = await repo.listByGroup('g1');
    expect(inG1.map((t) => t.id).sort()).toEqual(['t1', 't3']);
  });

  it('putBatch upserts many rows in one transaction', async () => {
    await repo.putBatch([
      makeRow({ id: 'a', groupId: 'g', order: 0 }),
      makeRow({ id: 'b', groupId: 'g', order: 1 }),
      makeRow({ id: 'c', groupId: 'g', order: 2 }),
    ]);
    expect((await repo.listAll()).length).toBe(3);
  });

  it('deleteByIds removes only the named rows', async () => {
    await repo.putBatch([makeRow({ id: 'a' }), makeRow({ id: 'b' }), makeRow({ id: 'c' })]);
    await repo.deleteByIds(['a', 'c']);
    expect((await repo.listAll()).map((t) => t.id)).toEqual(['b']);
  });
});

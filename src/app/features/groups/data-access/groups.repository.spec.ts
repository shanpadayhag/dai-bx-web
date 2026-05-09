import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DatabaseService } from '@core/db/database.service';
import { DB_NAME } from '@core/db/database.schema';
import { GroupsRepository } from '@features/groups/data-access/groups.repository';
import { TasksRepository } from '@features/tasks/data-access/tasks.repository';
import type { TaskRow } from '@features/tasks/data-access/tasks.types';

const wipe = (): Promise<void> =>
  new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });

describe('GroupsRepository', () => {
  let repo: GroupsRepository;
  let tasksRepo: TasksRepository;
  let database: DatabaseService;

  beforeEach(async () => {
    await wipe();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    database = TestBed.inject(DatabaseService);
    repo = TestBed.inject(GroupsRepository);
    tasksRepo = TestBed.inject(TasksRepository);
  });

  afterEach(async () => {
    await database.close();
    await wipe();
  });

  it('listAll returns rows ordered by their order field', async () => {
    await repo.put({ id: 'a', name: 'A', order: 2, isOpen: true });
    await repo.put({ id: 'b', name: 'B', order: 0, isOpen: true });
    await repo.put({ id: 'c', name: 'C', order: 1, isOpen: true });

    expect((await repo.listAll()).map((g) => g.id)).toEqual(['b', 'c', 'a']);
  });

  it('putBatch upserts many rows in one transaction', async () => {
    await repo.putBatch([
      { id: 'a', name: 'A', order: 0, isOpen: true },
      { id: 'b', name: 'B', order: 1, isOpen: false },
    ]);
    const all = await repo.listAll();
    expect(all.length).toBe(2);
    expect(all.find((g) => g.id === 'b')?.isOpen).toBe(false);
  });

  it('deleteCascade removes the group AND its tasks via the by-group index', async () => {
    await repo.put({ id: 'g1', name: 'A', order: 0, isOpen: true });
    await repo.put({ id: 'g2', name: 'B', order: 1, isOpen: true });

    const tasks: TaskRow[] = [
      {
        id: 't1',
        groupId: 'g1',
        parentId: null,
        name: 'in g1',
        order: 0,
        hiddenUntil: null,
        completedDate: null,
        isOpen: true,
        alarm: null,
      },
      {
        id: 't2',
        groupId: 'g1',
        parentId: 't1',
        name: 'child',
        order: 0,
        hiddenUntil: null,
        completedDate: null,
        isOpen: true,
        alarm: null,
      },
      {
        id: 't3',
        groupId: 'g2',
        parentId: null,
        name: 'in g2',
        order: 0,
        hiddenUntil: null,
        completedDate: null,
        isOpen: true,
        alarm: null,
      },
    ];
    await tasksRepo.putBatch(tasks);

    await repo.deleteCascade('g1');

    expect((await repo.listAll()).map((g) => g.id)).toEqual(['g2']);
    expect((await tasksRepo.listAll()).map((t) => t.id)).toEqual(['t3']);
  });
});

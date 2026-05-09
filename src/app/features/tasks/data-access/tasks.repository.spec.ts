import { TasksRepository } from '@features/tasks/data-access/tasks.repository';
import type { Group } from '@features/tasks/data-access/tasks.types';

const wipe = (): Promise<void> =>
  new Promise((resolve) => {
    const req = indexedDB.deleteDatabase('daibx');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });

describe('TasksRepository (IndexedDB)', () => {
  let repository: TasksRepository;

  beforeEach(async () => {
    await wipe();
    repository = new TasksRepository();
  });

  afterEach(async () => {
    await repository.close();
    await wipe();
  });

  it('returns an empty array when nothing has been saved', async () => {
    const groups = await repository.loadGroups();
    expect(groups).toEqual([]);
  });

  it('round-trips groups through the database', async () => {
    const groups: Group[] = [
      {
        id: 'g1',
        name: 'Demo',
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

    await repository.saveGroups(groups);
    const loaded = await repository.loadGroups();
    expect(loaded).toEqual(groups);
  });

  it('overwrites previously persisted groups on each save', async () => {
    await repository.saveGroups([{ id: 'a', name: 'A', isOpen: true, tasks: [] }]);
    await repository.saveGroups([{ id: 'b', name: 'B', isOpen: true, tasks: [] }]);

    const loaded = await repository.loadGroups();
    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe('b');
  });
});

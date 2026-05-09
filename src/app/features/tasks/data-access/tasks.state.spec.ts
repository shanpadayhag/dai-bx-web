import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TaskStateService } from '@features/tasks/data-access/tasks.state';
import { TasksRepository } from '@features/tasks/data-access/tasks.repository';
import type { Group } from '@features/tasks/data-access/tasks.types';

class InMemoryRepository implements Pick<TasksRepository, 'loadGroups' | 'saveGroups'> {
  private store: Group[] = [];
  saveCallCount = 0;

  async loadGroups(): Promise<Group[]> {
    return JSON.parse(JSON.stringify(this.store)) as Group[];
  }

  async saveGroups(groups: Group[]): Promise<void> {
    this.saveCallCount++;
    this.store = JSON.parse(JSON.stringify(groups)) as Group[];
  }

  seed(groups: Group[]): void {
    this.store = JSON.parse(JSON.stringify(groups)) as Group[];
  }
}

const waitForLoaded = async (state: TaskStateService): Promise<void> => {
  for (let i = 0; i < 50 && !state.isLoaded(); i++) {
    await Promise.resolve();
  }
};

describe('TaskStateService', () => {
  let service: TaskStateService;
  let repository: InMemoryRepository;

  const setUp = async (seeded: Group[] = []): Promise<void> => {
    repository = new InMemoryRepository();
    repository.seed(seeded);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: TasksRepository, useValue: repository },
      ],
    });
    service = TestBed.inject(TaskStateService);
    await waitForLoaded(service);
  };

  beforeEach(async () => {
    await setUp();
  });

  it('starts empty after the initial load', () => {
    expect(service.groups()).toEqual([]);
    expect(service.hasGroups()).toBe(false);
    expect(service.isLoaded()).toBe(true);
  });

  it('hydrates with whatever the repository returns', async () => {
    TestBed.resetTestingModule();
    await setUp([{ id: 'g1', name: 'Seeded', isOpen: true, tasks: [] }]);
    expect(service.groups().length).toBe(1);
    expect(service.groups()[0].name).toBe('Seeded');
  });

  it('createGroup appends a group with trimmed name and empty tasks', () => {
    service.createGroup('  Inbox  ');
    expect(service.groups().length).toBe(1);
    expect(service.groups()[0].name).toBe('Inbox');
    expect(service.groups()[0].tasks).toEqual([]);
    expect(service.hasGroups()).toBe(true);
  });

  it('createGroup ignores empty names', () => {
    service.createGroup('   ');
    expect(service.groups()).toEqual([]);
  });

  it('deleteGroup removes a group by id', () => {
    service.createGroup('A');
    service.createGroup('B');
    const ids = service.groups().map((g) => g.id);
    service.deleteGroup(ids[0]);
    expect(service.groups().length).toBe(1);
    expect(service.groups()[0].name).toBe('B');
  });

  it('renameGroup updates the name', () => {
    service.createGroup('Old');
    const id = service.groups()[0].id;
    service.renameGroup(id, 'New');
    expect(service.groups()[0].name).toBe('New');
  });

  it('toggleGroupOpen flips the isOpen flag', () => {
    service.createGroup('A');
    const id = service.groups()[0].id;
    service.toggleGroupOpen(id, false);
    expect(service.groups()[0].isOpen).toBe(false);
  });

  it('reorderGroups moves a group to the new index', () => {
    service.createGroup('A');
    service.createGroup('B');
    service.createGroup('C');
    service.reorderGroups(0, 2);
    expect(service.groups().map((g) => g.name)).toEqual(['B', 'C', 'A']);
  });

  it('addRootTask adds a task at the end of the group', () => {
    service.createGroup('A');
    const groupId = service.groups()[0].id;
    service.addRootTask(groupId, 'first');
    service.addRootTask(groupId, 'second');
    const tasks = service.groups()[0].tasks;
    expect(tasks.map((t) => t.name)).toEqual(['first', 'second']);
    expect(tasks[0].order).toBe(0);
    expect(tasks[1].order).toBe(1);
  });

  it('addSubtask appends a child to the matching task', () => {
    service.createGroup('A');
    const groupId = service.groups()[0].id;
    service.addRootTask(groupId, 'parent');
    const parentId = service.groups()[0].tasks[0].id;
    service.addSubtask(groupId, parentId, 'child');
    const parent = service.groups()[0].tasks[0];
    expect(parent.tasks.length).toBe(1);
    expect(parent.tasks[0].name).toBe('child');
  });

  it('deleteTask removes a nested task', () => {
    service.createGroup('A');
    const groupId = service.groups()[0].id;
    service.addRootTask(groupId, 'parent');
    const parentId = service.groups()[0].tasks[0].id;
    service.addSubtask(groupId, parentId, 'child');
    const childId = service.groups()[0].tasks[0].tasks[0].id;
    service.deleteTask(groupId, childId);
    expect(service.groups()[0].tasks[0].tasks).toEqual([]);
  });

  it('toggleTaskCompletion completes a task today and clears it on second toggle', () => {
    service.createGroup('A');
    const groupId = service.groups()[0].id;
    service.addRootTask(groupId, 't');
    const taskId = service.groups()[0].tasks[0].id;

    service.toggleTaskCompletion(groupId, taskId);
    const today = new Date().toISOString().slice(0, 10);
    expect(service.groups()[0].tasks[0].completedDate).toBe(today);

    service.toggleTaskCompletion(groupId, taskId);
    expect(service.groups()[0].tasks[0].completedDate).toBeNull();
  });

  it('reorderTasks reorders root tasks within a group', () => {
    service.createGroup('A');
    const groupId = service.groups()[0].id;
    service.addRootTask(groupId, 'one');
    service.addRootTask(groupId, 'two');
    service.addRootTask(groupId, 'three');
    service.reorderTasks(groupId, null, 0, 2);
    expect(service.groups()[0].tasks.map((t) => t.name)).toEqual(['two', 'three', 'one']);
  });

  it('persists changes through the repository', async () => {
    service.createGroup('Persisted');
    TestBed.tick();
    await Promise.resolve();
    const loaded = await repository.loadGroups();
    expect(loaded.length).toBe(1);
    expect(loaded[0].name).toBe('Persisted');
    expect(repository.saveCallCount).toBeGreaterThan(0);
  });
});

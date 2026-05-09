import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GroupsRepository } from '@features/groups/data-access/groups.repository';
import { GroupsState } from '@features/groups/data-access/groups.state';
import type { Group } from '@features/groups/data-access/groups.types';

class FakeGroupsRepository implements Pick<
  GroupsRepository,
  'listAll' | 'put' | 'putBatch' | 'deleteCascade'
> {
  rows = new Map<string, Group>();
  putCalls = 0;
  putBatchCalls = 0;
  deleteCascadeCalls = 0;

  async listAll(): Promise<Group[]> {
    return Array.from(this.rows.values()).sort((a, b) => a.order - b.order);
  }
  async put(row: Group): Promise<void> {
    this.putCalls++;
    this.rows.set(row.id, { ...row });
  }
  async putBatch(rows: Group[]): Promise<void> {
    this.putBatchCalls++;
    for (const r of rows) this.rows.set(r.id, { ...r });
  }
  async deleteCascade(groupId: string): Promise<void> {
    this.deleteCascadeCalls++;
    this.rows.delete(groupId);
  }
}

describe('GroupsState', () => {
  let state: GroupsState;
  let repo: FakeGroupsRepository;

  beforeEach(async () => {
    repo = new FakeGroupsRepository();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: GroupsRepository, useValue: repo }],
    });
    state = TestBed.inject(GroupsState);
  });

  it('starts empty until load() is called', () => {
    expect(state.groups()).toEqual([]);
    expect(state.isLoaded()).toBe(false);
  });

  it('load hydrates from the repository', async () => {
    repo.rows.set('a', { id: 'a', name: 'A', order: 0, isOpen: true });
    await state.load();
    expect(state.isLoaded()).toBe(true);
    expect(state.groups().map((g) => g.id)).toEqual(['a']);
  });

  it('create writes a single group row with reindexed order', () => {
    state.set([]);
    state.create('  Inbox  ');
    expect(state.groups().length).toBe(1);
    expect(state.groups()[0].name).toBe('Inbox');
    expect(state.groups()[0].order).toBe(0);
    expect(repo.putCalls).toBe(1);
  });

  it('create ignores empty names', () => {
    state.set([]);
    state.create('   ');
    expect(state.groups()).toEqual([]);
    expect(repo.putCalls).toBe(0);
  });

  it('remove deletes the group via cascade and re-batches the rest', () => {
    state.set([]);
    state.create('A');
    state.create('B');
    state.create('C');
    const ids = state.groups().map((g) => g.id);
    state.remove(ids[0]);
    expect(state.groups().map((g) => g.name)).toEqual(['B', 'C']);
    expect(state.groups().map((g) => g.order)).toEqual([0, 1]);
    expect(repo.deleteCascadeCalls).toBe(1);
    expect(repo.putBatchCalls).toBeGreaterThan(0);
  });

  it('rename writes a single group row', () => {
    state.set([]);
    state.create('Old');
    const before = repo.putCalls;
    state.rename(state.groups()[0].id, 'New');
    expect(state.groups()[0].name).toBe('New');
    expect(repo.putCalls - before).toBe(1);
  });

  it('reorder updates positions and writes a batch', () => {
    state.set([]);
    state.create('A');
    state.create('B');
    state.create('C');
    const before = repo.putBatchCalls;
    state.reorder(0, 2);
    expect(state.groups().map((g) => g.name)).toEqual(['B', 'C', 'A']);
    expect(state.groups().map((g) => g.order)).toEqual([0, 1, 2]);
    expect(repo.putBatchCalls - before).toBe(1);
  });
});

import { Injectable, computed, inject, signal } from '@angular/core';
import { uid } from '@shared/utils/uid';
import { GroupsRepository } from '@features/groups/data-access/groups.repository';
import type { Group } from '@features/groups/data-access/groups.types';

const moveInArray = <T>(arr: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) {
    return arr;
  }
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const reindexOrder = <T extends { order: number }>(items: T[]): T[] =>
  items.map((item, i) => ({ ...item, order: i }));

@Injectable({ providedIn: 'root' })
export class GroupsState {
  private readonly repository = inject(GroupsRepository);

  private readonly _groups = signal<Group[]>([]);
  private readonly _isLoaded = signal(false);

  readonly groups = this._groups.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();
  readonly hasGroups = computed(() => this._groups().length > 0);

  async load(): Promise<void> {
    this._groups.set(await this.repository.listAll());
    this._isLoaded.set(true);
  }

  set(groups: Group[]): void {
    this._groups.set(groups);
    this._isLoaded.set(true);
  }

  create(name: string): Group | null {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const newGroup: Group = {
      id: uid(),
      name: trimmed,
      order: this._groups().length,
      isOpen: true,
    };
    this._groups.update((groups) => [...groups, newGroup]);
    void this.repository.put(newGroup);
    return newGroup;
  }

  remove(groupId: string): void {
    const reordered = reindexOrder(this._groups().filter((g) => g.id !== groupId));
    this._groups.set(reordered);
    void this.repository.deleteCascade(groupId);
    if (reordered.length > 0) {
      void this.repository.putBatch(reordered);
    }
  }

  rename(groupId: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this._groups.update((groups) =>
      groups.map((g) => (g.id === groupId ? { ...g, name: trimmed } : g)),
    );
    const updated = this._groups().find((g) => g.id === groupId);
    if (updated) void this.repository.put(updated);
  }

  toggleOpen(groupId: string, isOpen: boolean): void {
    this._groups.update((groups) => groups.map((g) => (g.id === groupId ? { ...g, isOpen } : g)));
    const updated = this._groups().find((g) => g.id === groupId);
    if (updated) void this.repository.put(updated);
  }

  reorder(fromIndex: number, toIndex: number): void {
    const reordered = reindexOrder(moveInArray(this._groups(), fromIndex, toIndex));
    this._groups.set(reordered);
    void this.repository.putBatch(reordered);
  }
}

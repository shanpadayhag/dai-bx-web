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
  readonly visibleGroups = computed(() => this._groups().filter((g) => !g.isHidden));
  readonly hiddenCount = computed(
    () => this._groups().reduce((n, g) => n + (g.isHidden ? 1 : 0), 0),
  );

  async load(): Promise<void> {
    this._groups.set(await this.repository.listAll());
    this._isLoaded.set(true);
  }

  set(groups: Group[]): void {
    this._groups.set(groups.map((g) => ({ ...g, isHidden: g.isHidden === true })));
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
      isHidden: false,
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

  toggleHidden(groupId: string, isHidden: boolean): void {
    this._groups.update((groups) =>
      groups.map((g) => (g.id === groupId ? { ...g, isHidden } : g)),
    );
    const updated = this._groups().find((g) => g.id === groupId);
    if (updated) void this.repository.put(updated);
  }

  setVisibility(visibleIds: ReadonlySet<string>): void {
    const current = this._groups();
    const next = current.map((g) => {
      const shouldBeHidden = !visibleIds.has(g.id);
      return g.isHidden === shouldBeHidden ? g : { ...g, isHidden: shouldBeHidden };
    });
    const changed = next.filter((g, i) => g !== current[i]);
    if (changed.length === 0) return;
    this._groups.set(next);
    void this.repository.putBatch(changed);
  }

  reorder(fromIndex: number, toIndex: number): void {
    const reordered = reindexOrder(moveInArray(this._groups(), fromIndex, toIndex));
    this._groups.set(reordered);
    void this.repository.putBatch(reordered);
  }

  reorderVisible(fromVisibleIndex: number, toVisibleIndex: number): void {
    if (fromVisibleIndex === toVisibleIndex) return;
    const groups = this._groups();
    const visibleIndices: number[] = [];
    for (let i = 0; i < groups.length; i++) {
      if (!groups[i].isHidden) visibleIndices.push(i);
    }
    const fromAbs = visibleIndices[fromVisibleIndex];
    const toAbs = visibleIndices[toVisibleIndex];
    if (fromAbs === undefined || toAbs === undefined) return;
    this.reorder(fromAbs, toAbs);
  }
}

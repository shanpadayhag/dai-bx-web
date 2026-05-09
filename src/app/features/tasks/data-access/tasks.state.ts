import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { uid } from '@shared/utils/uid';
import { TasksRepository } from '@features/tasks/data-access/tasks.repository';
import type { Group, Task } from '@features/tasks/data-access/tasks.types';
import {
  addSubtaskById,
  deleteTaskById,
  isVisibleToday,
  reorderTasksByParent,
  toggleTaskCompletionById,
  toggleTaskOpenById,
} from '@features/tasks/data-access/tasks.tree';

const moveInArray = <T>(arr: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) {
    return arr;
  }
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

@Injectable({ providedIn: 'root' })
export class TaskStateService {
  private readonly repository = inject(TasksRepository);

  private readonly _groups = signal<Group[]>([]);
  private readonly _isLoaded = signal(false);

  readonly groups = this._groups.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();

  readonly hasGroups = computed(() => this._groups().length > 0);

  constructor() {
    effect(() => {
      if (!this._isLoaded()) return;
      const groups = this._groups();
      void this.repository.saveGroups(groups);
    });

    void this.initialize();
  }

  visibleTaskCount(group: Group): number {
    return group.tasks.filter(isVisibleToday).length;
  }

  createGroup(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this._groups.update((groups) => [
      ...groups,
      { id: uid(), name: trimmed, isOpen: true, tasks: [] },
    ]);
  }

  deleteGroup(groupId: string): void {
    this._groups.update((groups) => groups.filter((g) => g.id !== groupId));
  }

  renameGroup(groupId: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this._groups.update((groups) =>
      groups.map((g) => (g.id === groupId ? { ...g, name: trimmed } : g)),
    );
  }

  toggleGroupOpen(groupId: string, isOpen: boolean): void {
    this._groups.update((groups) => groups.map((g) => (g.id === groupId ? { ...g, isOpen } : g)));
  }

  reorderGroups(fromIndex: number, toIndex: number): void {
    this._groups.update((groups) => moveInArray(groups, fromIndex, toIndex));
  }

  addRootTask(groupId: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this._groups.update((groups) =>
      groups.map((g) => {
        if (g.id !== groupId) return g;
        const newTask: Task = {
          id: uid(),
          name: trimmed,
          order: g.tasks.length,
          hiddenUntil: null,
          completedDate: null,
          isOpen: true,
          tasks: [],
        };
        return { ...g, tasks: [...g.tasks, newTask] };
      }),
    );
  }

  addSubtask(groupId: string, parentTaskId: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this._groups.update((groups) =>
      groups.map((g) =>
        g.id === groupId ? { ...g, tasks: addSubtaskById(g.tasks, parentTaskId, trimmed) } : g,
      ),
    );
  }

  deleteTask(groupId: string, taskId: string): void {
    this._groups.update((groups) =>
      groups.map((g) => (g.id === groupId ? { ...g, tasks: deleteTaskById(g.tasks, taskId) } : g)),
    );
  }

  toggleTaskCompletion(groupId: string, taskId: string): void {
    this._groups.update((groups) =>
      groups.map((g) =>
        g.id === groupId ? { ...g, tasks: toggleTaskCompletionById(g.tasks, taskId) } : g,
      ),
    );
  }

  toggleTaskOpen(groupId: string, taskId: string, isOpen: boolean): void {
    this._groups.update((groups) =>
      groups.map((g) =>
        g.id === groupId ? { ...g, tasks: toggleTaskOpenById(g.tasks, taskId, isOpen) } : g,
      ),
    );
  }

  reorderTasks(
    groupId: string,
    parentTaskId: string | null,
    fromIndex: number,
    toIndex: number,
  ): void {
    this._groups.update((groups) =>
      groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              tasks: reorderTasksByParent(g.tasks, parentTaskId, fromIndex, toIndex),
            }
          : g,
      ),
    );
  }

  private async initialize(): Promise<void> {
    const loaded = await this.repository.loadGroups();
    this._groups.set(loaded);
    this._isLoaded.set(true);
  }
}

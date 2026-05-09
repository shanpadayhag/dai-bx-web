import { Injectable, computed, inject, signal } from '@angular/core';
import { uid } from '@shared/utils/uid';
import type { AlarmSpec } from '@features/alarms/data-access/alarms.types';
import { TasksRepository } from '@features/tasks/data-access/tasks.repository';
import type { Task, TaskRow } from '@features/tasks/data-access/tasks.types';
import {
  buildTreeFromRows,
  collectSubtreeIds,
  deleteTaskById,
  findTaskInTree,
  flattenTasks,
  getSiblingsOf,
  insertSubtask,
  reorderTasksByParent,
  setActiveTimerSetIdById,
  setTaskAlarmById,
  setTaskTimerSetsById,
  toTaskRow,
  toggleTaskCompletionById,
  toggleTaskOpenById,
} from '@features/tasks/data-access/tasks.tree';
import type { TimerSet } from '@features/timers/data-access/timers.types';

@Injectable({ providedIn: 'root' })
export class TasksState {
  private readonly repository = inject(TasksRepository);

  private readonly _trees = signal<Map<string, Task[]>>(new Map());
  private readonly _isLoaded = signal(false);

  readonly isLoaded = this._isLoaded.asReadonly();

  readonly tasksWithAlarm = computed<{ task: Task; groupId: string }[]>(() => {
    const out: { task: Task; groupId: string }[] = [];
    const walk = (nodes: Task[], groupId: string): void => {
      for (const t of nodes) {
        if (t.alarm) out.push({ task: t, groupId });
        if (t.tasks.length) walk(t.tasks, groupId);
      }
    };
    for (const [gid, tree] of this._trees()) walk(tree, gid);
    return out;
  });

  readonly tasksWithTimers = computed<{ task: Task; groupId: string }[]>(() => {
    const out: { task: Task; groupId: string }[] = [];
    const walk = (nodes: Task[], groupId: string): void => {
      for (const t of nodes) {
        if (t.timerSets.length > 0) out.push({ task: t, groupId });
        if (t.tasks.length) walk(t.tasks, groupId);
      }
    };
    for (const [gid, tree] of this._trees()) walk(tree, gid);
    return out;
  });

  findTask(taskId: string): { task: Task; groupId: string } | null {
    for (const [gid, tree] of this._trees()) {
      const found = findTaskInTree(tree, taskId);
      if (found) return { task: found.task, groupId: gid };
    }
    return null;
  }

  tasksFor(groupId: string): Task[] {
    return this._trees().get(groupId) ?? [];
  }

  /** Reactive accessor for a group's tasks. */
  signalFor(groupId: string) {
    return computed(() => this._trees().get(groupId) ?? []);
  }

  async loadAll(): Promise<void> {
    const rows = await this.repository.listAll();
    this.hydrateFromRows(rows);
    this._isLoaded.set(true);
  }

  hydrateFromRows(rows: TaskRow[]): void {
    const byGroup = new Map<string, TaskRow[]>();
    for (const row of rows) {
      const arr = byGroup.get(row.groupId) ?? [];
      arr.push(row);
      byGroup.set(row.groupId, arr);
    }
    const trees = new Map<string, Task[]>();
    for (const [gid, groupRows] of byGroup) {
      trees.set(gid, buildTreeFromRows(groupRows));
    }
    this._trees.set(trees);
  }

  clearForGroup(groupId: string): void {
    this._trees.update((trees) => {
      if (!trees.has(groupId)) return trees;
      const next = new Map(trees);
      next.delete(groupId);
      return next;
    });
  }

  addRoot(groupId: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const tree = this.tasksFor(groupId);
    const newTask: Task = {
      id: uid(),
      name: trimmed,
      order: tree.length,
      hiddenUntil: null,
      completedDate: null,
      isOpen: true,
      alarm: null,
      timerSets: [],
      activeTimerSetId: null,
      tasks: [],
    };
    this.replaceTree(groupId, [...tree, newTask]);
    void this.repository.put(toTaskRow(newTask, groupId, null));
  }

  addSubtask(groupId: string, parentTaskId: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const tree = this.tasksFor(groupId);
    const parent = findTaskInTree(tree, parentTaskId);
    if (!parent) return;
    const newTask: Task = {
      id: uid(),
      name: trimmed,
      order: parent.task.tasks.length,
      hiddenUntil: null,
      completedDate: null,
      isOpen: true,
      alarm: null,
      timerSets: [],
      activeTimerSetId: null,
      tasks: [],
    };
    this.replaceTree(groupId, insertSubtask(tree, parentTaskId, newTask));
    void this.repository.put(toTaskRow(newTask, groupId, parentTaskId));
  }

  remove(groupId: string, taskId: string): void {
    const tree = this.tasksFor(groupId);
    const found = findTaskInTree(tree, taskId);
    if (!found) return;
    const idsToDelete = collectSubtreeIds(found.task);
    this.replaceTree(groupId, deleteTaskById(tree, taskId));
    void this.repository.deleteByIds(idsToDelete);
  }

  toggleCompletion(groupId: string, taskId: string): void {
    const next = toggleTaskCompletionById(this.tasksFor(groupId), taskId);
    this.replaceTree(groupId, next);
    const found = findTaskInTree(next, taskId);
    if (!found) return;
    void this.repository.putBatch(flattenTasks([found.task], groupId, found.parentId));
  }

  toggleOpen(groupId: string, taskId: string, isOpen: boolean): void {
    const next = toggleTaskOpenById(this.tasksFor(groupId), taskId, isOpen);
    this.replaceTree(groupId, next);
    const found = findTaskInTree(next, taskId);
    if (found) void this.repository.put(toTaskRow(found.task, groupId, found.parentId));
  }

  setAlarm(groupId: string, taskId: string, alarm: AlarmSpec | null): void {
    const next = setTaskAlarmById(this.tasksFor(groupId), taskId, alarm);
    this.replaceTree(groupId, next);
    const found = findTaskInTree(next, taskId);
    if (found) void this.repository.put(toTaskRow(found.task, groupId, found.parentId));
  }

  setTimerSets(groupId: string, taskId: string, timerSets: TimerSet[]): void {
    const next = setTaskTimerSetsById(this.tasksFor(groupId), taskId, timerSets);
    this.replaceTree(groupId, next);
    const found = findTaskInTree(next, taskId);
    if (found) void this.repository.put(toTaskRow(found.task, groupId, found.parentId));
  }

  setActiveTimerSetId(groupId: string, taskId: string, activeTimerSetId: string | null): void {
    const next = setActiveTimerSetIdById(this.tasksFor(groupId), taskId, activeTimerSetId);
    this.replaceTree(groupId, next);
    const found = findTaskInTree(next, taskId);
    if (found) void this.repository.put(toTaskRow(found.task, groupId, found.parentId));
  }

  reorder(groupId: string, parentTaskId: string | null, fromIndex: number, toIndex: number): void {
    const next = reorderTasksByParent(this.tasksFor(groupId), parentTaskId, fromIndex, toIndex);
    this.replaceTree(groupId, next);
    const siblings = getSiblingsOf(next, parentTaskId);
    void this.repository.putBatch(siblings.map((t) => toTaskRow(t, groupId, parentTaskId)));
  }

  private replaceTree(groupId: string, tree: Task[]): void {
    this._trees.update((trees) => {
      const next = new Map(trees);
      next.set(groupId, tree);
      return next;
    });
  }
}

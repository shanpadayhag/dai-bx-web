import { Injectable, computed, inject, signal } from '@angular/core';
import { todayIso } from '@shared/utils/dates';
import { LegacyDataService, type LegacyGroupShape } from '@core/db/legacy-data.service';
import { GroupsRepository } from '@features/groups/data-access/groups.repository';
import { GroupsState } from '@features/groups/data-access/groups.state';
import type { Group } from '@features/groups/data-access/groups.types';
import type { AlarmSpec } from '@features/alarms/data-access/alarms.types';
import { TasksRepository } from '@features/tasks/data-access/tasks.repository';
import { TasksState } from '@features/tasks/data-access/tasks.state';
import type { Task } from '@features/tasks/data-access/tasks.types';
import { flattenTasks } from '@features/tasks/data-access/tasks.tree';
import type { TimerSet } from '@features/timers/data-access/timers.types';

export interface LegacyGroupView extends Group {
  tasks: Task[];
}

const normalizeLegacyGroup = (raw: LegacyGroupShape, index: number): LegacyGroupView => ({
  id: typeof raw.id === 'string' ? raw.id : `legacy-${index}`,
  name: typeof raw.name === 'string' ? raw.name : 'Untitled',
  order: typeof raw.order === 'number' ? raw.order : index,
  isOpen: raw.isOpen !== false,
  isHidden: false,
  tasks: Array.isArray(raw.tasks) ? (raw.tasks as Task[]) : [],
});

@Injectable({ providedIn: 'root' })
export class WorkspaceState {
  private readonly groupsState = inject(GroupsState);
  private readonly tasksState = inject(TasksState);
  private readonly groupsRepo = inject(GroupsRepository);
  private readonly tasksRepo = inject(TasksRepository);
  private readonly legacy = inject(LegacyDataService);

  private readonly _hasLegacyData = signal(false);
  private readonly _isLoaded = signal(false);

  readonly groups = this.groupsState.groups;
  readonly visibleGroups = this.groupsState.visibleGroups;
  readonly hiddenCount = this.groupsState.hiddenCount;
  readonly hasGroups = this.groupsState.hasGroups;
  readonly hasLegacyData = this._hasLegacyData.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();

  readonly nextAlarm = computed<{ task: Task; groupId: string; at: number } | null>(() => {
    const now = Date.now();
    let best: { task: Task; groupId: string; at: number } | null = null;
    for (const entry of this.tasksState.tasksWithAlarm()) {
      const alarm = entry.task.alarm;
      if (!alarm) continue;
      const at = Date.parse(alarm.firesAt);
      if (Number.isNaN(at) || at < now) continue;
      if (!best || at < best.at) best = { ...entry, at };
    }
    return best;
  });

  constructor() {
    void this.initialize();
  }

  tasksFor(groupId: string): Task[] {
    return this.tasksState.tasksFor(groupId);
  }

  visibleTaskCount(group: Group): number {
    const today = todayIso();
    return this.tasksState
      .tasksFor(group.id)
      .filter((t) => !t.hiddenUntil || t.hiddenUntil <= today)
      .length;
  }

  async refresh(): Promise<void> {
    await Promise.all([this.groupsState.load(), this.tasksState.loadAll()]);
    this._hasLegacyData.set((await this.legacy.load()) !== null);
  }

  /* Group operations (delegated, with cascading where needed) */

  createGroup(name: string): void {
    this.groupsState.create(name);
  }

  renameGroup(groupId: string, name: string): void {
    this.groupsState.rename(groupId, name);
  }

  toggleGroupOpen(groupId: string, isOpen: boolean): void {
    this.groupsState.toggleOpen(groupId, isOpen);
  }

  toggleGroupHidden(groupId: string, isHidden: boolean): void {
    this.groupsState.toggleHidden(groupId, isHidden);
  }

  setGroupVisibility(visibleIds: ReadonlySet<string>): void {
    this.groupsState.setVisibility(visibleIds);
  }

  reorderGroups(fromVisibleIndex: number, toVisibleIndex: number): void {
    this.groupsState.reorderVisible(fromVisibleIndex, toVisibleIndex);
  }

  deleteGroup(groupId: string): void {
    this.groupsState.remove(groupId);
    this.tasksState.clearForGroup(groupId);
  }

  /* Task operations (delegated) */

  addRootTask(groupId: string, name: string): void {
    this.tasksState.addRoot(groupId, name);
  }

  addSubtask(groupId: string, parentTaskId: string, name: string): void {
    this.tasksState.addSubtask(groupId, parentTaskId, name);
  }

  deleteTask(groupId: string, taskId: string): void {
    this.tasksState.remove(groupId, taskId);
  }

  toggleTaskCompletion(groupId: string, taskId: string): void {
    this.tasksState.toggleCompletion(groupId, taskId);
  }

  toggleTaskOpen(groupId: string, taskId: string, isOpen: boolean): void {
    this.tasksState.toggleOpen(groupId, taskId, isOpen);
  }

  setTaskAlarm(groupId: string, taskId: string, alarm: AlarmSpec | null): void {
    this.tasksState.setAlarm(groupId, taskId, alarm);
  }

  setTaskTimerSets(groupId: string, taskId: string, timerSets: TimerSet[]): void {
    this.tasksState.setTimerSets(groupId, taskId, timerSets);
  }

  setTaskActiveTimerSetId(groupId: string, taskId: string, activeTimerSetId: string | null): void {
    this.tasksState.setActiveTimerSetId(groupId, taskId, activeTimerSetId);
  }

  reorderTasks(
    groupId: string,
    parentTaskId: string | null,
    fromIndex: number,
    toIndex: number,
  ): void {
    this.tasksState.reorder(groupId, parentTaskId, fromIndex, toIndex);
  }

  /* Legacy migration */

  async previewLegacy(): Promise<LegacyGroupView[] | null> {
    const raw = await this.legacy.load();
    if (!raw) return null;
    return raw.map((g, i) => normalizeLegacyGroup(g, i));
  }

  async importLegacy(legacyGroups: LegacyGroupView[]): Promise<void> {
    const reordered = legacyGroups.map((g, i) => ({ ...g, order: i }));
    const groupRows = reordered.map((g) => ({
      id: g.id,
      name: g.name,
      order: g.order,
      isOpen: g.isOpen,
      isHidden: g.isHidden,
    }));
    const taskRows = reordered.flatMap((g) => flattenTasks(g.tasks, g.id, null));
    await this.groupsRepo.putBatch(groupRows);
    await this.tasksRepo.putBatch(taskRows);
    await this.legacy.clear();
    await this.refresh();
  }

  async dismissLegacy(): Promise<void> {
    await this.legacy.clear();
    this._hasLegacyData.set(false);
  }

  private async initialize(): Promise<void> {
    await Promise.all([this.groupsState.load(), this.tasksState.loadAll()]);
    this._hasLegacyData.set((await this.legacy.load()) !== null);
    this._isLoaded.set(true);
  }
}

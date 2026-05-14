import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import type { Group } from '@features/groups/data-access/groups.types';
import type { Task } from '@features/tasks/data-access/tasks.types';
import { WorkspaceState } from '@features/workspace/data-access/workspace.state';
import { GroupItemComponent } from '@features/workspace/ui/group-item/group-item.component';

const baseTask = (overrides: Partial<Task>): Task => ({
  id: overrides.id ?? 't',
  name: overrides.name ?? 't',
  order: overrides.order ?? 0,
  hiddenUntil: overrides.hiddenUntil ?? null,
  completedDate: null,
  isOpen: true,
  alarm: null,
  timerSets: [],
  activeTimerSetId: null,
  tasks: [],
});

const futureDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
};

class FakeWorkspaceState {
  taskList: Task[] = [];
  reorderTasks = jasmine.createSpy('reorderTasks');
  tasksFor(): Task[] {
    return this.taskList;
  }
}

describe('GroupItemComponent.onTaskDrop', () => {
  let state: FakeWorkspaceState;
  let component: GroupItemComponent;

  const group: Group = {
    id: 'g1',
    name: 'Group',
    order: 0,
    isOpen: true,
    isHidden: false,
  };

  const drop = (previousIndex: number, currentIndex: number): CdkDragDrop<Task[]> =>
    ({ previousIndex, currentIndex }) as CdkDragDrop<Task[]>;

  beforeEach(() => {
    state = new FakeWorkspaceState();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WorkspaceState, useValue: state },
      ],
    });
    const fixture = TestBed.createComponent(GroupItemComponent);
    fixture.componentRef.setInput('group', group);
    component = fixture.componentInstance;
  });

  it('passes indices through unchanged when every task is visible', () => {
    state.taskList = [
      baseTask({ id: 'a', name: 'a', order: 0 }),
      baseTask({ id: 'b', name: 'b', order: 1 }),
      baseTask({ id: 'c', name: 'c', order: 2 }),
    ];
    (component as unknown as { onTaskDrop(event: CdkDragDrop<Task[]>): void }).onTaskDrop(
      drop(2, 0),
    );
    expect(state.reorderTasks).toHaveBeenCalledOnceWith('g1', null, 2, 0);
  });

  it('translates visible-index to absolute-index when a hidden task sits in the middle', () => {
    state.taskList = [
      baseTask({ id: 'a', name: 'a', order: 0 }),
      baseTask({ id: 'b', name: 'b', order: 1, hiddenUntil: futureDate() }),
      baseTask({ id: 'c', name: 'c', order: 2 }),
    ];
    // CDK sees [a, c]; user drags c (visible index 1) above a (visible index 0).
    (component as unknown as { onTaskDrop(event: CdkDragDrop<Task[]>): void }).onTaskDrop(
      drop(1, 0),
    );
    expect(state.reorderTasks).toHaveBeenCalledOnceWith('g1', null, 2, 0);
  });

  it('translates visible-index to absolute-index when a hidden task sits at the start', () => {
    state.taskList = [
      baseTask({ id: 'a', name: 'a', order: 0, hiddenUntil: futureDate() }),
      baseTask({ id: 'b', name: 'b', order: 1 }),
      baseTask({ id: 'c', name: 'c', order: 2 }),
    ];
    // CDK sees [b, c]; user drags c (visible index 1) above b (visible index 0).
    (component as unknown as { onTaskDrop(event: CdkDragDrop<Task[]>): void }).onTaskDrop(
      drop(1, 0),
    );
    expect(state.reorderTasks).toHaveBeenCalledOnceWith('g1', null, 2, 1);
  });

  it('does not call reorderTasks when the absolute index cannot be resolved', () => {
    state.taskList = [];
    (component as unknown as { onTaskDrop(event: CdkDragDrop<Task[]>): void }).onTaskDrop(
      drop(0, 1),
    );
    expect(state.reorderTasks).not.toHaveBeenCalled();
  });

  it('short-circuits when previousIndex equals currentIndex', () => {
    state.taskList = [
      baseTask({ id: 'a', name: 'a', order: 0 }),
      baseTask({ id: 'b', name: 'b', order: 1 }),
    ];
    (component as unknown as { onTaskDrop(event: CdkDragDrop<Task[]>): void }).onTaskDrop(
      drop(1, 1),
    );
    expect(state.reorderTasks).not.toHaveBeenCalled();
  });
});

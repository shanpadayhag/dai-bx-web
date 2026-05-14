import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import {
  Overlay,
  OverlayModule,
  type ConnectedPosition,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { LucideAngularModule } from 'lucide-angular';
import { AutofocusDirective } from '@shared/ui/autofocus/autofocus.directive';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { InputDirective } from '@shared/ui/input/input.directive';
import { cn } from '@shared/utils/cn';
import { todayIso } from '@shared/utils/dates';
import { AlarmBadgeComponent } from '@features/alarms/ui/alarm-badge/alarm-badge.component';
import { AlarmPickerComponent } from '@features/alarms/ui/alarm-picker/alarm-picker.component';
import type { AlarmSpec } from '@features/alarms/data-access/alarms.types';
import type { Task } from '@features/tasks/data-access/tasks.types';
import { isVisibleToday } from '@features/tasks/data-access/tasks.tree';
import { TimerEditorComponent } from '@features/timers/feature/timer-editor/timer-editor.component';
import { TimerBadgeComponent } from '@features/timers/ui/timer-badge/timer-badge.component';
import { sortedSets } from '@features/timers/data-access/timer-format';
import { TimersRunner } from '@features/timers/data-access/timers.runner';
import type { TimerSet } from '@features/timers/data-access/timers.types';
import { WorkspaceState } from '@features/workspace/data-access/workspace.state';

@Component({
  selector: 'app-task-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    OverlayModule,
    LucideAngularModule,
    AutofocusDirective,
    ButtonDirective,
    InputDirective,
    AlarmBadgeComponent,
    AlarmPickerComponent,
    TimerEditorComponent,
    TimerBadgeComponent,
  ],
  templateUrl: './task-item.component.html',
  host: {
    class: 'block group/task',
  },
})
export class TaskItemComponent {
  private readonly state = inject(WorkspaceState);
  private readonly runner = inject(TimersRunner);
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly task = input.required<Task>();
  readonly groupId = input.required<string>();

  private readonly alarmTpl = viewChild.required<TemplateRef<unknown>>('alarmTpl');
  private readonly timerTpl = viewChild.required<TemplateRef<unknown>>('timerTpl');
  private readonly subtaskFormRef = viewChild<ElementRef<HTMLFormElement>>('subtaskForm');
  private readonly subtaskInputRef = viewChild<ElementRef<HTMLInputElement>>('subtaskInput');
  private readonly addToggleRef = viewChild<ElementRef<HTMLButtonElement>>('addToggle');

  protected readonly hovered = signal(false);
  protected readonly adding = signal(false);
  protected readonly newSubtaskName = signal('');
  protected readonly pickingAlarm = signal(false);
  protected readonly pickingTimer = signal(false);
  protected readonly pickingActions = signal(false);

  private alarmOverlayRef: OverlayRef | null = null;
  private timerOverlayRef: OverlayRef | null = null;

  protected readonly hasTimers = computed(() => this.task().timerSets.length > 0);

  protected readonly alarmMenuLabel = computed(() =>
    this.task().alarm ? 'Change alarm' : 'Set alarm',
  );

  protected readonly alarmMenuIcon = computed(() => (this.task().alarm ? 'bell-ring' : 'bell'));

  protected readonly timerMenuLabel = computed(() =>
    this.hasTimers() ? 'Edit timer' : 'Set timer',
  );

  protected readonly activeTimerSet = computed<TimerSet | null>(() => {
    const sets = sortedSets(this.task().timerSets);
    if (sets.length === 0) return null;
    const id = this.task().activeTimerSetId;
    return sets.find((s) => s.id === id) ?? sets[0];
  });

  protected readonly actionsMenuPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -6,
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
    },
  ];

  protected readonly visible = computed(() => isVisibleToday(this.task()));

  protected readonly isCompleted = computed(() => this.task().completedDate === todayIso());

  protected readonly isTimerActive = computed(() => {
    const r = this.runner.runForTask(this.task().id);
    return r?.status === 'running' || r?.status === 'awaitingAdvance';
  });

  protected readonly sortedChildren = computed(() =>
    this.task()
      .tasks.slice()
      .sort((a, b) => a.order - b.order),
  );

  protected readonly hasSubtasks = computed(() => this.task().tasks.length > 0);

  protected readonly rowClass = computed(() => {
    if (this.isTimerActive()) {
      return cn(
        'relative flex items-center gap-2 py-2 pl-5 pr-3 rounded-md bg-primary-soft transition-colors',
        "before:content-[''] before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-foreground before:rounded-l-md",
      );
    }
    return cn(
      'flex items-center gap-2 py-2 px-3 rounded-md transition-colors',
      this.isCompleted() ? 'opacity-60' : 'hover:bg-foreground/5',
    );
  });

  protected readonly dragHandleClass = computed(() =>
    cn(
      'cursor-grab active:cursor-grabbing text-subtle-foreground hover:text-foreground transition-opacity',
      this.hovered() || this.isTimerActive() ? 'opacity-100' : 'opacity-0',
    ),
  );

  protected readonly completionCircleClass = computed(() =>
    cn(
      'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-border cursor-pointer transition-colors',
      this.isCompleted() ? 'bg-foreground' : 'bg-secondary-background hover:bg-foreground/10',
    ),
  );

  protected readonly nameClass = computed(() =>
    cn(
      'text-sm flex-1 font-semibold tracking-tight transition-all',
      this.isCompleted() && 'line-through text-subtle-foreground',
    ),
  );

  protected readonly actionsVisible = computed(
    () => this.hovered() || this.pickingActions() || this.pickingAlarm() || this.pickingTimer(),
  );

  protected readonly actionsClass = computed(() =>
    cn(
      'flex items-center gap-1.5 transition-opacity',
      this.actionsVisible() ? 'opacity-100' : 'opacity-40',
    ),
  );

  protected readonly chevronClass = computed(() =>
    cn('h-4 w-4 transition-transform duration-200', !this.task().isOpen && '-rotate-90'),
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.alarmOverlayRef?.dispose();
      this.timerOverlayRef?.dispose();
    });

    effect((onCleanup) => {
      if (!this.adding()) return;
      const onMouseDown = (event: MouseEvent) => {
        const target = event.target;
        if (!(target instanceof Node)) return;
        const form = this.subtaskFormRef()?.nativeElement;
        if (form && form.contains(target)) return;
        const toggle = this.addToggleRef()?.nativeElement;
        if (toggle && toggle.contains(target)) return;
        this.cancelAdding();
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') this.cancelAdding();
      };
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('keydown', onKeyDown);
      onCleanup(() => {
        document.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('keydown', onKeyDown);
      });
    });
  }

  protected toggleOpen(): void {
    this.state.toggleTaskOpen(this.groupId(), this.task().id, !this.task().isOpen);
  }

  protected toggleCompletion(): void {
    this.state.toggleTaskCompletion(this.groupId(), this.task().id);
  }

  protected deleteTask(): void {
    this.state.deleteTask(this.groupId(), this.task().id);
  }

  protected toggleAdding(): void {
    this.adding.update((v) => !v);
    if (!this.adding()) this.newSubtaskName.set('');
  }

  protected submitSubtask(event: Event): void {
    event.preventDefault();
    const name = this.newSubtaskName().trim();
    if (!name) return;
    this.state.addSubtask(this.groupId(), this.task().id, name);
    this.newSubtaskName.set('');
    this.subtaskInputRef()?.nativeElement.focus();
  }

  protected cancelAdding(): void {
    this.adding.set(false);
    this.newSubtaskName.set('');
  }

  protected toggleAlarmPicker(): void {
    if (this.pickingAlarm()) {
      this.onAlarmPickerClose();
    } else {
      this.openAlarmPicker();
    }
  }

  protected onAlarmChange(alarm: AlarmSpec | null): void {
    this.state.setTaskAlarm(this.groupId(), this.task().id, alarm);
  }

  protected onAlarmPickerClose(): void {
    this.alarmOverlayRef?.dispose();
    this.alarmOverlayRef = null;
    this.pickingAlarm.set(false);
  }

  protected toggleTimerPicker(): void {
    if (this.pickingTimer()) {
      this.onTimerPickerClose();
    } else {
      this.openTimerPicker();
    }
  }

  protected onTimerSetsChange(sets: TimerSet[]): void {
    this.state.setTaskTimerSets(this.groupId(), this.task().id, sets);
  }

  protected onActiveTimerSetIdChange(id: string | null): void {
    this.state.setTaskActiveTimerSetId(this.groupId(), this.task().id, id);
  }

  protected onTimerPickerClose(): void {
    this.timerOverlayRef?.dispose();
    this.timerOverlayRef = null;
    this.pickingTimer.set(false);
  }

  protected toggleActions(): void {
    this.pickingActions.update((v) => !v);
  }

  protected onActionsClose(): void {
    this.pickingActions.set(false);
  }

  protected onActionsKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.onActionsClose();
    }
  }

  protected openAlarmFromMenu(): void {
    this.pickingActions.set(false);
    this.openAlarmPicker();
  }

  protected openTimerFromMenu(): void {
    this.pickingActions.set(false);
    this.openTimerPicker();
  }

  protected onChildrenDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.state.reorderTasks(
      this.groupId(),
      this.task().id,
      event.previousIndex,
      event.currentIndex,
    );
  }

  private openAlarmPicker(): void {
    if (this.alarmOverlayRef) return;
    this.alarmOverlayRef = this.createCenteredOverlay();
    this.alarmOverlayRef.attach(new TemplatePortal(this.alarmTpl(), this.viewContainerRef));
    this.alarmOverlayRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onAlarmPickerClose());
    this.alarmOverlayRef
      .keydownEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          this.onAlarmPickerClose();
        }
      });
    this.pickingAlarm.set(true);
  }

  private openTimerPicker(): void {
    if (this.timerOverlayRef) return;
    this.timerOverlayRef = this.createCenteredOverlay();
    this.timerOverlayRef.attach(new TemplatePortal(this.timerTpl(), this.viewContainerRef));
    this.timerOverlayRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onTimerPickerClose());
    this.timerOverlayRef
      .keydownEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          this.onTimerPickerClose();
        }
      });
    this.pickingTimer.set(true);
  }

  private createCenteredOverlay(): OverlayRef {
    const positionStrategy = this.overlay
      .position()
      .global()
      .centerHorizontally()
      .centerVertically();
    return this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });
  }
}

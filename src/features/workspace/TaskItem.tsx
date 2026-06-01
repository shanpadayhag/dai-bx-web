import { For, Show, createSignal, onCleanup, onMount } from 'solid-js'
import { Bell, Check, ChevronDown, GripVertical, Plus, Timer, Trash2 } from 'lucide-solid'
import {
  createSortable,
  SortableProvider,
  maybeTransformStyle,
  useDragDropContext,
} from '@thisbeyond/solid-dnd'
import { cn } from '~/lib/classnames'
import { todayIso } from '~/lib/date'
import { useWorkspace } from '~/state/workspaceContext'
import { isVisibleToday } from '~/features/tasks/tree'
import type { Task } from '~/features/tasks/types'
import type { AlarmSpec } from '~/features/alarms/types'
import type { TimerSet } from '~/features/timers/types'
import AlarmBadge from '~/features/alarms/AlarmBadge'
import AlarmPicker from '~/features/alarms/AlarmPicker'
import TimerBadge from '~/features/timers/TimerBadge'
import TimerEditor from '~/features/timers/TimerEditor'
import { sortedSets } from '~/features/timers/lib/timerFormat'
import { rootTasksListKey, subtasksListKey, type ItemDragData } from './dnd'

/**
 * Recursive task row. The row is a sortable in its parent's list (root tasks of
 * the group, or subtasks of another task): it drags under the cursor while
 * siblings shift. Children render inside their own `SortableProvider` keyed by
 * `subtasksListKey(...)`.
 */

interface Props {
  task: Task
  groupId: string
  parentId: string | null
}

export default function TaskItem(props: Props) {
  const ws = useWorkspace()

  const myListKey = (): string =>
    props.parentId === null
      ? rootTasksListKey(props.groupId)
      : subtasksListKey(props.groupId, props.parentId)

  const sortable = createSortable(props.task.id, {
    kind: 'item',
    itemKind: 'task',
    listKey: myListKey() as ItemDragData['listKey'],
    groupId: props.groupId,
    parentId: props.parentId,
  } satisfies ItemDragData)
  const dnd = useDragDropContext()
  const isDragging = (): boolean => !!dnd?.[0].active.draggable

  const [hovered, setHovered] = createSignal(false)
  const [adding, setAdding] = createSignal(false)
  const [newSubtaskName, setNewSubtaskName] = createSignal('')
  const [pickingAlarm, setPickingAlarm] = createSignal(false)
  // `pickingTimer` is read from workspace context so it survives the
  // `TaskItem` remount triggered by `tasks.updateTimerSets` (which rebuilds
  // every `Task` reference). Local state here would be wiped on every
  // version add, slamming the modal shut mid-edit.
  const pickingTimer = (): boolean => ws.pickingTimerTaskId() === props.task.id
  let subtaskInputRef: HTMLInputElement | undefined
  let subtaskFormRef: HTMLFormElement | undefined
  let addToggleRef: HTMLButtonElement | undefined

  const isCompleted = (): boolean => props.task.completedDate === todayIso()
  const hasSubtasks = (): boolean => props.task.tasks.length > 0
  const visibleChildren = (): Task[] =>
    props.task.tasks.filter(isVisibleToday).slice().sort((a, b) => a.order - b.order)

  const activeTimerSet = (): TimerSet | null => {
    const sets = sortedSets(props.task.timerSets)
    if (sets.length === 0) return null
    return sets.find((s) => s.id === props.task.activeTimerSetId) ?? sets[0] ?? null
  }

  const isTimerActive = (): boolean => {
    const run = ws.timersRunner.runForTask(props.task.id)
    return run?.status === 'running' || run?.status === 'awaitingAdvance'
  }

  const toggleAdding = (): void => {
    setAdding((v) => !v)
    if (!adding()) setNewSubtaskName('')
  }

  const submitSubtask = (event: Event): void => {
    event.preventDefault()
    const trimmed = newSubtaskName().trim()
    if (!trimmed) return
    void ws.tasks.addSubtask(props.groupId, props.task.id, trimmed)
    setNewSubtaskName('')
    subtaskInputRef?.focus()
  }

  const cancelAdding = (): void => {
    setAdding(false)
    setNewSubtaskName('')
  }

  onMount(() => {
    const onMouseDown = (event: MouseEvent): void => {
      if (!adding()) return
      const target = event.target
      if (!(target instanceof Node)) return
      if (subtaskFormRef && subtaskFormRef.contains(target)) return
      if (addToggleRef && addToggleRef.contains(target)) return
      cancelAdding()
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && adding()) cancelAdding()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    onCleanup(() => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    })
  })

  return (
    <Show when={isVisibleToday(props.task)}>
      <div
        ref={sortable.ref}
        // solid-dnd writes the live drag/sort offset as an inline transform; the
        // dragged row follows the cursor at 25% opacity while siblings slide.
        // Transition the SIBLING shift only — never the active row, or its
        // per-frame pointer transform would ease behind the cursor and feel laggy.
        style={maybeTransformStyle(sortable.transform)}
        class={cn(
          'block group/task',
          isDragging() && !sortable.isActiveDraggable && 'transition-transform',
          sortable.isActiveDraggable && 'opacity-25',
        )}
        data-testid={`task-item-${props.task.id}`}
      >
        <div
          class={cn(
            'flex items-center gap-2 py-2 px-3 rounded-md transition-colors',
            isCompleted() ? 'opacity-60' : 'hover:bg-foreground/5',
          )}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <span
            {...sortable.dragActivators}
            class={cn(
              'inline-flex cursor-grab active:cursor-grabbing text-subtle-foreground hover:text-foreground transition-opacity',
              hovered() ? 'opacity-100' : 'opacity-0',
            )}
            // Decorative — see GroupItem drag handle for rationale.
            aria-hidden="true"
          >
            <GripVertical size={16} />
          </span>

          <button
            type="button"
            onClick={() => void ws.tasks.toggleCompletion(props.groupId, props.task.id)}
            aria-pressed={isCompleted()}
            aria-label={
              isCompleted()
                ? `Mark ${props.task.name} incomplete`
                : `Mark ${props.task.name} complete`
            }
            class={cn(
              'tap-44 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-border cursor-pointer transition-colors',
              isCompleted()
                ? 'bg-foreground'
                : 'bg-secondary-background hover:bg-foreground/10',
            )}
          >
            <Show when={isCompleted()}>
              <Check size={14} class="text-secondary-background" />
            </Show>
          </button>

          <Show when={hasSubtasks()}>
            <button
              type="button"
              class="tap-44 inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
              onClick={() =>
                void ws.tasks.toggleOpen(props.groupId, props.task.id, !props.task.isOpen)
              }
              aria-expanded={props.task.isOpen}
              aria-label={props.task.isOpen ? 'Collapse subtasks' : 'Expand subtasks'}
            >
              <ChevronDown
                size={16}
                class={cn('transition-transform', !props.task.isOpen && '-rotate-90')}
              />
            </button>
          </Show>

          <span
            class={cn(
              'text-sm flex-1 font-semibold tracking-tight transition-all',
              isCompleted() && 'line-through text-subtle-foreground',
            )}
          >
            {props.task.name}
          </span>

          {/* Alarm badge — opens the picker when clicked. */}
          <Show when={props.task.alarm}>
            {(alarm) => (
              <button
                type="button"
                class="cursor-pointer"
                onClick={() => setPickingAlarm(true)}
                title={alarm().enabled === false ? 'Alarm off' : 'Change alarm'}
                aria-label={
                  alarm().enabled === false
                    ? `Enable alarm for ${props.task.name}`
                    : `Change alarm for ${props.task.name}`
                }
              >
                <AlarmBadge alarm={alarm()} />
              </button>
            )}
          </Show>

          {/* Timer badge — opens the editor when clicked. */}
          <Show when={activeTimerSet()}>
            {(timerSet) => (
              <button
                type="button"
                class="cursor-pointer"
                onClick={() => ws.openTimerPicker(props.task.id)}
                title="Edit timer"
                aria-label={`Edit timer for ${props.task.name}`}
              >
                <TimerBadge set={timerSet()} active={isTimerActive()} />
              </button>
            )}
          </Show>

          <div
            class={cn(
              'flex items-center gap-1.5 transition-opacity',
              hovered() ? 'opacity-100' : 'opacity-40',
            )}
          >
            <button
              ref={addToggleRef}
              type="button"
              onClick={toggleAdding}
              aria-expanded={adding()}
              title="Add subtask"
              aria-label="Add subtask"
              class="tap-44 inline-flex h-7 w-7 items-center justify-center rounded-md bg-secondary-background text-foreground border-2 border-border shadow-brutal-sm brutal-press cursor-pointer"
            >
              <Plus size={14} />
            </button>
            <Show when={!props.task.alarm}>
              <button
                type="button"
                onClick={() => setPickingAlarm(true)}
                title="Set alarm"
                aria-label={`Set alarm for ${props.task.name}`}
                class="tap-44 inline-flex h-7 w-7 items-center justify-center rounded-md bg-secondary-background text-foreground border-2 border-border shadow-brutal-sm brutal-press cursor-pointer"
              >
                <Bell size={14} />
              </button>
            </Show>
            <Show when={!activeTimerSet()}>
              <button
                type="button"
                onClick={() => ws.openTimerPicker(props.task.id)}
                title="Set timer"
                aria-label={`Set timer for ${props.task.name}`}
                class="tap-44 inline-flex h-7 w-7 items-center justify-center rounded-md bg-secondary-background text-foreground border-2 border-border shadow-brutal-sm brutal-press cursor-pointer"
              >
                <Timer size={14} />
              </button>
            </Show>
            <button
              type="button"
              onClick={() => void ws.tasks.delete(props.groupId, props.task.id)}
              title="Delete task"
              aria-label={`Delete ${props.task.name}`}
              class="tap-44 inline-flex h-7 w-7 items-center justify-center rounded-md bg-destructive text-destructive-foreground border-2 border-border shadow-brutal-sm brutal-press cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <Show when={adding()}>
          <form
            ref={subtaskFormRef}
            onSubmit={submitSubtask}
            class="flex gap-2 mt-2 ml-10 mr-2 mb-2"
          >
            <input
              ref={(el) => {
                subtaskInputRef = el
                setTimeout(() => el?.focus(), 0)
              }}
              type="text"
              value={newSubtaskName()}
              onInput={(e) => setNewSubtaskName(e.currentTarget.value)}
              placeholder="Subtask name…"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck={false}
              aria-label="Subtask name"
              class="flex h-9 w-full flex-1 rounded-md border-2 border-border bg-secondary-background px-3 py-2 text-sm font-medium text-foreground placeholder:text-subtle-foreground shadow-brutal-sm focus-visible:shadow-brutal transition-shadow"
            />
            <button
              type="submit"
              class="inline-flex h-9 items-center justify-center gap-2 px-4 rounded-md bg-primary text-primary-foreground border-2 border-border shadow-brutal-sm brutal-press font-bold text-sm cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              disabled={!newSubtaskName().trim()}
            >
              Add
            </button>
          </form>
        </Show>

        <AlarmPicker
          show={pickingAlarm()}
          alarm={props.task.alarm}
          onAlarmChange={(next: AlarmSpec | null) =>
            void ws.tasks.setAlarm(props.groupId, props.task.id, next)
          }
          onClose={() => setPickingAlarm(false)}
        />

        <TimerEditor
          show={pickingTimer()}
          groupId={props.groupId}
          taskId={props.task.id}
          timerSets={props.task.timerSets}
          activeTimerSetId={props.task.activeTimerSetId}
          onTimerSetsChange={(next) =>
            void ws.tasks.updateTimerSets(props.groupId, props.task.id, next)
          }
          onActiveTimerSetIdChange={(id) =>
            void ws.tasks.setActiveTimerSetId(props.groupId, props.task.id, id)
          }
          onClose={() => ws.closeTimerPicker()}
        />

        <Show when={props.task.isOpen && visibleChildren().length > 0}>
          <div class="ml-7 mt-1 space-y-1 border-l border-subtle-foreground/40 pl-3">
            <SortableProvider ids={visibleChildren().map((c) => c.id)}>
              <For each={visibleChildren()}>{(child) => (
                <TaskItem task={child} groupId={props.groupId} parentId={props.task.id} />
              )}</For>
            </SortableProvider>
          </div>
        </Show>
      </div>
    </Show>
  )
}

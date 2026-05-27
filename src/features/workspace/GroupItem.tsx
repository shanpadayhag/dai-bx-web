import { For, Show, createSignal } from 'solid-js'
import { Folder, FolderOpen, GripVertical, Plus, Trash2 } from 'lucide-solid'
import { createDraggable } from '@thisbeyond/solid-dnd'
import { cn } from '~/lib/classnames'
import { useWorkspace } from '~/state/workspaceContext'
import { isVisibleToday } from '~/features/tasks/tree'
import type { Group } from '~/features/groups/types'
import type { Task } from '~/features/tasks/types'
import TaskItem from './TaskItem'
import Gap from './Gap'
import { GROUPS_LIST_KEY, rootTasksListKey, type ItemDragData } from './dnd'

/**
 * One group card. The header (grip, folder toggle, name, count, delete) is a
 * draggable in the workspace's groups list. The expanded body renders the
 * group's root-task list as items interleaved with `Gap` droppables.
 */

interface Props {
  group: Group
}

export default function GroupItem(props: Props) {
  const ws = useWorkspace()
  const draggable = createDraggable(props.group.id, {
    kind: 'item',
    itemKind: 'group',
    listKey: GROUPS_LIST_KEY,
  } satisfies ItemDragData)

  const [hovered, setHovered] = createSignal(false)
  const [editing, setEditing] = createSignal(false)
  const [editedName, setEditedName] = createSignal('')
  const [newTaskName, setNewTaskName] = createSignal('')

  const visibleTasks = (): Task[] =>
    ws.tasks
      .tasksFor(props.group.id)
      .filter(isVisibleToday)
      .slice()
      .sort((a, b) => a.order - b.order)

  const visibleTaskCount = (): number => visibleTasks().length

  const startEditing = (): void => {
    setEditedName(props.group.name)
    setEditing(true)
  }

  const saveName = (): void => {
    if (!editing()) return
    const trimmed = editedName().trim()
    if (trimmed && trimmed !== props.group.name) {
      void ws.groups.rename(props.group.id, trimmed)
    }
    setEditing(false)
  }

  const onEditKey = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') saveName()
    if (event.key === 'Escape') {
      setEditedName(props.group.name)
      setEditing(false)
    }
  }

  const submitTask = (event: Event): void => {
    event.preventDefault()
    const trimmed = newTaskName().trim()
    if (!trimmed) return
    void ws.tasks.add(props.group.id, trimmed)
    setNewTaskName('')
  }

  const listKey = (): ReturnType<typeof rootTasksListKey> =>
    rootTasksListKey(props.group.id)

  return (
    <section
      ref={draggable.ref}
      // The original card stays put while dragging — opacity-0 hides it; the
      // DragOverlay shows the floating ghost. No `transition-transform` here
      // (would fight solid-dnd's per-frame inline transforms anyway, even though
      // the insertion-point model doesn't shift siblings).
      class={cn(
        'rounded-lg border-2 border-border bg-secondary-background shadow-brutal overflow-hidden',
        draggable.isActiveDraggable && 'opacity-0',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={`group-item-${props.group.id}`}
    >
      <header class="flex items-center gap-2 px-4 py-3">
        <span
          {...draggable.dragActivators}
          class={cn(
            'inline-flex cursor-grab active:cursor-grabbing text-subtle-foreground hover:text-foreground transition-opacity',
            hovered() ? 'opacity-100' : 'opacity-0',
          )}
          // Decorative — the drag affordance is mouse/touch only. Keyboard
          // users can't activate it, so labeling it for screen readers would
          // advertise an action they can't perform.
          aria-hidden="true"
        >
          <GripVertical size={20} />
        </span>

        <button
          type="button"
          class="tap-44 inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
          onClick={() => void ws.groups.toggleOpen(props.group.id, !props.group.isOpen)}
          aria-expanded={props.group.isOpen}
          aria-label={props.group.isOpen ? 'Collapse group' : 'Expand group'}
        >
          <Show when={props.group.isOpen} fallback={<Folder size={20} />}>
            <FolderOpen size={20} />
          </Show>
        </button>

        <Show
          when={editing()}
          fallback={
            <h2
              class="flex-1 cursor-text select-none truncate text-xl font-bold tracking-tight"
              onDblClick={startEditing}
              title="Double-click to rename"
            >
              {props.group.name}
            </h2>
          }
        >
          <input
            ref={(el) => {
              setTimeout(() => {
                el?.focus()
                el?.select()
              }, 0)
            }}
            type="text"
            value={editedName()}
            onInput={(e) => setEditedName(e.currentTarget.value)}
            onBlur={saveName}
            onKeyDown={onEditKey}
            class="flex h-9 w-full flex-1 rounded-md border-2 border-border bg-secondary-background px-3 py-2 text-xl font-bold text-foreground shadow-brutal-sm focus-visible:shadow-brutal transition-shadow"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck={false}
            aria-label="Rename group"
          />
        </Show>

        <Show when={visibleTaskCount() > 0}>
          <span
            class="readout text-sm font-semibold text-muted-foreground"
            aria-label={`${visibleTaskCount()} ${visibleTaskCount() === 1 ? 'task' : 'tasks'}`}
          >
            {visibleTaskCount()}
          </span>
        </Show>

        <button
          type="button"
          class={cn(
            'tap-44 inline-flex h-8 w-8 items-center justify-center rounded-md bg-destructive text-destructive-foreground border-2 border-border shadow-brutal-sm brutal-press transition-opacity cursor-pointer',
            hovered() ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => void ws.groups.delete(props.group.id)}
          title="Delete group"
          aria-label="Delete group"
        >
          <Trash2 size={16} />
        </button>
      </header>

      <Show when={props.group.isOpen}>
        <div class="border-t border-foreground/15">
          <Show
            when={visibleTasks().length > 0}
            fallback={
              <p class="py-5 text-center text-sm font-medium text-subtle-foreground">
                No tasks yet.
              </p>
            }
          >
            <div class="py-1.5">
              {/* Tighter gap height for task lists — tasks pack denser than
                  groups. h-2 = 8px between adjacent tasks. */}
              <Gap
                id={`gap:${listKey()}:0`}
                listKey={listKey()}
                insertAt={0}
                heightClass="h-2"
              />
              <For each={visibleTasks()}>{(task, i) => (
                <>
                  <TaskItem task={task} groupId={props.group.id} parentId={null} />
                  <Gap
                    id={`gap:${listKey()}:${i() + 1}`}
                    listKey={listKey()}
                    insertAt={i() + 1}
                    heightClass="h-2"
                  />
                </>
              )}</For>
            </div>
          </Show>

          <form
            onSubmit={submitTask}
            class="flex gap-2 border-t border-foreground/10 bg-foreground/[0.02] px-3 py-2.5"
          >
            <input
              type="text"
              value={newTaskName()}
              onInput={(e) => setNewTaskName(e.currentTarget.value)}
              placeholder="Add a task…"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck={false}
              aria-label={`Add a task to ${props.group.name}`}
              class="flex h-9 w-full flex-1 rounded-md border-2 border-border bg-secondary-background px-3 py-2 text-sm font-medium text-foreground placeholder:text-subtle-foreground shadow-brutal-sm focus-visible:shadow-brutal transition-shadow"
            />
            <button
              type="submit"
              disabled={!newTaskName().trim()}
              class="inline-flex h-9 items-center justify-center gap-2 px-4 rounded-md bg-secondary-background text-foreground border-2 border-border shadow-brutal-sm brutal-press font-bold text-sm cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <Plus size={16} />
              Add
            </button>
          </form>
        </div>
      </Show>
    </section>
  )
}

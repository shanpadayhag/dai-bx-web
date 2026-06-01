import { For, Show, createSignal } from 'solid-js'
import { Folder } from 'lucide-solid'
import {
  DragDropProvider,
  DragDropSensors,
  SortableProvider,
  closestCenter,
  type DragEventHandler,
} from '@thisbeyond/solid-dnd'
import { useWorkspace } from '~/state/workspaceContext'
import { findTaskInTree } from '~/features/tasks/tree'
import type { Task } from '~/features/tasks/types'
import WorkspaceHeader from './WorkspaceHeader'
import GroupCreateInput from './GroupCreateInput'
import GroupItem from './GroupItem'
import ManageGroupsModal from './ManageGroupsModal'
import ImportGroupDialog from './ImportGroupDialog'
import { isItemDragData } from './dnd'

/**
 * Workspace route. Drag-and-drop is the stock `@thisbeyond/solid-dnd` sortable:
 * one `DragDropProvider` with `closestCenter` collision, and every sibling list
 * (groups, a group's root tasks, a task's subtasks) wrapped in its own
 * `SortableProvider`. A drop is honoured only between two items of the SAME
 * list; the reorder resolves the dragged and target ids to absolute sibling
 * indices and hands them to the store's splice-based `reorder`.
 */

const absSiblingsOf = (tree: Task[], parentId: string | null): Task[] => {
  if (parentId === null) return tree
  return findTaskInTree(tree, parentId)?.task.tasks ?? []
}

export default function WorkspacePage() {
  const ws = useWorkspace()
  const [manageOpen, setManageOpen] = createSignal(false)
  const [importOpen, setImportOpen] = createSignal(false)

  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    if (!droppable) return

    const from = draggable.data as unknown
    const to = droppable.data as unknown
    // Only reorder within a single list; cross-list drops are a no-op.
    if (!isItemDragData(from) || !isItemDragData(to)) return
    if (from.listKey !== to.listKey) return

    const draggedId = String(draggable.id)
    const targetId = String(droppable.id)
    if (draggedId === targetId) return

    if (from.itemKind === 'group') {
      const groups = ws.groups.state.groups
      const fromIndex = groups.findIndex((g) => g.id === draggedId)
      const toIndex = groups.findIndex((g) => g.id === targetId)
      if (fromIndex < 0 || toIndex < 0) return
      void ws.groups.reorder(fromIndex, toIndex)
      return
    }

    if (from.itemKind === 'task' && from.groupId !== undefined) {
      const tree = ws.tasks.tasksFor(from.groupId)
      const siblings = absSiblingsOf(tree, from.parentId ?? null)
      const fromIndex = siblings.findIndex((t) => t.id === draggedId)
      const toIndex = siblings.findIndex((t) => t.id === targetId)
      if (fromIndex < 0 || toIndex < 0) return
      void ws.tasks.reorder(from.groupId, from.parentId ?? null, fromIndex, toIndex)
    }
  }

  return (
    <main class="min-h-screen" aria-label="Workspace">
      <div class="max-w-3xl mx-auto px-5 py-8 sm:py-10">
        <WorkspaceHeader onManage={() => setManageOpen(true)} />

        <GroupCreateInput
          onSubmit={(name) => ws.groups.create(name)}
          onImport={() => setImportOpen(true)}
        />

        <DragDropProvider onDragEnd={onDragEnd} collisionDetector={closestCenter}>
          <DragDropSensors />

          <Show
            when={ws.groups.state.loaded}
            fallback={
              <div class="space-y-5" aria-busy="true" aria-label="Loading your tasks">
                <div class="h-32 rounded-lg border-2 border-border bg-secondary-background shadow-brutal motion-safe:animate-pulse" />
                <div class="h-32 rounded-lg border-2 border-border bg-secondary-background shadow-brutal motion-safe:animate-pulse" />
              </div>
            }
          >
            <Show when={ws.groups.hasGroups()} fallback={<EmptyState />}>
              <div class="space-y-5">
                <SortableProvider ids={ws.groups.visibleGroups().map((g) => g.id)}>
                  <For each={ws.groups.visibleGroups()}>{(group) => (
                    <GroupItem group={group} />
                  )}</For>
                </SortableProvider>
              </div>

              <Show when={ws.groups.hiddenCount() > 0}>
                <button
                  type="button"
                  onClick={() => setManageOpen(true)}
                  class="mt-8 w-full text-xs font-semibold tracking-tight text-muted-foreground hover:text-foreground transition-colors py-2 cursor-pointer"
                >
                  {ws.groups.hiddenCount()} hidden ·{' '}
                  <span class="underline underline-offset-2">Manage</span>
                </button>
              </Show>
            </Show>
          </Show>
        </DragDropProvider>
      </div>

      <ManageGroupsModal
        show={manageOpen()}
        groups={ws.groups.state.groups}
        onToggleHidden={(id, hidden) => void ws.groups.setHidden(id, hidden)}
        onShowAll={() =>
          void ws.groups.setVisibility(
            new Set(ws.groups.state.groups.map((g) => g.id)),
          )
        }
        onClose={() => setManageOpen(false)}
      />

      <ImportGroupDialog
        show={importOpen()}
        onImport={(text) => ws.importGroup(text)}
        onClose={() => setImportOpen(false)}
      />
    </main>
  )
}

function EmptyState() {
  return (
    <div class="rounded-lg border-2 border-dashed border-border/50 bg-secondary-background/40 py-14 px-6 text-center">
      <div class="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-md border-2 border-border bg-warning shadow-brutal">
        <Folder size={28} class="text-warning-foreground" />
      </div>
      <h2 class="text-xl font-bold tracking-tight text-foreground mb-1">
        No groups yet.
      </h2>
      <p class="text-sm text-muted-foreground font-medium">Create one above.</p>
    </div>
  )
}

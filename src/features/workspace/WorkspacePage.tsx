import { For, Show, createSignal, onCleanup } from 'solid-js'
import { Folder } from 'lucide-solid'
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  type CollisionDetector,
  type Draggable,
  type DragEventHandler,
} from '@thisbeyond/solid-dnd'
import { useWorkspace } from '~/state/workspaceContext'
import { findTaskInTree } from '~/features/tasks/tree'
import type { Task } from '~/features/tasks/types'
import WorkspaceHeader from './WorkspaceHeader'
import GroupCreateInput from './GroupCreateInput'
import GroupItem from './GroupItem'
import ManageGroupsModal from './ManageGroupsModal'
import Gap from './Gap'
import {
  GROUPS_LIST_KEY,
  isGapDropData,
  isItemDragData,
  visibleAbsoluteIndices,
  visibleToAbsoluteReorder,
} from './dnd'

/**
 * Workspace route. The DnD model is **insertion-point** (see `dnd.ts`): drops
 * target the gap between items, not the items themselves. A custom collision
 * detector picks the nearest gap to the cursor within the active draggable's
 * list. A `DragOverlay` provides the floating ghost. Auto-scroll near viewport
 * edges runs during any active drag.
 */

const absSiblingsOf = (tree: Task[], parentId: string | null): Task[] => {
  if (parentId === null) return tree
  return findTaskInTree(tree, parentId)?.task.tasks ?? []
}

const SCROLL_ZONE_PX = 80
const SCROLL_MAX_SPEED_PX = 18
const X_TOLERANCE_PX = 120

export default function WorkspacePage() {
  const ws = useWorkspace()
  const [manageOpen, setManageOpen] = createSignal(false)

  let pointerX = 0
  let pointerY = 0
  let dragActive = false
  let scrollRaf: number | null = null

  const onPointerMove = (event: PointerEvent): void => {
    pointerX = event.clientX
    pointerY = event.clientY
  }

  const scrollTick = (): void => {
    if (!dragActive) {
      scrollRaf = null
      return
    }
    const h = window.innerHeight
    let delta = 0
    if (pointerY < SCROLL_ZONE_PX) {
      delta = -SCROLL_MAX_SPEED_PX * (1 - pointerY / SCROLL_ZONE_PX)
    } else if (pointerY > h - SCROLL_ZONE_PX) {
      delta = SCROLL_MAX_SPEED_PX * (1 - (h - pointerY) / SCROLL_ZONE_PX)
    }
    if (delta !== 0) window.scrollBy(0, delta)
    scrollRaf = requestAnimationFrame(scrollTick)
  }

  const startDragScroll = (): void => {
    dragActive = true
    window.addEventListener('pointermove', onPointerMove)
    if (scrollRaf === null) scrollRaf = requestAnimationFrame(scrollTick)
  }

  const stopDragScroll = (): void => {
    dragActive = false
    window.removeEventListener('pointermove', onPointerMove)
    if (scrollRaf !== null) {
      cancelAnimationFrame(scrollRaf)
      scrollRaf = null
    }
  }

  onCleanup(stopDragScroll)

  /**
   * Pick the gap whose center is vertically closest to the cursor, among gaps
   * in the same list as the active draggable. Returns null when the cursor is
   * horizontally far from the list column.
   */
  const insertionPoint: CollisionDetector = (draggable, droppables) => {
    const data = draggable.data as unknown
    if (!isItemDragData(data)) return null

    const gaps = droppables.filter((d) => {
      if (d.id === draggable.id) return false
      const gd = d.data as unknown
      return isGapDropData(gd) && gd.listKey === data.listKey
    })
    if (gaps.length === 0) return null

    const sample = gaps[0]!
    if (
      pointerX < sample.layout.left - X_TOLERANCE_PX ||
      pointerX > sample.layout.right + X_TOLERANCE_PX
    ) {
      return null
    }

    let best = gaps[0]!
    let bestDist = Math.abs(best.layout.center.y - pointerY)
    for (let i = 1; i < gaps.length; i++) {
      const g = gaps[i]!
      const dist = Math.abs(g.layout.center.y - pointerY)
      if (dist < bestDist) {
        bestDist = dist
        best = g
      }
    }
    return best
  }

  const onDragStart: DragEventHandler = () => {
    startDragScroll()
  }

  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    stopDragScroll()
    if (!droppable) return

    const itemData = draggable.data as unknown
    const gapData = droppable.data as unknown
    if (!isItemDragData(itemData) || !isGapDropData(gapData)) return
    if (itemData.listKey !== gapData.listKey) return

    const draggedId = String(draggable.id)

    if (itemData.itemKind === 'group') {
      const visible = ws.groups.visibleGroups()
      const sourceVisible = visible.findIndex((g) => g.id === draggedId)
      if (sourceVisible < 0) return
      const identityMap: number[] = []
      for (let i = 0; i < visible.length; i++) identityMap.push(i)
      const args = visibleToAbsoluteReorder(
        identityMap,
        visible.length,
        sourceVisible,
        gapData.insertAt,
      )
      if (!args) return
      void ws.groups.reorderVisible(args.from, args.to)
      return
    }

    if (itemData.itemKind === 'task' && itemData.groupId !== undefined) {
      const tree = ws.tasks.tasksFor(itemData.groupId)
      const siblings = absSiblingsOf(tree, itemData.parentId ?? null)
      const visibleAbs = visibleAbsoluteIndices(siblings)
      const sourceVisible = visibleAbs.findIndex(
        (absIdx) => siblings[absIdx]?.id === draggedId,
      )
      if (sourceVisible < 0) return
      const args = visibleToAbsoluteReorder(
        visibleAbs,
        siblings.length,
        sourceVisible,
        gapData.insertAt,
      )
      if (!args) return
      void ws.tasks.reorder(itemData.groupId, itemData.parentId ?? null, args.from, args.to)
    }
  }

  return (
    <main class="min-h-screen" aria-label="Workspace">
      <div class="max-w-3xl mx-auto px-5 py-8 sm:py-10">
        <WorkspaceHeader onManage={() => setManageOpen(true)} />

        <GroupCreateInput onSubmit={(name) => ws.groups.create(name)} />

        <DragDropProvider
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          collisionDetector={insertionPoint}
        >
          <DragDropSensors />
          <DragOverlay>
            {(active) => <DragGhost draggable={active} />}
          </DragOverlay>

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
              <div>
                <Gap id="gap:groups:0" listKey={GROUPS_LIST_KEY} insertAt={0} />
                <For each={ws.groups.visibleGroups()}>{(group, i) => (
                  <>
                    <GroupItem group={group} />
                    <Gap
                      id={`gap:groups:${i() + 1}`}
                      listKey={GROUPS_LIST_KEY}
                      insertAt={i() + 1}
                    />
                  </>
                )}</For>
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
    </main>
  )
}

/**
 * Floating ghost rendered inside DragOverlay. Compact and uniformly sized.
 */
function DragGhost(props: { draggable: Draggable | null }) {
  const ws = useWorkspace()

  const view = () => {
    const d = props.draggable
    if (!d) return null
    const data = d.data as unknown
    if (!isItemDragData(data)) return null
    const id = String(d.id)
    if (data.itemKind === 'group') {
      const group = ws.groups.state.groups.find((g) => g.id === id)
      if (!group) return null
      return (
        <div class="rounded-lg border-2 border-border bg-secondary-background shadow-brutal-lg px-4 py-3 cursor-grabbing">
          <span class="text-xl font-bold tracking-tight text-foreground">{group.name}</span>
        </div>
      )
    }
    if (data.itemKind === 'task') {
      const found = ws.tasks.findTask(id)
      if (!found) return null
      return (
        <div class="rounded-md border-2 border-border bg-secondary-background shadow-brutal px-3 py-2 cursor-grabbing">
          <span class="text-sm font-semibold tracking-tight text-foreground">{found.task.name}</span>
        </div>
      )
    }
    return null
  }

  return <Show when={view()}>{view()}</Show>
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

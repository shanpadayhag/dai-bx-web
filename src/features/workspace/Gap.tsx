import { Show } from 'solid-js'
import { createDroppable, useDragDropContext } from '@thisbeyond/solid-dnd'
import { isItemDragData, type GapDropData, type ListKey } from './dnd'

/**
 * Invisible drop zone between two list items (or at the head/tail of the list).
 * Renders a thin carbon line when it is the active drop target and the active
 * draggable belongs to the same list.
 */

interface GapProps {
  id: string
  listKey: ListKey
  insertAt: number
  /** Tailwind height utility, defaults to `h-5` (20px). */
  heightClass?: string
}

export default function Gap(props: GapProps) {
  const droppable = createDroppable(props.id, {
    kind: 'gap',
    listKey: props.listKey,
    insertAt: props.insertAt,
  } satisfies GapDropData)

  const ctx = useDragDropContext()

  const showLine = (): boolean => {
    if (!droppable.isActiveDroppable) return false
    if (!ctx) return true
    const [state] = ctx
    const active = state.active.draggable
    if (!active) return false
    return isItemDragData(active.data) && active.data.listKey === props.listKey
  }

  return (
    <div
      ref={droppable.ref}
      class={`relative ${props.heightClass ?? 'h-5'}`}
      aria-hidden="true"
    >
      <Show when={showLine()}>
        {/*
          4px Instrument Blue line with a 2px carbon offset shadow underneath.
          Blue is the brand's state-signal color (DESIGN.md "Single Voice Rule" —
          this is where the user's eye should land). The carbon drop-shadow
          echoes the `shadow-brutal` vocabulary so the line reads as a
          brutalist artifact, not generic chrome.
        */}
        <div
          class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-primary shadow-[0_2px_0_0_var(--border)]"
        />
      </Show>
    </div>
  )
}

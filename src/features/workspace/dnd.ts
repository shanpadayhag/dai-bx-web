/**
 * Drag-and-drop identity for the workspace's sortable lists.
 *
 * The model is the stock `@thisbeyond/solid-dnd` sortable: every item is a
 * `createSortable` (draggable + droppable), each sibling list is wrapped in a
 * `SortableProvider`, and `closestCenter` resolves the drop. The dragged item
 * moves under the cursor while its siblings shift to open a slot.
 *
 * The only thing this module carries is enough payload on each sortable to:
 *   1. recognise which list an item belongs to (so a drop is only honoured
 *      between two items of the SAME list), and
 *   2. route the reorder to the right store call (groups vs. tasks, and which
 *      group / parent for tasks).
 *
 * The from/to index math lives in the stores' splice-based `reorder`; the drop
 * handler just resolves the dragged and target ids to absolute sibling indices.
 */

// ────────────────────────────────────────────────────────────────────────────
// List identification

export type ListKey =
  | 'groups'
  | `tasks:${string}` // root tasks of group {gid}
  | `tasks:${string}:${string}` // subtasks of parent {pid} in group {gid}

export const GROUPS_LIST_KEY: ListKey = 'groups'

export const rootTasksListKey = (groupId: string): ListKey =>
  `tasks:${groupId}`

export const subtasksListKey = (
  groupId: string,
  parentId: string,
): ListKey => `tasks:${groupId}:${parentId}`

// ────────────────────────────────────────────────────────────────────────────
// Sortable payload

export interface ItemDragData {
  kind: 'item'
  itemKind: 'group' | 'task'
  listKey: ListKey
  groupId?: string
  parentId?: string | null
}

export const isItemDragData = (d: unknown): d is ItemDragData => {
  if (!d || typeof d !== 'object') return false
  const x = d as Partial<ItemDragData>
  return x.kind === 'item' && typeof x.listKey === 'string'
}

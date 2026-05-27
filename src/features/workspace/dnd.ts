/**
 * Insertion-point DnD model.
 *
 * Instead of "swap item A with item B," drops target the **gap** between two
 * items (or before the first / after the last). Each list (groups, root tasks
 * of a group, subtasks of a parent task) renders N+1 invisible gap droppables
 * interleaved with its N items. The collision detector picks the gap nearest
 * the cursor. A visible 2px carbon line snaps into the active gap.
 *
 * Why this model:
 *   - Symmetric collision regardless of item sizes — the gap is the target,
 *     not the item, so big-card-over-small and small-card-over-big behave the
 *     same.
 *   - First-class "above the first" and "below the last" insertion points.
 *   - Items don't shift visually during a drag (no chasing), keeping the
 *     interaction crisp and instrument-like.
 */

import { isVisibleToday } from '~/features/tasks/tree'
import type { Task } from '~/features/tasks/types'

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
// Drag/drop payloads

export interface ItemDragData {
  kind: 'item'
  itemKind: 'group' | 'task'
  listKey: ListKey
  groupId?: string
  parentId?: string | null
}

export interface GapDropData {
  kind: 'gap'
  listKey: ListKey
  /** Insertion index in the VISIBLE list, 0..visibleLength inclusive. */
  insertAt: number
}

export const isItemDragData = (d: unknown): d is ItemDragData => {
  if (!d || typeof d !== 'object') return false
  const x = d as Partial<ItemDragData>
  return x.kind === 'item' && typeof x.listKey === 'string'
}

export const isGapDropData = (d: unknown): d is GapDropData => {
  if (!d || typeof d !== 'object') return false
  const x = d as Partial<GapDropData>
  return (
    x.kind === 'gap' &&
    typeof x.listKey === 'string' &&
    typeof x.insertAt === 'number'
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Index math

/** True when the requested insertion index is the source's own current slot. */
export const isNoOpInsertion = (
  sourceVisible: number,
  insertVisible: number,
): boolean =>
  insertVisible === sourceVisible || insertVisible === sourceVisible + 1

export interface ReorderArgs {
  /** Index of the source item in the FULL (absolute) array. */
  from: number
  /** Destination index passed to `moveInArray` (post-removal). */
  to: number
}

/**
 * Maps a (visible source, visible insertion) pair to the (from, to) arguments
 * expected by `moveInArray` / repository reorder. Accounts for hidden siblings
 * and for the index shift that happens when the source is removed first.
 */
export function visibleToAbsoluteReorder(
  visibleAbsIndices: number[],
  totalLength: number,
  sourceVisible: number,
  insertVisible: number,
): ReorderArgs | null {
  if (isNoOpInsertion(sourceVisible, insertVisible)) return null
  const from = visibleAbsIndices[sourceVisible]
  if (from === undefined) return null

  const beforeAbs =
    insertVisible < visibleAbsIndices.length
      ? visibleAbsIndices[insertVisible]!
      : totalLength

  // `moveInArray` splices the source out first, then inserts at `to` in the
  // shortened array. If the source was before the insertion point, every
  // index past it shifts down by 1.
  const to = from < beforeAbs ? beforeAbs - 1 : beforeAbs
  return { from, to }
}

/**
 * Compute the visible-only absolute-index map for a sibling list.
 * Returns array where `result[i]` is the absolute index of the i-th visible item.
 */
export function visibleAbsoluteIndices(siblings: readonly Task[]): number[] {
  const out: number[] = []
  for (let i = 0; i < siblings.length; i++) {
    const s = siblings[i]
    if (s && isVisibleToday(s)) out.push(i)
  }
  return out
}

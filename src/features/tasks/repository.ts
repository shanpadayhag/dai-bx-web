/**
 * Tasks data-access. Ported from
 *   client-web-old/src/app/features/tasks/data-access/tasks.repository.ts
 *
 * Same swallow-on-error pattern as Angular — the data layer never throws to
 * the UI. Every read hydrates `alarm` via `normalizeAlarm` so a malformed
 * persisted alarm cannot crash the scheduler.
 *
 * Naming note: T8 description lists `deleteTaskSubtree` but tree-building
 * logic belongs in `tree.ts`. The repository exposes the primitive
 * `deleteTaskRows(ids)`; the store collects subtree ids via
 * `collectSubtreeIds` and calls it.
 */

import { getDb, STORES, TASK_INDEXES } from '~/lib/db'
import { normalizeAlarm } from '~/features/alarms/types'
import type { TaskRow } from './types'

const hydrateRow = (row: TaskRow): TaskRow => ({
  ...row,
  alarm: normalizeAlarm(row.alarm),
})

export const listAllTaskRows = async (): Promise<TaskRow[]> => {
  try {
    const db = await getDb()
    const rows = (await db.getAll(STORES.tasks)) as TaskRow[]
    return rows.map(hydrateRow)
  } catch {
    return []
  }
}

export const listTaskRowsByGroup = async (groupId: string): Promise<TaskRow[]> => {
  try {
    const db = await getDb()
    const rows = (await db.getAllFromIndex(
      STORES.tasks,
      TASK_INDEXES.byGroup,
      groupId,
    )) as TaskRow[]
    return rows.map(hydrateRow)
  } catch {
    return []
  }
}

export const putTaskRow = async (row: TaskRow): Promise<void> => {
  try {
    const db = await getDb()
    await db.put(STORES.tasks, row)
  } catch {
    /* ignore */
  }
}

export const putTaskRowBatch = async (rows: TaskRow[]): Promise<void> => {
  if (rows.length === 0) return
  try {
    const db = await getDb()
    const tx = db.transaction(STORES.tasks, 'readwrite')
    for (const row of rows) await tx.store.put(row)
    await tx.done
  } catch {
    /* ignore */
  }
}

export const deleteTaskRows = async (taskIds: string[]): Promise<void> => {
  if (taskIds.length === 0) return
  try {
    const db = await getDb()
    const tx = db.transaction(STORES.tasks, 'readwrite')
    for (const id of taskIds) await tx.store.delete(id)
    await tx.done
  } catch {
    /* ignore */
  }
}

export const deleteTasksByGroupId = async (groupId: string): Promise<void> => {
  try {
    const db = await getDb()
    const tx = db.transaction(STORES.tasks, 'readwrite')
    const keys = (await tx.store.index(TASK_INDEXES.byGroup).getAllKeys(groupId)) as string[]
    for (const key of keys) await tx.store.delete(key)
    await tx.done
  } catch {
    /* ignore */
  }
}

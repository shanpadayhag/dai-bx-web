/**
 * Groups data-access. Ported 1:1 from
 *   client-web-old/src/app/features/groups/data-access/groups.repository.ts
 *
 * Same swallow-on-error behavior as the Angular version — the data layer never
 * throws to the UI; an empty list is the worst-case observable. Cascading
 * delete walks the by-group index on the tasks store.
 */

import { getDb, STORES, TASK_INDEXES } from '~/lib/db'
import type { GroupRow } from './types'

export const listGroups = async (): Promise<GroupRow[]> => {
  try {
    const db = await getDb()
    const rows = (await db.getAll(STORES.groups)) as GroupRow[]
    rows.sort((a, b) => a.order - b.order)
    return rows.map((row) => ({ ...row, isHidden: row.isHidden === true }))
  } catch {
    return []
  }
}

export const putGroup = async (row: GroupRow): Promise<void> => {
  try {
    const db = await getDb()
    await db.put(STORES.groups, row)
  } catch {
    /* ignore */
  }
}

export const putGroupBatch = async (rows: GroupRow[]): Promise<void> => {
  if (rows.length === 0) return
  try {
    const db = await getDb()
    const tx = db.transaction(STORES.groups, 'readwrite')
    for (const row of rows) await tx.store.put(row)
    await tx.done
  } catch {
    /* ignore */
  }
}

export const deleteGroupAndTasks = async (groupId: string): Promise<void> => {
  try {
    const db = await getDb()
    const tx = db.transaction([STORES.groups, STORES.tasks], 'readwrite')
    const taskKeys = (await tx
      .objectStore(STORES.tasks)
      .index(TASK_INDEXES.byGroup)
      .getAllKeys(groupId)) as string[]
    for (const key of taskKeys) await tx.objectStore(STORES.tasks).delete(key)
    await tx.objectStore(STORES.groups).delete(groupId)
    await tx.done
  } catch {
    /* ignore */
  }
}

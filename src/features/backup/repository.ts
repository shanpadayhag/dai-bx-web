/**
 * Backup data-access. Reads every store for export, and applies an imported
 * backup as a single all-or-nothing transaction.
 *
 * `replaceAllStores` decodes all base64 audio into `Blob`s BEFORE opening the
 * transaction, so any decode error fails fast with the DB untouched. The write
 * itself is one `readwrite` transaction spanning all four stores: each is
 * cleared then repopulated, and `tx.done` is awaited. Any throw aborts the
 * transaction, so IndexedDB rolls back to the exact pre-import state.
 */

import { getDb, STORES } from '~/lib/db'
import type { GroupRow } from '~/features/groups/types'
import type { TaskRow } from '~/features/tasks/types'
import type { PreferencesRow } from '~/features/preferences/types'
import type { SoundRow } from '~/features/sounds/types'
import { base64ToBytes } from './base64'
import type { BackupFile } from './types'

export interface AllStores {
  groups: GroupRow[]
  tasks: TaskRow[]
  preferences: PreferencesRow[]
  sounds: SoundRow[]
}

/** Read every record from all four stores (sounds with their `Blob`s). */
export const readAllStores = async (): Promise<AllStores> => {
  const db = await getDb()
  const [groups, tasks, preferences, sounds] = await Promise.all([
    db.getAll(STORES.groups) as Promise<GroupRow[]>,
    db.getAll(STORES.tasks) as Promise<TaskRow[]>,
    db.getAll(STORES.preferences) as Promise<PreferencesRow[]>,
    db.getAll(STORES.sounds) as Promise<SoundRow[]>,
  ])
  return { groups, tasks, preferences, sounds }
}

/** Rebuild a stored `SoundRow` (meta + `Blob`) from a base64-carried backup sound. */
const toSoundRow = (sound: BackupFile['data']['sounds'][number]): SoundRow => {
  const bytes = base64ToBytes(sound.audioBase64)
  return {
    id: sound.id,
    name: sound.name,
    contentType: sound.contentType,
    sizeBytes: sound.sizeBytes,
    createdAt: sound.createdAt,
    blob: new Blob([bytes], { type: sound.contentType }),
  }
}

/**
 * Replace all four stores with the backup's contents in one transaction.
 * All decoding happens first; if anything throws, the transaction aborts and
 * pre-existing data is preserved.
 */
export const replaceAllStores = async (file: BackupFile): Promise<void> => {
  const { groups, tasks, preferences } = file.data
  const soundRows = file.data.sounds.map(toSoundRow)

  const db = await getDb()
  const tx = db.transaction(
    [STORES.groups, STORES.tasks, STORES.preferences, STORES.sounds],
    'readwrite',
  )

  // Issue every clear + put synchronously (no intermediate await): an await
  // between operations would let IndexedDB auto-commit / deactivate the
  // transaction, breaking the all-or-nothing guarantee. Within a store,
  // requests run in issue order, so clear() always precedes its put()s.
  const ops: Promise<unknown>[] = []
  try {
    const groupsStore = tx.objectStore(STORES.groups)
    const tasksStore = tx.objectStore(STORES.tasks)
    const preferencesStore = tx.objectStore(STORES.preferences)
    const soundsStore = tx.objectStore(STORES.sounds)

    ops.push(
      groupsStore.clear(),
      tasksStore.clear(),
      preferencesStore.clear(),
      soundsStore.clear(),
    )
    for (const row of groups) ops.push(groupsStore.put(row))
    for (const row of tasks) ops.push(tasksStore.put(row))
    for (const row of preferences) ops.push(preferencesStore.put(row))
    for (const row of soundRows) ops.push(soundsStore.put(row))

    await Promise.all([...ops, tx.done])
  } catch (error) {
    // A malformed row makes put() throw synchronously mid-issuance, which would
    // otherwise let the already-queued writes auto-commit. Abort to force the
    // all-or-nothing rollback, then drain every queued op's resulting
    // AbortError (so none surfaces as an unhandled rejection) before surfacing
    // the original error.
    try {
      tx.abort()
    } catch {
      /* already settled — nothing to abort */
    }
    await Promise.allSettled([...ops, tx.done.catch(() => undefined)])
    throw error
  }
}

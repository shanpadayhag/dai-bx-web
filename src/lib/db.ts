/**
 * IndexedDB schema + open helpers.
 *
 * Ported byte-for-byte from
 *   client-web-old/src/app/core/db/database.schema.ts
 *   client-web-old/src/app/core/db/database.service.ts
 *
 * The schema is locked at version 3 forever (per requirements). Same DB name,
 * same store names, same `by-group` index. Reusing the exact `upgradeDatabase`
 * means an existing v3 IndexedDB opens without triggering the upgrade path.
 */

import { type IDBPDatabase, openDB } from 'idb'

export const DB_NAME = 'daibx_app'
export const DB_VERSION = 3

export const STORES = {
  groups: 'groups',
  tasks: 'tasks',
  sounds: 'sounds',
  preferences: 'preferences',
} as const

export const TASK_INDEXES = {
  byGroup: 'by-group',
} as const

export const PREFERENCES_KEY = 'global'

export const upgradeDatabase = (db: IDBPDatabase, oldVersion: number): void => {
  if (oldVersion < 2) {
    if (!db.objectStoreNames.contains(STORES.groups)) {
      db.createObjectStore(STORES.groups, { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains(STORES.tasks)) {
      const tasks = db.createObjectStore(STORES.tasks, { keyPath: 'id' })
      tasks.createIndex(TASK_INDEXES.byGroup, 'groupId')
    }
  }
  if (oldVersion < 3) {
    if (!db.objectStoreNames.contains(STORES.sounds)) {
      db.createObjectStore(STORES.sounds, { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains(STORES.preferences)) {
      db.createObjectStore(STORES.preferences, { keyPath: 'id' })
    }
  }
}

/**
 * Open the DaiBX IndexedDB at the locked schema version. Always returns a fresh
 * promise; callers that want a singleton-cached connection should use `getDb()`.
 */
export const openDaibxDb = (): Promise<IDBPDatabase> =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      upgradeDatabase(db, oldVersion)
    },
  })

let cachedDb: Promise<IDBPDatabase> | null = null

/**
 * App-wide singleton accessor. Lazily opens on first call; subsequent calls
 * return the same promise. The vast majority of repositories use this.
 */
export const getDb = (): Promise<IDBPDatabase> => {
  if (!cachedDb) cachedDb = openDaibxDb()
  return cachedDb
}

/**
 * Close and drop the cached connection. Test-only — use `getDb()` everywhere
 * else, and let the browser manage the connection lifetime.
 */
export const __resetForTests = async (): Promise<void> => {
  if (!cachedDb) return
  try {
    const db = await cachedDb
    db.close()
  } finally {
    cachedDb = null
  }
}

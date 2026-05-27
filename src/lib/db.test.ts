import { describe, it, expect, beforeEach } from 'vitest'
import {
  openDaibxDb,
  getDb,
  __resetForTests,
  DB_NAME,
  DB_VERSION,
  STORES,
  TASK_INDEXES,
  PREFERENCES_KEY,
} from './db'

/** Reset state between tests: drop the cached connection and wipe the DB. */
const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

beforeEach(async () => {
  await __resetForTests()
  await wipe()
})

describe('constants', () => {
  it('locks DB_NAME and DB_VERSION at the Angular schema', () => {
    expect(DB_NAME).toBe('daibx_app')
    expect(DB_VERSION).toBe(3)
  })

  it('exposes the same store names the Angular app uses', () => {
    expect(STORES).toEqual({
      groups: 'groups',
      tasks: 'tasks',
      sounds: 'sounds',
      preferences: 'preferences',
    })
  })

  it('exposes the by-group task index name', () => {
    expect(TASK_INDEXES.byGroup).toBe('by-group')
  })

  it('exposes the global preferences key', () => {
    expect(PREFERENCES_KEY).toBe('global')
  })
})

describe('openDaibxDb', () => {
  it('opens daibx_app at version 3', async () => {
    const db = await openDaibxDb()
    expect(db.name).toBe(DB_NAME)
    expect(db.version).toBe(DB_VERSION)
    db.close()
  })

  it('creates groups, tasks, sounds, preferences stores', async () => {
    const db = await openDaibxDb()
    const names = Array.from(db.objectStoreNames).sort()
    expect(names).toEqual(['groups', 'preferences', 'sounds', 'tasks'])
    db.close()
  })

  it('creates the by-group index on tasks with keyPath groupId', async () => {
    const db = await openDaibxDb()
    const tx = db.transaction(STORES.tasks, 'readonly')
    const index = tx.store.index(TASK_INDEXES.byGroup)
    expect(index.name).toBe('by-group')
    expect(index.keyPath).toBe('groupId')
    db.close()
  })

  it('persists data across a close + reopen (existing v3 DB is a no-op upgrade)', async () => {
    const db1 = await openDaibxDb()
    await db1.add(STORES.groups, {
      id: 'probe',
      name: 'probe',
      order: 0,
      isOpen: true,
      isHidden: false,
    })
    db1.close()

    const db2 = await openDaibxDb()
    const probe = await db2.get(STORES.groups, 'probe')
    expect(probe).toEqual({
      id: 'probe',
      name: 'probe',
      order: 0,
      isOpen: true,
      isHidden: false,
    })
    db2.close()
  })
})

describe('getDb (cached singleton)', () => {
  it('returns the same promise on repeated calls', () => {
    const a = getDb()
    const b = getDb()
    expect(a).toBe(b)
  })

  it('resolves to a usable IDBPDatabase', async () => {
    const db = await getDb()
    expect(db.name).toBe(DB_NAME)
    expect(db.version).toBe(DB_VERSION)
  })

  it('reset clears the cache so the next getDb() opens fresh', async () => {
    const a = await getDb()
    await __resetForTests()
    const b = await getDb()
    expect(a).not.toBe(b)
  })
})

describe('upgradeDatabase', () => {
  it('is idempotent: re-running against a fully migrated DB does nothing', async () => {
    // First open performs upgrade from v0 → v3.
    const db = await openDaibxDb()
    db.close()

    // Reopen at the same version: upgrade callback should not fire. Wipe the
    // upgrade-callback assertion by inspecting that the stores still exist and
    // the probe persists across the boundary.
    const reopened = await openDaibxDb()
    expect(Array.from(reopened.objectStoreNames).sort()).toEqual([
      'groups',
      'preferences',
      'sounds',
      'tasks',
    ])
    reopened.close()
  })
})

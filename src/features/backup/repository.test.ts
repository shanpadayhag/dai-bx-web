import { beforeEach, describe, it, expect } from 'vitest'
import { DB_NAME, STORES, __resetForTests, getDb } from '~/lib/db'
import type { GroupRow } from '~/features/groups/types'
import type { TaskRow } from '~/features/tasks/types'
import type { SoundRow } from '~/features/sounds/types'
import { readAllStores, replaceAllStores } from './repository'
import { BACKUP_FORMAT, BACKUP_FORMAT_VERSION, type BackupFile } from './types'

const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

const group = (id: string): GroupRow => ({
  id,
  name: `group-${id}`,
  order: 0,
  isOpen: true,
  isHidden: false,
})

const task = (id: string, groupId: string): TaskRow => ({
  id,
  groupId,
  parentId: null,
  name: `task-${id}`,
  order: 0,
  hiddenUntil: null,
  completedDate: null,
  isOpen: true,
  alarm: null,
  timerSets: [],
  activeTimerSetId: null,
})

const soundRow = (id: string): SoundRow => ({
  id,
  name: `sound-${id}`,
  contentType: 'audio/mpeg',
  sizeBytes: 5,
  createdAt: '2026-05-31T10:00:00.000Z',
  blob: new Blob(['bytes'], { type: 'audio/mpeg' }),
})

const emptyFile = (): BackupFile => ({
  format: BACKUP_FORMAT,
  formatVersion: BACKUP_FORMAT_VERSION,
  dbVersion: 3,
  exportedAt: '2026-05-31T12:00:00.000Z',
  data: { groups: [], tasks: [], preferences: [], sounds: [] },
})

beforeEach(async () => {
  await __resetForTests()
  await wipe()
})

describe('readAllStores', () => {
  it('returns empty collections for a fresh DB', async () => {
    expect(await readAllStores()).toEqual({
      groups: [],
      tasks: [],
      preferences: [],
      sounds: [],
    })
  })

  it('returns every record from a populated DB', async () => {
    const db = await getDb()
    await db.put(STORES.groups, group('g1'))
    await db.put(STORES.tasks, task('t1', 'g1'))
    await db.put(STORES.preferences, { id: 'global', defaultSoundId: 's1' })
    await db.put(STORES.sounds, soundRow('s1'))

    const all = await readAllStores()
    expect(all.groups).toHaveLength(1)
    expect(all.tasks[0]?.id).toBe('t1')
    expect(all.preferences[0]?.defaultSoundId).toBe('s1')
    expect(all.sounds[0]?.id).toBe('s1')
  })
})

describe('replaceAllStores', () => {
  it('fully replaces prior data (replace, not merge)', async () => {
    const db = await getDb()
    await db.put(STORES.groups, group('old'))
    await db.put(STORES.tasks, task('oldTask', 'old'))

    const file = emptyFile()
    file.data.groups = [group('new')]
    await replaceAllStores(file)

    const all = await readAllStores()
    expect(all.groups.map((g) => g.id)).toEqual(['new'])
    expect(all.tasks).toEqual([])
  })

  it('rebuilds sound blobs from base64', async () => {
    const file = emptyFile()
    file.data.sounds = [
      {
        id: 's1',
        name: 'beep',
        contentType: 'audio/wav',
        sizeBytes: 3,
        createdAt: '2026-05-31T10:00:00.000Z',
        audioBase64: btoa('abc'),
      },
    ]
    await replaceAllStores(file)

    const all = await readAllStores()
    expect(all.sounds).toHaveLength(1)
    expect(all.sounds[0]?.contentType).toBe('audio/wav')
  })

  it('rolls back completely when a write fails mid-transaction', async () => {
    const db = await getDb()
    await db.put(STORES.groups, group('original'))

    const file = emptyFile()
    file.data.groups = [group('willBeRolledBack')]
    // A task row with no `id` violates the keyPath, so its put() rejects and
    // aborts the whole transaction after the stores were already cleared.
    file.data.tasks = [{ name: 'no id' } as unknown as TaskRow]

    await expect(replaceAllStores(file)).rejects.toBeDefined()

    const all = await readAllStores()
    expect(all.groups.map((g) => g.id)).toEqual(['original'])
    expect(all.tasks).toEqual([])
  })
})

import { beforeEach, describe, it, expect } from 'vitest'
import { DB_NAME, STORES, __resetForTests, getDb } from '~/lib/db'
import {
  deleteGroupAndTasks,
  listGroups,
  putGroup,
  putGroupBatch,
} from './repository'
import type { GroupRow } from './types'

const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

const groupRow = (overrides: Partial<GroupRow>): GroupRow => ({
  id: 'g',
  name: 'G',
  order: 0,
  isOpen: true,
  isHidden: false,
  ...overrides,
})

beforeEach(async () => {
  await __resetForTests()
  await wipe()
})

describe('listGroups', () => {
  it('returns an empty list when no groups exist', async () => {
    expect(await listGroups()).toEqual([])
  })

  it('returns rows ordered by their order field', async () => {
    await putGroup(groupRow({ id: 'a', name: 'A', order: 2 }))
    await putGroup(groupRow({ id: 'b', name: 'B', order: 0 }))
    await putGroup(groupRow({ id: 'c', name: 'C', order: 1 }))
    const ids = (await listGroups()).map((g) => g.id)
    expect(ids).toEqual(['b', 'c', 'a'])
  })

  it('coerces missing/non-boolean isHidden to false', async () => {
    // Write a record with isHidden=undefined via the raw store, bypassing types.
    const db = await getDb()
    await db.put(STORES.groups, {
      id: 'x',
      name: 'X',
      order: 0,
      isOpen: true,
    } as unknown as GroupRow)
    const [row] = await listGroups()
    expect(row?.isHidden).toBe(false)
  })
})

describe('putGroup', () => {
  it('upserts a single row', async () => {
    await putGroup(groupRow({ id: 'a', name: 'A' }))
    await putGroup(groupRow({ id: 'a', name: 'A renamed', isOpen: false }))
    const [row] = await listGroups()
    expect(row?.name).toBe('A renamed')
    expect(row?.isOpen).toBe(false)
  })
})

describe('putGroupBatch', () => {
  it('is a no-op on empty input', async () => {
    await putGroupBatch([])
    expect(await listGroups()).toEqual([])
  })

  it('upserts many rows in one transaction', async () => {
    await putGroupBatch([
      groupRow({ id: 'a', name: 'A', order: 0 }),
      groupRow({ id: 'b', name: 'B', order: 1, isOpen: false }),
    ])
    const all = await listGroups()
    expect(all).toHaveLength(2)
    expect(all.find((g) => g.id === 'b')?.isOpen).toBe(false)
  })
})

describe('deleteGroupAndTasks', () => {
  it('removes the group AND its tasks via the by-group index', async () => {
    await putGroupBatch([
      groupRow({ id: 'g1', name: 'A', order: 0 }),
      groupRow({ id: 'g2', name: 'B', order: 1 }),
    ])

    // Seed raw task rows for both groups.
    const db = await getDb()
    const tx = db.transaction(STORES.tasks, 'readwrite')
    await tx.store.put({
      id: 't1',
      groupId: 'g1',
      parentId: null,
      name: 'in g1 root',
      order: 0,
      hiddenUntil: null,
      completedDate: null,
      isOpen: true,
      alarm: null,
      timerSets: [],
      activeTimerSetId: null,
    })
    await tx.store.put({
      id: 't2',
      groupId: 'g1',
      parentId: 't1',
      name: 'in g1 child',
      order: 0,
      hiddenUntil: null,
      completedDate: null,
      isOpen: true,
      alarm: null,
      timerSets: [],
      activeTimerSetId: null,
    })
    await tx.store.put({
      id: 't3',
      groupId: 'g2',
      parentId: null,
      name: 'in g2',
      order: 0,
      hiddenUntil: null,
      completedDate: null,
      isOpen: true,
      alarm: null,
      timerSets: [],
      activeTimerSetId: null,
    })
    await tx.done

    await deleteGroupAndTasks('g1')

    expect((await listGroups()).map((g) => g.id)).toEqual(['g2'])

    const remainingTasks = await (await getDb()).getAll(STORES.tasks)
    expect(remainingTasks.map((t) => (t as { id: string }).id)).toEqual(['t3'])
  })

  it('is a no-op for an unknown group id', async () => {
    await putGroup(groupRow({ id: 'a', name: 'A' }))
    await deleteGroupAndTasks('nope')
    expect((await listGroups()).map((g) => g.id)).toEqual(['a'])
  })
})

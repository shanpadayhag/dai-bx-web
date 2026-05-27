import { beforeEach, describe, it, expect } from 'vitest'
import { DB_NAME, __resetForTests } from '~/lib/db'
import {
  deleteTaskRows,
  deleteTasksByGroupId,
  listAllTaskRows,
  listTaskRowsByGroup,
  putTaskRow,
  putTaskRowBatch,
} from './repository'
import type { TaskRow } from './types'

const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

const taskRow = (overrides: Partial<TaskRow>): TaskRow => ({
  id: 't',
  groupId: 'g',
  parentId: null,
  name: 'T',
  order: 0,
  hiddenUntil: null,
  completedDate: null,
  isOpen: true,
  alarm: null,
  timerSets: [],
  activeTimerSetId: null,
  ...overrides,
})

beforeEach(async () => {
  await __resetForTests()
  await wipe()
})

describe('listAllTaskRows', () => {
  it('returns an empty list when no rows exist', async () => {
    expect(await listAllTaskRows()).toEqual([])
  })

  it('returns every row across groups', async () => {
    await putTaskRowBatch([
      taskRow({ id: 't1', groupId: 'g1' }),
      taskRow({ id: 't2', groupId: 'g1', parentId: 't1' }),
      taskRow({ id: 't3', groupId: 'g2' }),
    ])
    const ids = (await listAllTaskRows()).map((r) => r.id).sort()
    expect(ids).toEqual(['t1', 't2', 't3'])
  })

  it('hydrates malformed alarm rows to null via normalizeAlarm', async () => {
    await putTaskRow(
      taskRow({
        id: 't1',
        alarm: { not: 'a valid alarm' } as unknown as TaskRow['alarm'],
      }),
    )
    const [row] = await listAllTaskRows()
    expect(row?.alarm).toBeNull()
  })
})

describe('listTaskRowsByGroup', () => {
  it('returns only the rows whose groupId matches', async () => {
    await putTaskRowBatch([
      taskRow({ id: 't1', groupId: 'g1' }),
      taskRow({ id: 't2', groupId: 'g2' }),
      taskRow({ id: 't3', groupId: 'g1', parentId: 't1' }),
    ])
    const rows = await listTaskRowsByGroup('g1')
    expect(rows.map((r) => r.id).sort()).toEqual(['t1', 't3'])
  })

  it('returns an empty list when the group has no tasks', async () => {
    expect(await listTaskRowsByGroup('nope')).toEqual([])
  })
})

describe('putTaskRow / putTaskRowBatch', () => {
  it('upserts a single row', async () => {
    await putTaskRow(taskRow({ id: 't1', name: 'Original' }))
    await putTaskRow(taskRow({ id: 't1', name: 'Renamed' }))
    const rows = await listAllTaskRows()
    expect(rows[0]?.name).toBe('Renamed')
  })

  it('putTaskRowBatch is a no-op on empty input', async () => {
    await putTaskRowBatch([])
    expect(await listAllTaskRows()).toEqual([])
  })

  it('putTaskRowBatch upserts many rows in one transaction', async () => {
    await putTaskRowBatch([
      taskRow({ id: 't1', name: 'A' }),
      taskRow({ id: 't2', name: 'B', parentId: 't1' }),
    ])
    expect((await listAllTaskRows()).map((r) => r.id).sort()).toEqual(['t1', 't2'])
  })
})

describe('deleteTaskRows', () => {
  it('removes the specified rows', async () => {
    await putTaskRowBatch([
      taskRow({ id: 't1' }),
      taskRow({ id: 't2' }),
      taskRow({ id: 't3' }),
    ])
    await deleteTaskRows(['t1', 't3'])
    expect((await listAllTaskRows()).map((r) => r.id)).toEqual(['t2'])
  })

  it('is a no-op on empty input', async () => {
    await putTaskRow(taskRow({ id: 't1' }))
    await deleteTaskRows([])
    expect((await listAllTaskRows()).map((r) => r.id)).toEqual(['t1'])
  })
})

describe('deleteTasksByGroupId', () => {
  it('removes every task in the specified group via the by-group index', async () => {
    await putTaskRowBatch([
      taskRow({ id: 't1', groupId: 'g1' }),
      taskRow({ id: 't2', groupId: 'g1', parentId: 't1' }),
      taskRow({ id: 't3', groupId: 'g2' }),
    ])
    await deleteTasksByGroupId('g1')
    expect((await listAllTaskRows()).map((r) => r.id)).toEqual(['t3'])
  })
})

import { beforeEach, describe, it, expect } from 'vitest'
import { DB_NAME, __resetForTests } from '~/lib/db'
import { listAllTaskRows, putTaskRowBatch } from './repository'
import { createTasksStore, type TasksStore } from './store'
import type { Task, TaskRow } from './types'

import { todayIso } from '~/lib/date'

// Lazy, LOCAL-zone `today` matches what `todayIso()` produces inside the
// implementation. `toISOString().slice(0,10)` would diverge near the
// UTC/local midnight boundary.
const today = (): string => todayIso()

const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

const row = (overrides: Partial<TaskRow>): TaskRow => ({
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

let store: TasksStore

beforeEach(async () => {
  await __resetForTests()
  await wipe()
  store = createTasksStore()
})

describe('initial state', () => {
  it('starts empty with loaded=false', () => {
    expect(store.state.byGroup).toEqual({})
    expect(store.state.loaded).toBe(false)
    expect(store.tasksFor('g')).toEqual([])
  })
})

describe('load / hydrateFromRows', () => {
  it('builds per-group trees from a flat row set and sets loaded=true', async () => {
    await putTaskRowBatch([
      row({ id: 't1', groupId: 'g1', order: 0 }),
      row({ id: 't2', groupId: 'g1', parentId: 't1', order: 0 }),
      row({ id: 't3', groupId: 'g2', order: 0 }),
    ])
    await store.load()
    expect(store.state.loaded).toBe(true)
    expect(store.tasksFor('g1').map((t) => t.id)).toEqual(['t1'])
    expect(store.tasksFor('g1')[0]?.tasks.map((t) => t.id)).toEqual(['t2'])
    expect(store.tasksFor('g2').map((t) => t.id)).toEqual(['t3'])
  })
})

describe('loadGroup', () => {
  it('loads tasks for a single group without touching others', async () => {
    await putTaskRowBatch([
      row({ id: 't1', groupId: 'g1' }),
      row({ id: 't2', groupId: 'g2' }),
    ])
    await store.loadGroup('g1')
    expect(store.tasksFor('g1').map((t) => t.id)).toEqual(['t1'])
    expect(store.tasksFor('g2')).toEqual([])
  })
})

describe('add (root)', () => {
  it('appends a root task with the next order index and persists', async () => {
    const a = await store.add('g', 'Alpha')
    const b = await store.add('g', 'Beta')
    expect(a?.order).toBe(0)
    expect(b?.order).toBe(1)
    expect(store.tasksFor('g').map((t) => t.name)).toEqual(['Alpha', 'Beta'])
    const persisted = await listAllTaskRows()
    expect(persisted.map((r) => r.name).sort()).toEqual(['Alpha', 'Beta'])
  })

  it('trims whitespace and rejects empty names', async () => {
    expect(await store.add('g', '   ')).toBeNull()
    const a = await store.add('g', '   Trim   ')
    expect(a?.name).toBe('Trim')
  })
})

describe('addSubtask', () => {
  it('appends a subtask under the named parent', async () => {
    const a = await store.add('g', 'A')
    if (!a) throw new Error('add failed')
    const child = await store.addSubtask('g', a.id, 'A1')
    expect(child).not.toBeNull()
    expect(store.tasksFor('g')[0]?.tasks.map((t) => t.id)).toEqual([child!.id])
  })

  it('returns null when the parent does not exist', async () => {
    expect(await store.addSubtask('g', 'missing', 'oops')).toBeNull()
  })
})

describe('delete', () => {
  it('removes a task and all its descendants in IDB', async () => {
    const a = await store.add('g', 'A')
    if (!a) throw new Error('add failed')
    const b = await store.addSubtask('g', a.id, 'B')
    if (!b) throw new Error('addSubtask failed')
    await store.addSubtask('g', b.id, 'C')

    await store.delete('g', a.id)
    expect(store.tasksFor('g')).toEqual([])
    expect(await listAllTaskRows()).toEqual([])
  })

  it('is a no-op for an unknown id', async () => {
    const a = await store.add('g', 'A')
    if (!a) throw new Error('add failed')
    await store.delete('g', 'missing')
    expect(store.tasksFor('g').map((t) => t.id)).toEqual([a.id])
  })
})

describe('rename', () => {
  it('updates the name and persists', async () => {
    const a = await store.add('g', 'Old')
    if (!a) throw new Error('add failed')
    await store.rename('g', a.id, '  New  ')
    expect(store.tasksFor('g')[0]?.name).toBe('New')
    expect((await listAllTaskRows())[0]?.name).toBe('New')
  })

  it('ignores empty / whitespace-only names', async () => {
    const a = await store.add('g', 'Keep')
    if (!a) throw new Error('add failed')
    await store.rename('g', a.id, '   ')
    expect(store.tasksFor('g')[0]?.name).toBe('Keep')
  })
})

describe('toggleCompletion', () => {
  it('marks a task complete and cascades down to its subtree', async () => {
    const a = await store.add('g', 'A')
    if (!a) throw new Error('add failed')
    const b = await store.addSubtask('g', a.id, 'B')
    if (!b) throw new Error('addSubtask failed')

    await store.toggleCompletion('g', a.id)

    expect(store.tasksFor('g')[0]?.completedDate).toBe(today())
    expect(store.tasksFor('g')[0]?.tasks[0]?.completedDate).toBe(today())
  })

  it('does NOT propagate upward (down-only cascade)', async () => {
    const a = await store.add('g', 'A')
    if (!a) throw new Error('add failed')
    const b = await store.addSubtask('g', a.id, 'B')
    if (!b) throw new Error('addSubtask failed')

    await store.toggleCompletion('g', b.id)

    expect(store.tasksFor('g')[0]?.completedDate).toBeNull()
    expect(store.tasksFor('g')[0]?.tasks[0]?.completedDate).toBe(today())
  })
})

describe('toggleOpen', () => {
  it('flips isOpen on the named task only', async () => {
    const a = await store.add('g', 'A')
    if (!a) throw new Error('add failed')
    await store.toggleOpen('g', a.id, false)
    expect(store.tasksFor('g')[0]?.isOpen).toBe(false)
  })
})

describe('setAlarm', () => {
  it('attaches an alarm and persists', async () => {
    const a = await store.add('g', 'A')
    if (!a) throw new Error('add failed')
    await store.setAlarm('g', a.id, {
      firesAt: '2026-05-24T10:00:00Z',
      soundId: null,
      enabled: true,
      repeat: 'none',
    })
    expect(store.tasksFor('g')[0]?.alarm?.firesAt).toBe('2026-05-24T10:00:00Z')
    expect(store.tasksWithAlarm().map((x) => x.task.id)).toEqual([a.id])
  })

  it('clears the alarm when passed null', async () => {
    const a = await store.add('g', 'A')
    if (!a) throw new Error('add failed')
    await store.setAlarm('g', a.id, {
      firesAt: '2026-05-24T10:00:00Z',
      soundId: null,
      enabled: true,
      repeat: 'none',
    })
    await store.setAlarm('g', a.id, null)
    expect(store.tasksFor('g')[0]?.alarm).toBeNull()
  })
})

describe('updateTimerSets', () => {
  it('replaces timer sets and persists', async () => {
    const a = await store.add('g', 'A')
    if (!a) throw new Error('add failed')
    await store.updateTimerSets('g', a.id, [
      { id: 's1', name: 'set1', order: 0, autoAdvance: true, soundId: null, timers: [] },
    ])
    expect(store.tasksFor('g')[0]?.timerSets.map((s) => s.id)).toEqual(['s1'])
    expect(store.tasksFor('g')[0]?.activeTimerSetId).toBe('s1')
  })
})

describe('setActiveTimerSetId', () => {
  it('coerces unknown ids to the first available set', async () => {
    const a = await store.add('g', 'A')
    if (!a) throw new Error('add failed')
    await store.updateTimerSets('g', a.id, [
      { id: 's1', name: 'set1', order: 0, autoAdvance: true, soundId: null, timers: [] },
      { id: 's2', name: 'set2', order: 1, autoAdvance: true, soundId: null, timers: [] },
    ])
    await store.setActiveTimerSetId('g', a.id, 'missing')
    expect(store.tasksFor('g')[0]?.activeTimerSetId).toBe('s1')
  })
})

describe('reorder', () => {
  it('reorders root tasks and re-indexes order', async () => {
    const a = await store.add('g', 'A')
    const b = await store.add('g', 'B')
    const c = await store.add('g', 'C')
    if (!a || !b || !c) throw new Error('add failed')
    await store.reorder('g', null, 0, 2)
    expect(store.tasksFor('g').map((t) => t.id)).toEqual([b.id, c.id, a.id])
    expect(store.tasksFor('g').map((t) => t.order)).toEqual([0, 1, 2])
  })

  it('reorders subtasks under a named parent', async () => {
    const a = await store.add('g', 'A')
    if (!a) throw new Error('add failed')
    const a1 = await store.addSubtask('g', a.id, 'A1')
    const a2 = await store.addSubtask('g', a.id, 'A2')
    if (!a1 || !a2) throw new Error('addSubtask failed')

    await store.reorder('g', a.id, 1, 0)
    expect(store.tasksFor('g')[0]?.tasks.map((t) => t.id)).toEqual([a2.id, a1.id])
  })
})

describe('findTask', () => {
  it('returns the task and its groupId, across groups', async () => {
    const a = await store.add('g1', 'A')
    const b = await store.add('g2', 'B')
    if (!a || !b) throw new Error('add failed')
    expect(store.findTask(a.id)?.groupId).toBe('g1')
    expect(store.findTask(b.id)?.groupId).toBe('g2')
    expect(store.findTask('missing')).toBeNull()
  })
})

describe('importTree', () => {
  const node = (id: string, name: string, order: number, children: Task[] = []): Task => ({
    id,
    name,
    order,
    hiddenUntil: null,
    completedDate: null,
    isOpen: true,
    alarm: null,
    timerSets: [],
    activeTimerSetId: null,
    tasks: children,
  })

  it('installs the tree in state and persists every node flattened', async () => {
    const tree: Task[] = [
      node('a', 'A', 0, [node('a1', 'A1', 0), node('a2', 'A2', 1)]),
      node('b', 'B', 1),
    ]
    await store.importTree('g', tree)

    expect(store.tasksFor('g').map((t) => t.id)).toEqual(['a', 'b'])
    expect(store.tasksFor('g')[0]?.tasks.map((t) => t.id)).toEqual(['a1', 'a2'])

    const persisted = await listAllTaskRows()
    expect(persisted).toHaveLength(4)
    const a1 = persisted.find((r) => r.id === 'a1')
    expect(a1?.parentId).toBe('a')
    expect(a1?.groupId).toBe('g')
  })

  it('handles an empty tree (group with no tasks)', async () => {
    await store.importTree('g', [])
    expect(store.tasksFor('g')).toEqual([])
    expect(await listAllTaskRows()).toEqual([])
  })
})

describe('clearForGroup', () => {
  it('removes a group entirely from byGroup', async () => {
    await store.add('g1', 'A')
    await store.add('g2', 'B')
    store.clearForGroup('g1')
    expect(store.tasksFor('g1')).toEqual([])
    expect(store.tasksFor('g2').length).toBe(1)
  })

  it('is a no-op for an unknown group id', async () => {
    await store.add('g1', 'A')
    store.clearForGroup('missing')
    expect(store.tasksFor('g1').length).toBe(1)
  })
})

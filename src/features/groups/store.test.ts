import { beforeEach, describe, it, expect } from 'vitest'
import { DB_NAME, __resetForTests, getDb, STORES } from '~/lib/db'
import { listGroups, putGroup } from './repository'
import { createGroupsStore, type GroupsStore } from './store'
import type { GroupRow } from './types'

const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

const row = (overrides: Partial<GroupRow>): GroupRow => ({
  id: 'g',
  name: 'G',
  order: 0,
  isOpen: true,
  isHidden: false,
  ...overrides,
})

let store: GroupsStore

beforeEach(async () => {
  await __resetForTests()
  await wipe()
  store = createGroupsStore()
})

describe('createGroupsStore — initial state', () => {
  it('starts with no groups and loaded=false', () => {
    expect(store.state.groups).toEqual([])
    expect(store.state.loaded).toBe(false)
  })

  it('hasGroups, visibleGroups, hiddenCount agree on empty state', () => {
    expect(store.hasGroups()).toBe(false)
    expect(store.visibleGroups()).toEqual([])
    expect(store.hiddenCount()).toBe(0)
  })
})

describe('load', () => {
  it('reads from the repository and sets loaded=true', async () => {
    await putGroup(row({ id: 'a', name: 'A', order: 1 }))
    await putGroup(row({ id: 'b', name: 'B', order: 0 }))
    await store.load()
    expect(store.state.loaded).toBe(true)
    expect(store.state.groups.map((g) => g.id)).toEqual(['b', 'a'])
  })
})

describe('setAll', () => {
  it('replaces the in-memory list and coerces missing isHidden to false', () => {
    store.setAll([
      { id: 'a', name: 'A', order: 0, isOpen: true } as unknown as GroupRow,
    ])
    expect(store.state.groups[0]?.isHidden).toBe(false)
    expect(store.state.loaded).toBe(true)
  })
})

describe('create', () => {
  it('appends a new group with the next order index and persists it', async () => {
    const a = await store.create('Alpha')
    const b = await store.create('Beta')
    expect(a?.order).toBe(0)
    expect(b?.order).toBe(1)
    expect(store.state.groups.map((g) => g.name)).toEqual(['Alpha', 'Beta'])
    expect((await listGroups()).map((g) => g.name)).toEqual(['Alpha', 'Beta'])
  })

  it('trims whitespace from the name', async () => {
    const g = await store.create('   Trimmed   ')
    expect(g?.name).toBe('Trimmed')
  })

  it('returns null and does nothing for an empty/whitespace-only name', async () => {
    expect(await store.create('   ')).toBeNull()
    expect(store.state.groups).toEqual([])
  })
})

describe('importGroup', () => {
  it('appends a pre-built group, stamps the next order, and persists it', async () => {
    await store.create('Alpha')
    await store.importGroup({
      id: 'imported',
      name: 'Imported',
      order: 99, // deliberately wrong; store should overwrite to the next index
      isOpen: true,
      isHidden: false,
    })
    expect(store.state.groups.map((g) => g.name)).toEqual(['Alpha', 'Imported'])
    expect(store.state.groups[1]?.order).toBe(1)
    const persisted = await listGroups()
    expect(persisted.map((g) => g.name)).toEqual(['Alpha', 'Imported'])
    expect(persisted[1]?.order).toBe(1)
  })
})

describe('delete', () => {
  it('removes the group, re-indexes remaining, and cascades to its tasks', async () => {
    const a = await store.create('A')
    const b = await store.create('B')
    const c = await store.create('C')
    if (!a || !b || !c) throw new Error('create failed')

    // Seed a task for b so cascade is testable.
    const db = await getDb()
    await db.put(STORES.tasks, {
      id: 't-b',
      groupId: b.id,
      parentId: null,
      name: 't',
      order: 0,
      hiddenUntil: null,
      completedDate: null,
      isOpen: true,
      alarm: null,
      timerSets: [],
      activeTimerSetId: null,
    })

    await store.delete(b.id)

    expect(store.state.groups.map((g) => g.id)).toEqual([a.id, c.id])
    expect(store.state.groups.map((g) => g.order)).toEqual([0, 1])

    const taskRows = await (await getDb()).getAll(STORES.tasks)
    expect(taskRows).toHaveLength(0)
  })
})

describe('rename', () => {
  it('updates the name and persists', async () => {
    const a = await store.create('A')
    if (!a) throw new Error('create failed')
    await store.rename(a.id, '  Renamed  ')
    expect(store.state.groups[0]?.name).toBe('Renamed')
    expect((await listGroups())[0]?.name).toBe('Renamed')
  })

  it('ignores empty / whitespace-only names', async () => {
    const a = await store.create('Original')
    if (!a) throw new Error('create failed')
    await store.rename(a.id, '   ')
    expect(store.state.groups[0]?.name).toBe('Original')
  })
})

describe('toggleOpen', () => {
  it('flips isOpen and persists', async () => {
    const a = await store.create('A')
    if (!a) throw new Error('create failed')
    await store.toggleOpen(a.id, false)
    expect(store.state.groups[0]?.isOpen).toBe(false)
    expect((await listGroups())[0]?.isOpen).toBe(false)
  })
})

describe('setHidden', () => {
  it('sets isHidden and persists', async () => {
    const a = await store.create('A')
    if (!a) throw new Error('create failed')
    await store.setHidden(a.id, true)
    expect(store.state.groups[0]?.isHidden).toBe(true)
    expect(store.visibleGroups()).toEqual([])
    expect(store.hiddenCount()).toBe(1)
  })
})

describe('setVisibility', () => {
  it('marks groups not in the set as hidden and persists changes', async () => {
    const a = await store.create('A')
    const b = await store.create('B')
    const c = await store.create('C')
    if (!a || !b || !c) throw new Error('create failed')

    await store.setVisibility(new Set([a.id]))

    expect(store.state.groups.find((g) => g.id === a.id)?.isHidden).toBe(false)
    expect(store.state.groups.find((g) => g.id === b.id)?.isHidden).toBe(true)
    expect(store.state.groups.find((g) => g.id === c.id)?.isHidden).toBe(true)
    expect(store.hiddenCount()).toBe(2)
  })

  it('is a no-op when no group changes hidden state', async () => {
    const a = await store.create('A')
    if (!a) throw new Error('create failed')
    await store.setVisibility(new Set([a.id]))
    expect(store.state.groups.find((g) => g.id === a.id)?.isHidden).toBe(false)
  })
})

describe('reorder', () => {
  it('moves a group and re-indexes order on every row', async () => {
    const a = await store.create('A')
    const b = await store.create('B')
    const c = await store.create('C')
    if (!a || !b || !c) throw new Error('create failed')

    await store.reorder(2, 0) // move C to the front
    expect(store.state.groups.map((g) => g.id)).toEqual([c.id, a.id, b.id])
    expect(store.state.groups.map((g) => g.order)).toEqual([0, 1, 2])

    const persisted = await listGroups()
    expect(persisted.map((g) => g.id)).toEqual([c.id, a.id, b.id])
  })

  it('is a no-op when from === to', async () => {
    const a = await store.create('A')
    const b = await store.create('B')
    if (!a || !b) throw new Error('create failed')
    await store.reorder(0, 0)
    expect(store.state.groups.map((g) => g.id)).toEqual([a.id, b.id])
    expect(store.state.groups.map((g) => g.order)).toEqual([0, 1])
  })
})

describe('reorderVisible', () => {
  it('maps visible indices to absolute indices and reorders', async () => {
    const a = await store.create('A')
    const b = await store.create('B')
    const c = await store.create('C')
    if (!a || !b || !c) throw new Error('create failed')

    // Hide B so visible indices are [A=0, C=1].
    await store.setHidden(b.id, true)
    await store.reorderVisible(0, 1) // move A after C in the visible space

    expect(store.visibleGroups().map((g) => g.id)).toEqual([c.id, a.id])
  })
})

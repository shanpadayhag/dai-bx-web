import { describe, it, expect } from 'vitest'
import { buildGroupAndTree, countTasks } from './build'
import type { Task } from '~/features/tasks/types'
import type { ImportedGroup } from './types'

const collectIds = (tree: Task[]): string[] => {
  const ids: string[] = []
  for (const t of tree) {
    ids.push(t.id)
    ids.push(...collectIds(t.tasks))
  }
  return ids
}

const sample: ImportedGroup = {
  name: 'Errands',
  tasks: [
    { name: 'Buy groceries', tasks: [{ name: 'Milk', tasks: [] }, { name: 'Eggs', tasks: [] }] },
    { name: 'Call the bank', tasks: [] },
  ],
}

describe('buildGroupAndTree', () => {
  it('builds a group with defaults and a generated id', () => {
    const { group } = buildGroupAndTree(sample)
    expect(group.name).toBe('Errands')
    expect(group.isOpen).toBe(true)
    expect(group.isHidden).toBe(false)
    expect(group.id).toBeTruthy()
  })

  it('applies runtime defaults to every task', () => {
    const { tree } = buildGroupAndTree(sample)
    const first = tree[0]!
    expect(first.hiddenUntil).toBeNull()
    expect(first.completedDate).toBeNull()
    expect(first.isOpen).toBe(true)
    expect(first.alarm).toBeNull()
    expect(first.timerSets).toEqual([])
    expect(first.activeTimerSetId).toBeNull()
  })

  it('assigns sibling-relative order at each level', () => {
    const { tree } = buildGroupAndTree(sample)
    expect(tree.map((t) => t.order)).toEqual([0, 1])
    expect(tree[0]!.tasks.map((t) => t.order)).toEqual([0, 1])
  })

  it('generates a unique id for every node', () => {
    const { tree } = buildGroupAndTree(sample)
    const ids = collectIds(tree)
    expect(ids).toHaveLength(4)
    expect(new Set(ids).size).toBe(4)
  })

  it('preserves nesting and names to arbitrary depth', () => {
    const deep: ImportedGroup = {
      name: 'G',
      tasks: [{ name: 'a', tasks: [{ name: 'b', tasks: [{ name: 'c', tasks: [] }] }] }],
    }
    const { tree } = buildGroupAndTree(deep)
    expect(tree[0]!.name).toBe('a')
    expect(tree[0]!.tasks[0]!.name).toBe('b')
    expect(tree[0]!.tasks[0]!.tasks[0]!.name).toBe('c')
  })

  it('handles an empty task list', () => {
    const { tree } = buildGroupAndTree({ name: 'G', tasks: [] })
    expect(tree).toEqual([])
  })
})

describe('countTasks', () => {
  it('counts every node including descendants', () => {
    const { tree } = buildGroupAndTree(sample)
    expect(countTasks(tree)).toBe(4)
  })

  it('returns 0 for an empty tree', () => {
    expect(countTasks([])).toBe(0)
  })
})

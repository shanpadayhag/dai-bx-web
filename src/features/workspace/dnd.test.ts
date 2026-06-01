import { describe, it, expect } from 'vitest'
import {
  GROUPS_LIST_KEY,
  isItemDragData,
  rootTasksListKey,
  subtasksListKey,
  type ItemDragData,
} from './dnd'

describe('list keys', () => {
  it('namespaces each sibling list distinctly', () => {
    expect(GROUPS_LIST_KEY).toBe('groups')
    expect(rootTasksListKey('g1')).toBe('tasks:g1')
    expect(subtasksListKey('g1', 'p1')).toBe('tasks:g1:p1')
  })

  it('keeps root and subtask lists of the same group separate', () => {
    expect(rootTasksListKey('g1')).not.toBe(subtasksListKey('g1', 'p1'))
  })
})

describe('isItemDragData', () => {
  it('accepts a well-formed item payload', () => {
    const data: ItemDragData = {
      kind: 'item',
      itemKind: 'task',
      listKey: rootTasksListKey('g1'),
      groupId: 'g1',
      parentId: null,
    }
    expect(isItemDragData(data)).toBe(true)
  })

  it('rejects non-item or malformed payloads', () => {
    expect(isItemDragData(null)).toBe(false)
    expect(isItemDragData({})).toBe(false)
    expect(isItemDragData({ kind: 'gap', listKey: 'groups' })).toBe(false)
    expect(isItemDragData({ kind: 'item' })).toBe(false)
    expect(isItemDragData({ kind: 'item', listKey: 42 })).toBe(false)
  })
})

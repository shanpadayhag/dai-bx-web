/**
 * Groups feature store factory. Ported from
 *   client-web-old/src/app/features/groups/data-access/groups.state.ts
 *
 * Each call returns a fresh store; `WorkspaceContextProvider` instantiates
 * one and shares it via context (wired in T9). Actions mutate in-memory
 * state synchronously, then await repository writes; callers can ignore the
 * returned promise for optimistic UX.
 *
 * Note on setState shape:
 *   - For per-element field updates we use the path-with-predicate form
 *     `setState('groups', g => g.id === id, 'field', value)`. The functional
 *     `setState('groups', groups => groups.map(...))` form does not reliably
 *     surface element-level changes here.
 *   - For full-array replacement (reorder, delete) we pass the new array
 *     directly.
 */

import { createStore } from 'solid-js/store'
import { uid } from '~/lib/ids'
import * as repo from './repository'
import type { Group } from './types'

export interface GroupsState {
  groups: Group[]
  loaded: boolean
}

export interface GroupsStore {
  state: GroupsState
  hasGroups: () => boolean
  visibleGroups: () => Group[]
  hiddenCount: () => number
  load: () => Promise<void>
  setAll: (groups: Group[]) => void
  create: (name: string) => Promise<Group | null>
  delete: (groupId: string) => Promise<void>
  rename: (groupId: string, name: string) => Promise<void>
  toggleOpen: (groupId: string, isOpen: boolean) => Promise<void>
  setHidden: (groupId: string, isHidden: boolean) => Promise<void>
  setVisibility: (visibleIds: ReadonlySet<string>) => Promise<void>
  reorder: (fromIndex: number, toIndex: number) => Promise<void>
  reorderVisible: (fromVisibleIndex: number, toVisibleIndex: number) => Promise<void>
}

const moveInArray = <T>(arr: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) {
    return arr
  }
  const next = arr.slice()
  const [item] = next.splice(from, 1)
  if (item === undefined) return arr
  next.splice(to, 0, item)
  return next
}

const reindexOrder = <T extends { order: number }>(items: T[]): T[] =>
  items.map((item, i) => ({ ...item, order: i }))

export function createGroupsStore(): GroupsStore {
  const [state, setState] = createStore<GroupsState>({ groups: [], loaded: false })

  const hasGroups = (): boolean => state.groups.length > 0
  const visibleGroups = (): Group[] => state.groups.filter((g) => !g.isHidden)
  const hiddenCount = (): number =>
    state.groups.reduce((n, g) => n + (g.isHidden ? 1 : 0), 0)

  const findById = (groupId: string): Group | undefined =>
    state.groups.find((g) => g.id === groupId)

  const load = async (): Promise<void> => {
    const groups = await repo.listGroups()
    setState({ groups, loaded: true })
  }

  const setAll = (groups: Group[]): void => {
    setState({
      groups: groups.map((g) => ({ ...g, isHidden: g.isHidden === true })),
      loaded: true,
    })
  }

  const create = async (name: string): Promise<Group | null> => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const newGroup: Group = {
      id: uid(),
      name: trimmed,
      order: state.groups.length,
      isOpen: true,
      isHidden: false,
    }
    setState('groups', [...state.groups, newGroup])
    await repo.putGroup(newGroup)
    return newGroup
  }

  const del = async (groupId: string): Promise<void> => {
    const reordered = reindexOrder(state.groups.filter((g) => g.id !== groupId))
    setState('groups', reordered)
    await repo.deleteGroupAndTasks(groupId)
    if (reordered.length > 0) await repo.putGroupBatch(reordered)
  }

  const rename = async (groupId: string, name: string): Promise<void> => {
    const trimmed = name.trim()
    if (!trimmed) return
    setState('groups', (g) => g.id === groupId, 'name', trimmed)
    const updated = findById(groupId)
    if (updated) await repo.putGroup({ ...updated })
  }

  const toggleOpen = async (groupId: string, isOpen: boolean): Promise<void> => {
    setState('groups', (g) => g.id === groupId, 'isOpen', isOpen)
    const updated = findById(groupId)
    if (updated) await repo.putGroup({ ...updated })
  }

  const setHidden = async (groupId: string, isHidden: boolean): Promise<void> => {
    setState('groups', (g) => g.id === groupId, 'isHidden', isHidden)
    const updated = findById(groupId)
    if (updated) await repo.putGroup({ ...updated })
  }

  const setVisibility = async (
    visibleIds: ReadonlySet<string>,
  ): Promise<void> => {
    const changed: Group[] = []
    for (const g of state.groups) {
      const shouldBeHidden = !visibleIds.has(g.id)
      if (g.isHidden !== shouldBeHidden) {
        changed.push({ ...g, isHidden: shouldBeHidden })
      }
    }
    if (changed.length === 0) return
    for (const c of changed) {
      setState('groups', (g) => g.id === c.id, 'isHidden', c.isHidden)
    }
    await repo.putGroupBatch(changed)
  }

  const reorder = async (fromIndex: number, toIndex: number): Promise<void> => {
    const moved = moveInArray(state.groups, fromIndex, toIndex)
    if (moved === state.groups) return // genuine no-op (out-of-range or from===to)
    const reordered = reindexOrder(moved)
    setState('groups', reordered)
    await repo.putGroupBatch(reordered)
  }

  const reorderVisible = async (
    fromVisibleIndex: number,
    toVisibleIndex: number,
  ): Promise<void> => {
    if (fromVisibleIndex === toVisibleIndex) return
    const groups = state.groups
    const visibleIndices: number[] = []
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i]
      if (g && !g.isHidden) visibleIndices.push(i)
    }
    const fromAbs = visibleIndices[fromVisibleIndex]
    const toAbs = visibleIndices[toVisibleIndex]
    if (fromAbs === undefined || toAbs === undefined) return
    await reorder(fromAbs, toAbs)
  }

  return {
    state,
    hasGroups,
    visibleGroups,
    hiddenCount,
    load,
    setAll,
    create,
    delete: del,
    rename,
    toggleOpen,
    setHidden,
    setVisibility,
    reorder,
    reorderVisible,
  }
}

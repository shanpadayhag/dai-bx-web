/**
 * Tasks feature store factory. Ported from
 *   client-web-old/src/app/features/tasks/data-access/tasks.state.ts
 *
 * State shape: `{ byGroup: Record<groupId, Task[]>; loaded: boolean }`.
 *
 * Mutations use `produce` from `solid-js/store` so the store updates in
 * place — only the touched fields get new identity, every other `Task`
 * object reference stays stable. This matters because `GroupItem.tsx` uses
 * `<For each={visibleTasks()}>` which keys by identity; without this,
 * every field write would rebuild every `Task` and remount every
 * `TaskItem` — slamming open modals shut, dropping focus, and producing
 * O(n) work per keystroke. See memory `dai-bx-task-store-identity-churn`
 * for the history.
 *
 * `tree.ts` still owns the read-only walks (`findTaskInTree`,
 * `collectSubtreeIds`, `getSiblingsOf`, `flattenTasks`, `toTaskRow`,
 * `buildTreeFromRows`) plus tree construction during load. Its pure
 * immutable mutators are unused by this store now but kept exported for
 * the unit-tested tree-manipulation primitives they are.
 */

import { createStore, produce, unwrap } from 'solid-js/store'
import { uid } from '~/lib/ids'
import { todayIso } from '~/lib/date'
import type { AlarmSpec } from '~/features/alarms/types'
import type { TimerSet } from '~/features/timers/types'
import * as repo from './repository'
import {
  buildTreeFromRows,
  collectSubtreeIds,
  findTaskInTree,
  flattenTasks,
  getSiblingsOf,
  toTaskRow,
} from './tree'
import type { Task, TaskRow } from './types'

export interface TasksState {
  byGroup: Record<string, Task[]>
  loaded: boolean
}

export interface TaskWithGroup {
  task: Task
  groupId: string
}

export interface TasksStore {
  state: TasksState
  tasksFor: (groupId: string) => Task[]
  findTask: (taskId: string) => TaskWithGroup | null
  tasksWithAlarm: () => TaskWithGroup[]
  tasksWithTimers: () => TaskWithGroup[]
  load: () => Promise<void>
  loadGroup: (groupId: string) => Promise<void>
  hydrateFromRows: (rows: TaskRow[]) => void
  clearForGroup: (groupId: string) => void
  add: (groupId: string, name: string) => Promise<Task | null>
  addSubtask: (
    groupId: string,
    parentTaskId: string,
    name: string,
  ) => Promise<Task | null>
  delete: (groupId: string, taskId: string) => Promise<void>
  rename: (groupId: string, taskId: string, name: string) => Promise<void>
  toggleCompletion: (groupId: string, taskId: string) => Promise<void>
  toggleOpen: (groupId: string, taskId: string, isOpen: boolean) => Promise<void>
  setAlarm: (groupId: string, taskId: string, alarm: AlarmSpec | null) => Promise<void>
  updateTimerSets: (
    groupId: string,
    taskId: string,
    timerSets: TimerSet[],
  ) => Promise<void>
  setActiveTimerSetId: (
    groupId: string,
    taskId: string,
    activeTimerSetId: string | null,
  ) => Promise<void>
  reorder: (
    groupId: string,
    parentTaskId: string | null,
    fromIndex: number,
    toIndex: number,
  ) => Promise<void>
}

const nextOrder = (siblings: readonly { order: number }[]): number => {
  let max = -1
  for (const s of siblings) if (s.order > max) max = s.order
  return max + 1
}

const groupTreesFromRows = (rows: TaskRow[]): Record<string, Task[]> => {
  const byGroup: Record<string, TaskRow[]> = {}
  for (const row of rows) {
    const arr = byGroup[row.groupId]
    if (arr) arr.push(row)
    else byGroup[row.groupId] = [row]
  }
  const trees: Record<string, Task[]> = {}
  for (const gid of Object.keys(byGroup)) {
    const groupRows = byGroup[gid]
    if (groupRows) trees[gid] = buildTreeFromRows(groupRows)
  }
  return trees
}

/**
 * Walks `tasks` and its nested `tasks` arrays, invoking `fn` on the matching
 * task. Returns true on first match so callers can short-circuit. Designed
 * to be called inside a `produce` callback — mutations on the yielded task
 * go through Solid's store proxy and only touch the changed fields.
 */
const mutateMatchingTask = (
  tasks: Task[],
  taskId: string,
  fn: (task: Task) => void,
): boolean => {
  for (const t of tasks) {
    if (t.id === taskId) {
      fn(t)
      return true
    }
    if (mutateMatchingTask(t.tasks, taskId, fn)) return true
  }
  return false
}

/** Mutable in-place removal of a subtree by id; returns true if removed. */
const removeSubtree = (tasks: Task[], taskId: string): boolean => {
  const idx = tasks.findIndex((t) => t.id === taskId)
  if (idx >= 0) {
    tasks.splice(idx, 1)
    return true
  }
  for (const t of tasks) {
    if (removeSubtree(t.tasks, taskId)) return true
  }
  return false
}

const sanitizeActiveTimerSetId = (
  sets: readonly TimerSet[],
  activeId: string | null,
): string | null => {
  if (activeId && sets.some((s) => s.id === activeId)) return activeId
  return sets[0]?.id ?? null
}

export function createTasksStore(): TasksStore {
  const [state, setState] = createStore<TasksState>({ byGroup: {}, loaded: false })

  const tasksFor = (groupId: string): Task[] => state.byGroup[groupId] ?? []

  const ensureGroupArray = (groupId: string): void => {
    if (!Array.isArray(state.byGroup[groupId])) {
      setState('byGroup', groupId, [])
    }
  }

  const findTask = (taskId: string): TaskWithGroup | null => {
    for (const gid of Object.keys(state.byGroup)) {
      const tree = state.byGroup[gid]
      if (!tree) continue
      const found = findTaskInTree(tree, taskId)
      if (found) return { task: found.task, groupId: gid }
    }
    return null
  }

  const tasksWithAlarm = (): TaskWithGroup[] => {
    const out: TaskWithGroup[] = []
    const walk = (nodes: Task[], groupId: string): void => {
      for (const t of nodes) {
        if (t.alarm) out.push({ task: t, groupId })
        if (t.tasks.length) walk(t.tasks, groupId)
      }
    }
    for (const gid of Object.keys(state.byGroup)) {
      const tree = state.byGroup[gid]
      if (tree) walk(tree, gid)
    }
    return out
  }

  const tasksWithTimers = (): TaskWithGroup[] => {
    const out: TaskWithGroup[] = []
    const walk = (nodes: Task[], groupId: string): void => {
      for (const t of nodes) {
        if (t.timerSets.length > 0) out.push({ task: t, groupId })
        if (t.tasks.length) walk(t.tasks, groupId)
      }
    }
    for (const gid of Object.keys(state.byGroup)) {
      const tree = state.byGroup[gid]
      if (tree) walk(tree, gid)
    }
    return out
  }

  const hydrateFromRows = (rows: TaskRow[]): void => {
    setState('byGroup', groupTreesFromRows(rows))
  }

  const load = async (): Promise<void> => {
    const rows = await repo.listAllTaskRows()
    hydrateFromRows(rows)
    setState('loaded', true)
  }

  const loadGroup = async (groupId: string): Promise<void> => {
    const rows = await repo.listTaskRowsByGroup(groupId)
    setState('byGroup', groupId, buildTreeFromRows(rows))
  }

  const clearForGroup = (groupId: string): void => {
    if (!(groupId in state.byGroup)) return
    setState(
      'byGroup',
      produce((byGroup) => {
        delete byGroup[groupId]
      }),
    )
  }

  const add = async (groupId: string, name: string): Promise<Task | null> => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const newTask: Task = {
      id: uid(),
      name: trimmed,
      order: nextOrder(tasksFor(groupId)),
      hiddenUntil: null,
      completedDate: null,
      isOpen: true,
      alarm: null,
      timerSets: [],
      activeTimerSetId: null,
      tasks: [],
    }
    ensureGroupArray(groupId)
    setState(
      'byGroup',
      groupId,
      produce((tree: Task[]) => {
        tree.push(newTask)
      }),
    )
    await repo.putTaskRow(toTaskRow(newTask, groupId, null))
    return newTask
  }

  const addSubtask = async (
    groupId: string,
    parentTaskId: string,
    name: string,
  ): Promise<Task | null> => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const parent = findTaskInTree(tasksFor(groupId), parentTaskId)
    if (!parent) return null
    const newTask: Task = {
      id: uid(),
      name: trimmed,
      order: nextOrder(parent.task.tasks),
      hiddenUntil: null,
      completedDate: null,
      isOpen: true,
      alarm: null,
      timerSets: [],
      activeTimerSetId: null,
      tasks: [],
    }
    setState(
      'byGroup',
      groupId,
      produce((tree: Task[]) => {
        mutateMatchingTask(tree, parentTaskId, (t) => {
          t.tasks.push(newTask)
        })
      }),
    )
    await repo.putTaskRow(toTaskRow(newTask, groupId, parentTaskId))
    return newTask
  }

  const del = async (groupId: string, taskId: string): Promise<void> => {
    const tree = tasksFor(groupId)
    const found = findTaskInTree(tree, taskId)
    if (!found) return
    const idsToDelete = collectSubtreeIds(found.task)
    setState(
      'byGroup',
      groupId,
      produce((arr: Task[]) => {
        removeSubtree(arr, taskId)
      }),
    )
    await repo.deleteTaskRows(idsToDelete)
  }

  /**
   * Reads through `unwrap` before handing to `toTaskRow` — without it, fields
   * like `timerSets` and `tasks` come out as Solid store proxies, which IDB's
   * `structuredClone` rejects. The repo's try/catch then silently swallows
   * the error, leaving the persisted row stale even though in-memory state
   * is correct. Use this every time we cross the store→IDB boundary.
   */
  const persist = async (task: Task, groupId: string, parentId: string | null): Promise<void> => {
    await repo.putTaskRow(toTaskRow(unwrap(task), groupId, parentId))
  }

  const persistSubtree = async (
    task: Task,
    groupId: string,
    parentId: string | null,
  ): Promise<void> => {
    await repo.putTaskRowBatch(flattenTasks([unwrap(task)], groupId, parentId))
  }

  const rename = async (
    groupId: string,
    taskId: string,
    name: string,
  ): Promise<void> => {
    const trimmed = name.trim()
    if (!trimmed) return
    setState(
      'byGroup',
      groupId,
      produce((tree: Task[]) => {
        mutateMatchingTask(tree, taskId, (t) => {
          t.name = trimmed
        })
      }),
    )
    const found = findTaskInTree(tasksFor(groupId), taskId)
    if (found) await persist(found.task, groupId, found.parentId)
  }

  const toggleCompletion = async (groupId: string, taskId: string): Promise<void> => {
    setState(
      'byGroup',
      groupId,
      produce((tree: Task[]) => {
        mutateMatchingTask(tree, taskId, (t) => {
          const today = todayIso()
          const newCompletedDate = t.completedDate === today ? null : today
          t.completedDate = newCompletedDate
          // Cascade to every descendant.
          const cascade = (nodes: Task[]): void => {
            for (const child of nodes) {
              child.completedDate = newCompletedDate
              cascade(child.tasks)
            }
          }
          cascade(t.tasks)
        })
      }),
    )
    const found = findTaskInTree(tasksFor(groupId), taskId)
    if (!found) return
    await persistSubtree(found.task, groupId, found.parentId)
  }

  const toggleOpen = async (
    groupId: string,
    taskId: string,
    isOpen: boolean,
  ): Promise<void> => {
    setState(
      'byGroup',
      groupId,
      produce((tree: Task[]) => {
        mutateMatchingTask(tree, taskId, (t) => {
          t.isOpen = isOpen
        })
      }),
    )
    const found = findTaskInTree(tasksFor(groupId), taskId)
    if (found) await persist(found.task, groupId, found.parentId)
  }

  const setAlarm = async (
    groupId: string,
    taskId: string,
    alarm: AlarmSpec | null,
  ): Promise<void> => {
    setState(
      'byGroup',
      groupId,
      produce((tree: Task[]) => {
        mutateMatchingTask(tree, taskId, (t) => {
          t.alarm = alarm
        })
      }),
    )
    const found = findTaskInTree(tasksFor(groupId), taskId)
    if (found) await persist(found.task, groupId, found.parentId)
  }

  const updateTimerSets = async (
    groupId: string,
    taskId: string,
    timerSets: TimerSet[],
  ): Promise<void> => {
    setState(
      'byGroup',
      groupId,
      produce((tree: Task[]) => {
        mutateMatchingTask(tree, taskId, (t) => {
          t.timerSets = timerSets
          t.activeTimerSetId = sanitizeActiveTimerSetId(timerSets, t.activeTimerSetId)
        })
      }),
    )
    const found = findTaskInTree(tasksFor(groupId), taskId)
    if (found) await persist(found.task, groupId, found.parentId)
  }

  const setActiveTimerSetId = async (
    groupId: string,
    taskId: string,
    activeTimerSetId: string | null,
  ): Promise<void> => {
    setState(
      'byGroup',
      groupId,
      produce((tree: Task[]) => {
        mutateMatchingTask(tree, taskId, (t) => {
          t.activeTimerSetId = sanitizeActiveTimerSetId(t.timerSets, activeTimerSetId)
        })
      }),
    )
    const found = findTaskInTree(tasksFor(groupId), taskId)
    if (found) await persist(found.task, groupId, found.parentId)
  }

  const reorder = async (
    groupId: string,
    parentTaskId: string | null,
    fromIndex: number,
    toIndex: number,
  ): Promise<void> => {
    setState(
      'byGroup',
      groupId,
      produce((tree: Task[]) => {
        const reorderInArray = (arr: Task[]): void => {
          if (
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= arr.length ||
            toIndex >= arr.length
          ) {
            return
          }
          const [item] = arr.splice(fromIndex, 1)
          if (!item) return
          arr.splice(toIndex, 0, item)
          for (let i = 0; i < arr.length; i++) {
            const t = arr[i]
            if (t) t.order = i
          }
        }
        if (parentTaskId === null) {
          reorderInArray(tree)
          return
        }
        mutateMatchingTask(tree, parentTaskId, (parent) => {
          reorderInArray(parent.tasks)
        })
      }),
    )
    const next = tasksFor(groupId)
    const siblings = getSiblingsOf(next, parentTaskId)
    await repo.putTaskRowBatch(
      siblings.map((t) => toTaskRow(unwrap(t), groupId, parentTaskId)),
    )
  }

  return {
    state,
    tasksFor,
    findTask,
    tasksWithAlarm,
    tasksWithTimers,
    load,
    loadGroup,
    hydrateFromRows,
    clearForGroup,
    add,
    addSubtask,
    delete: del,
    rename,
    toggleCompletion,
    toggleOpen,
    setAlarm,
    updateTimerSets,
    setActiveTimerSetId,
    reorder,
  }
}

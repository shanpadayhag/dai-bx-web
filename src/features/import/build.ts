/**
 * Pure builder: turns a validated `ImportedGroup` into the domain `Group` plus
 * a `Task[]` tree. Generates ids, assigns sibling-relative `order`, and applies
 * every runtime default (no alarms/timers/completion — names and structure
 * only). `group.order` is a placeholder; the groups store finalises it on
 * insert so it owns the append position.
 */

import { uid } from '~/lib/ids'
import type { Group } from '~/features/groups/types'
import type { Task } from '~/features/tasks/types'
import type { ImportedGroup, ImportedTask } from './types'

const buildTask = (imported: ImportedTask, order: number): Task => ({
  id: uid(),
  name: imported.name,
  order,
  hiddenUntil: null,
  completedDate: null,
  isOpen: true,
  alarm: null,
  timerSets: [],
  activeTimerSetId: null,
  tasks: imported.tasks.map((child, index) => buildTask(child, index)),
})

export const buildGroupAndTree = (
  imported: ImportedGroup,
): { group: Group; tree: Task[] } => {
  const group: Group = {
    id: uid(),
    name: imported.name,
    order: 0,
    isOpen: true,
    isHidden: false,
  }
  const tree = imported.tasks.map((child, index) => buildTask(child, index))
  return { group, tree }
}

/** Counts every node in a task tree (tasks + all descendants). */
export const countTasks = (tree: Task[]): number => {
  let count = 0
  for (const t of tree) count += 1 + countTasks(t.tasks)
  return count
}

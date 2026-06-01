import {
  type Accessor,
  type JSX,
  createContext,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from 'solid-js'
import { getDb } from '~/lib/db'
import { createGroupsStore, type GroupsStore } from '~/features/groups/store'
import { createTasksStore, type TasksStore } from '~/features/tasks/store'
import { createSoundsStore, type SoundsStore } from '~/features/sounds/store'
import {
  createAlarmsScheduler,
  type AlarmsScheduler,
} from '~/features/alarms/scheduler'
import {
  createTimersRunner,
  type TimersRunner,
} from '~/features/timers/runner'
import { parseGroupJson } from '~/features/import/parse'
import { buildGroupAndTree, countTasks } from '~/features/import/build'
import type { ImportResult } from '~/features/import/types'

/**
 * Workspace-wide context. Instantiates the feature stores at app boot and
 * eagerly loads them in parallel. `dbReady` flips true after IDB is open
 * and every store has populated.
 *
 * The alarms scheduler and timers runner are constructed alongside the
 * stores so they see state changes as they stream in, and are disposed when
 * the provider unmounts.
 */

export interface WorkspaceContextValue {
  dbReady: Accessor<boolean>
  dbError: Accessor<unknown | null>
  groups: GroupsStore
  tasks: TasksStore
  sounds: SoundsStore
  alarmsScheduler: AlarmsScheduler
  timersRunner: TimersRunner
  /**
   * ID of the task whose `TimerEditor` modal is currently open, or `null`.
   * Lifted out of `TaskItem` so the modal survives the cascade of `TaskItem`
   * remounts that `tasks.updateTimerSets` / `setActiveTimerSetId` trigger —
   * those store calls rebuild every `Task` reference, and the default `<For>`
   * keys by identity, so any state local to `TaskItem` would be lost.
   */
  pickingTimerTaskId: Accessor<string | null>
  openTimerPicker: (taskId: string) => void
  closeTimerPicker: () => void
  /**
   * Imports one group (name + nested task tree) from raw JSON text. Parses and
   * validates first; only on success does it persist the tasks then the group,
   * so a malformed file creates nothing (atomicity at the validation boundary).
   */
  importGroup: (text: string) => Promise<ImportResult>
}

export const WorkspaceContext = createContext<WorkspaceContextValue>()

interface ProviderProps {
  children: JSX.Element
}

export function WorkspaceContextProvider(props: ProviderProps): JSX.Element {
  const [dbReady, setDbReady] = createSignal(false)
  const [dbError, setDbError] = createSignal<unknown | null>(null)
  const groups = createGroupsStore()
  const tasks = createTasksStore()
  const sounds = createSoundsStore()
  const alarmsScheduler = createAlarmsScheduler({ tasks, sounds })
  const timersRunner = createTimersRunner({ tasks, sounds })
  const [pickingTimerTaskId, setPickingTimerTaskId] = createSignal<string | null>(null)
  const openTimerPicker = (taskId: string): void => {
    setPickingTimerTaskId(taskId)
  }
  const closeTimerPicker = (): void => {
    setPickingTimerTaskId(null)
  }

  const importGroup = async (text: string): Promise<ImportResult> => {
    const parsed = parseGroupJson(text)
    if (!parsed.ok) return { ok: false, error: parsed.error }
    const { group, tree } = buildGroupAndTree(parsed.group)
    // Tasks first, then the group: the group becoming visible is the signal the
    // import is done, so its tasks should already be in place.
    await tasks.importTree(group.id, tree)
    await groups.importGroup(group)
    return { ok: true, groupName: group.name, taskCount: countTasks(tree) }
  }

  onCleanup(() => {
    alarmsScheduler.dispose()
    timersRunner.dispose()
  })

  onMount(() => {
    void (async () => {
      try {
        await getDb()
        await Promise.all([groups.load(), tasks.load(), sounds.load()])
        setDbReady(true)
      } catch (err) {
        setDbError(err)
      }
    })()
  })

  return (
    <WorkspaceContext.Provider
      value={{
        dbReady,
        dbError,
        groups,
        tasks,
        sounds,
        alarmsScheduler,
        timersRunner,
        pickingTimerTaskId,
        openTimerPicker,
        closeTimerPicker,
        importGroup,
      }}
    >
      {props.children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceContextProvider')
  return ctx
}

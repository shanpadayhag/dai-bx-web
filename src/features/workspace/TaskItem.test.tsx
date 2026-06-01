import { render, screen } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect } from 'vitest'
import { DragDropProvider, SortableProvider } from '@thisbeyond/solid-dnd'
import { Route, Router } from '@solidjs/router'
import {
  WorkspaceContext,
  type WorkspaceContextValue,
} from '~/state/workspaceContext'
import { createGroupsStore } from '~/features/groups/store'
import { createTasksStore, type TasksStore } from '~/features/tasks/store'
import { createSoundsStore } from '~/features/sounds/store'
import { DB_NAME, __resetForTests } from '~/lib/db'
import type { Task } from '~/features/tasks/types'
import TaskItem from './TaskItem'

const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

let tasks: TasksStore

beforeEach(async () => {
  await __resetForTests()
  await wipe()
  tasks = createTasksStore()
})

const ctxFor = (tasksStore: TasksStore): WorkspaceContextValue => ({
  dbReady: () => true,
  dbError: () => null,
  groups: createGroupsStore(),
  tasks: tasksStore,
  sounds: createSoundsStore(),
  alarmsScheduler: {
    firing: () => null,
    nextAlarm: () => null,
    dismiss: () => {},
    dispose: () => {},
  },
  timersRunner: {
    runs: () => ({}),
    runningRuns: () => [],
    attentionRuns: () => [],
    focusedRun: () => null,
    runForTask: () => null,
    remainingSecondsFor: () => null,
    currentStepFor: () => null,
    start: () => {},
    advance: () => {},
    cancel: () => {},
    dismiss: () => {},
    silence: () => {},
    isRinging: () => false,
    focusNext: () => {},
    focusPrev: () => {},
    dispose: () => {},
  },
  pickingTimerTaskId: () => null,
  openTimerPicker: () => {},
  closeTimerPicker: () => {},
  importGroup: async () => ({ ok: false as const, error: 'stub' }),
})

const renderItem = (task: Task, groupId: string, parentId: string | null = null) =>
  render(() => (
    <Router>
      <Route
        path="*"
        component={() => (
          <WorkspaceContext.Provider value={ctxFor(tasks)}>
            <DragDropProvider>
              <SortableProvider ids={[task.id]}>
                <TaskItem task={task} groupId={groupId} parentId={parentId} />
              </SortableProvider>
            </DragDropProvider>
          </WorkspaceContext.Provider>
        )}
      />
    </Router>
  ))

import { todayIso } from '~/lib/date'

// Lazy, LOCAL-zone `today` matches what `todayIso()` produces inside the
// implementation. `toISOString().slice(0,10)` would diverge near the
// UTC/local midnight boundary.
const today = (): string => todayIso()

describe('TaskItem', () => {
  it('renders the task name and an aria-labelled completion button', async () => {
    const t = await tasks.add('g', 'Write report')
    if (!t) throw new Error('add failed')
    renderItem(tasks.tasksFor('g')[0]!, 'g')
    expect(screen.getByText('Write report')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /mark write report complete/i }),
    ).toBeInTheDocument()
  })

  it('does not render when hidden until a future date', () => {
    const future: Task = {
      id: 'future',
      name: 'Future',
      order: 0,
      hiddenUntil: '9999-12-31',
      completedDate: null,
      isOpen: true,
      alarm: null,
      timerSets: [],
      activeTimerSetId: null,
      tasks: [],
    }
    renderItem(future, 'g')
    expect(screen.queryByText('Future')).not.toBeInTheDocument()
  })

  it('clicking the completion circle toggles completion and cascades', async () => {
    const a = await tasks.add('g', 'A')
    if (!a) throw new Error('add failed')
    const b = await tasks.addSubtask('g', a.id, 'B')
    if (!b) throw new Error('addSubtask failed')
    const user = userEvent.setup()

    renderItem(tasks.tasksFor('g')[0]!, 'g')
    await user.click(screen.getByRole('button', { name: /mark a complete/i }))

    expect(tasks.tasksFor('g')[0]?.completedDate).toBe(today())
    expect(tasks.tasksFor('g')[0]?.tasks[0]?.completedDate).toBe(today())
  })

  it('shows the chevron only when the task has subtasks', async () => {
    const a = await tasks.add('g', 'A')
    if (!a) throw new Error('add failed')
    const { unmount } = renderItem(tasks.tasksFor('g')[0]!, 'g')
    expect(screen.queryByRole('button', { name: /collapse|expand subtasks/i })).not.toBeInTheDocument()
    unmount()

    await tasks.addSubtask('g', a.id, 'child')
    renderItem(tasks.tasksFor('g')[0]!, 'g')
    expect(screen.getByRole('button', { name: /collapse subtasks/i })).toBeInTheDocument()
  })

  it('clicking the + opens a subtask input that adds a subtask on submit', async () => {
    const a = await tasks.add('g', 'Parent')
    if (!a) throw new Error('add failed')
    const user = userEvent.setup()

    renderItem(tasks.tasksFor('g')[0]!, 'g')
    await user.click(screen.getByRole('button', { name: /^add subtask$/i }))

    const input = await screen.findByLabelText(/subtask name/i)
    await user.type(input, 'A child{Enter}')

    expect(tasks.tasksFor('g')[0]?.tasks.map((t) => t.name)).toEqual(['A child'])
  })

  it('Escape cancels the subtask form', async () => {
    const a = await tasks.add('g', 'Parent')
    if (!a) throw new Error('add failed')
    const user = userEvent.setup()

    renderItem(tasks.tasksFor('g')[0]!, 'g')
    await user.click(screen.getByRole('button', { name: /^add subtask$/i }))
    expect(screen.getByLabelText(/subtask name/i)).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByLabelText(/subtask name/i)).not.toBeInTheDocument()
  })

  it('clicking delete removes the task (and subtree)', async () => {
    const a = await tasks.add('g', 'Doomed')
    if (!a) throw new Error('add failed')
    await tasks.addSubtask('g', a.id, 'Child')
    const user = userEvent.setup()

    renderItem(tasks.tasksFor('g')[0]!, 'g')
    await user.click(screen.getByRole('button', { name: /delete doomed/i }))

    expect(tasks.tasksFor('g')).toEqual([])
  })
})

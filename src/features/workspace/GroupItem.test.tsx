import { render, screen } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect } from 'vitest'
import { DragDropProvider, SortableProvider } from '@thisbeyond/solid-dnd'
import {
  WorkspaceContext,
  type WorkspaceContextValue,
} from '~/state/workspaceContext'
import {
  createGroupsStore,
  type GroupsStore,
} from '~/features/groups/store'
import { createTasksStore } from '~/features/tasks/store'
import { createSoundsStore } from '~/features/sounds/store'
import { DB_NAME, __resetForTests } from '~/lib/db'
import type { Group } from '~/features/groups/types'
import GroupItem from './GroupItem'

const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

let store: GroupsStore

beforeEach(async () => {
  await __resetForTests()
  await wipe()
  store = createGroupsStore()
})

const ctxFor = (groups: GroupsStore): WorkspaceContextValue => ({
  dbReady: () => true,
  dbError: () => null,
  groups,
  tasks: createTasksStore(),
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
})

const renderItem = (group: Group) =>
  render(() => (
    <WorkspaceContext.Provider value={ctxFor(store)}>
      <DragDropProvider>
        <SortableProvider ids={[group.id]}>
          <GroupItem group={group} />
        </SortableProvider>
      </DragDropProvider>
    </WorkspaceContext.Provider>
  ))

describe('GroupItem', () => {
  it('renders the group name and a decorative (aria-hidden) drag handle', async () => {
    const a = await store.create('Alpha')
    if (!a) throw new Error('create failed')
    const current = store.state.groups.find((g) => g.id === a.id)!
    const { container } = renderItem(current)
    expect(screen.getByRole('heading', { level: 2, name: 'Alpha' })).toBeInTheDocument()
    // The handle stays in the DOM (mouse/touch users drag it) but is hidden
    // from the accessibility tree — drag-and-drop is mouse-only, so
    // advertising it to screen readers would offer an unreachable action.
    const handle = container.querySelector('[aria-hidden="true"].cursor-grab')
    expect(handle).not.toBeNull()
  })

  it('toggles isOpen when the folder button is clicked', async () => {
    const a = await store.create('Alpha')
    if (!a) throw new Error('create failed')
    const user = userEvent.setup()
    renderItem(store.state.groups[0]!)
    await user.click(screen.getByRole('button', { name: /collapse group/i }))
    expect(store.state.groups.find((g) => g.id === a.id)?.isOpen).toBe(false)
  })

  it('double-clicking the name enters rename mode, blur saves the trimmed name', async () => {
    const a = await store.create('Alpha')
    if (!a) throw new Error('create failed')
    const user = userEvent.setup()
    renderItem(store.state.groups[0]!)

    await user.dblClick(screen.getByRole('heading', { name: 'Alpha' }))
    const input = await screen.findByRole('textbox', { name: /rename group/i })
    await user.clear(input)
    await user.type(input, '  Renamed  ')
    input.blur()

    expect(store.state.groups.find((g) => g.id === a.id)?.name).toBe('Renamed')
  })

  it('Escape cancels rename without persisting', async () => {
    const a = await store.create('Alpha')
    if (!a) throw new Error('create failed')
    const user = userEvent.setup()
    renderItem(store.state.groups[0]!)

    await user.dblClick(screen.getByRole('heading', { name: 'Alpha' }))
    const input = await screen.findByRole('textbox', { name: /rename group/i })
    await user.clear(input)
    await user.type(input, 'Discarded')
    await user.keyboard('{Escape}')

    expect(store.state.groups.find((g) => g.id === a.id)?.name).toBe('Alpha')
  })

  it('clicking the delete button removes the group', async () => {
    const a = await store.create('Alpha')
    if (!a) throw new Error('create failed')
    const user = userEvent.setup()
    renderItem(store.state.groups[0]!)
    await user.click(screen.getByRole('button', { name: /delete group/i }))
    expect(store.state.groups.find((g) => g.id === a.id)).toBeUndefined()
  })
})

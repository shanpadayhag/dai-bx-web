/**
 * Coverage focus: the "incomplete version" enforcement contract documented in
 * the project memory `timer-version-must-edit-before-close`. A newly added
 * version starts with zero steps; while any version has zero steps, every
 * close affordance (Done, Esc, backdrop, "Manage sounds" link) is
 * hard-blocked. The user must click "Add step" or delete the version.
 *
 * The block predicate is data-derived (`timers.length === 0`) rather than a
 * transient signal so it survives `TaskItem` remounts in production.
 */

import { createSignal } from 'solid-js'
import { MemoryRouter, Route } from '@solidjs/router'
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { WorkspaceContextProvider } from '~/state/workspaceContext'
import { DB_NAME, __resetForTests } from '~/lib/db'
import TimerEditor from './TimerEditor'
import type { TimerSet } from './types'

const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

interface HarnessHandle {
  getSets: () => TimerSet[]
  getActiveId: () => string | null
  onCloseCalls: () => number
}

interface HarnessProps {
  initialSets?: TimerSet[]
  initialActiveId?: string | null
  onMount?: (handle: HarnessHandle) => void
  onClose?: () => void
}

/**
 * Drives `TimerEditor` exactly the way the real parent does: owns the
 * `timerSets` / `activeTimerSetId` source of truth and surfaces a handle so
 * tests can read the resulting state without scraping the DOM.
 */
function Harness(props: HarnessProps) {
  const [sets, setSets] = createSignal<TimerSet[]>(props.initialSets ?? [])
  const [activeId, setActiveId] = createSignal<string | null>(
    props.initialActiveId ?? props.initialSets?.[0]?.id ?? null,
  )
  let closeCalls = 0
  props.onMount?.({
    getSets: () => sets(),
    getActiveId: () => activeId(),
    onCloseCalls: () => closeCalls,
  })
  return (
    <TimerEditor
      show={true}
      groupId="g1"
      taskId="t1"
      timerSets={sets()}
      activeTimerSetId={activeId()}
      onTimerSetsChange={(next) => setSets(next)}
      onActiveTimerSetIdChange={(next) => setActiveId(next)}
      onClose={() => {
        closeCalls += 1
        props.onClose?.()
      }}
    />
  )
}

const renderEditor = async (props: HarnessProps = {}) => {
  const result = render(() => (
    <MemoryRouter>
      <Route
        path="/"
        component={() => (
          <WorkspaceContextProvider>
            <Harness {...props} />
          </WorkspaceContextProvider>
        )}
      />
    </MemoryRouter>
  ))
  // The dialog opens via createEffect (calls showModal in a microtask). Wait
  // for the `open` attribute so testing-library's a11y tree sees the children.
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toHaveAttribute('open')
  })
  return result
}

const committedSet = (id: string, name = 'Saved'): TimerSet => ({
  id,
  name,
  order: 0,
  autoAdvance: true,
  soundId: null,
  timers: [{ id: `${id}-step`, durationMinutes: 25, order: 0 }],
})

beforeEach(async () => {
  await __resetForTests()
  await wipe()
})

describe('TimerEditor — incomplete-version enforcement', () => {
  it('creates a new version with zero steps and blocks Done', async () => {
    const user = userEvent.setup()
    let handle!: HarnessHandle
    await renderEditor({ onMount: (h) => { handle = h } })

    await user.click(screen.getByRole('button', { name: /add timer version/i }))

    expect(handle.getSets()).toHaveLength(1)
    expect(handle.getSets()[0]!.timers).toHaveLength(0)
    expect(screen.getByRole('button', { name: /^done$/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^start$/i })).toBeDisabled()
    expect(screen.getByText(/add a step to save/i)).toBeInTheDocument()
  })

  it('clicking "Add step" unblocks Done and Start', async () => {
    const user = userEvent.setup()
    await renderEditor()
    await user.click(screen.getByRole('button', { name: /add timer version/i }))

    await user.click(screen.getByRole('button', { name: /^add step$/i }))

    expect(screen.getByRole('button', { name: /^done$/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /^start$/i })).toBeEnabled()
    expect(screen.queryByText(/add a step to save/i)).not.toBeInTheDocument()
  })

  it('deleting the incomplete version clears the block', async () => {
    const user = userEvent.setup()
    await renderEditor({ initialSets: [committedSet('s0')] })

    await user.click(screen.getByRole('button', { name: /^add timer version$/i }))
    expect(screen.getByRole('button', { name: /^done$/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /delete this version/i }))

    expect(screen.getByRole('button', { name: /^done$/i })).toBeEnabled()
    expect(screen.queryByText(/add a step to save/i)).not.toBeInTheDocument()
  })

  it('blocks Escape (cancel event) while a version is incomplete', async () => {
    const user = userEvent.setup()
    let handle!: HarnessHandle
    await renderEditor({ onMount: (h) => { handle = h } })

    await user.click(screen.getByRole('button', { name: /add timer version/i }))

    const dialog = screen.getByRole('dialog')
    const cancelEvent = new Event('cancel', { bubbles: false, cancelable: true })
    const dispatched = dialog.dispatchEvent(cancelEvent)

    expect(dispatched).toBe(false) // preventDefault was called
    expect(handle.onCloseCalls()).toBe(0)
  })

  it('shifts focus to the "Add step" button when Escape is blocked', async () => {
    const user = userEvent.setup()
    await renderEditor()

    await user.click(screen.getByRole('button', { name: /add timer version/i }))

    const dialog = screen.getByRole('dialog')
    dialog.dispatchEvent(new Event('cancel', { bubbles: false, cancelable: true }))

    // queueMicrotask gives Solid one tick to focus.
    await new Promise<void>((r) => queueMicrotask(() => r()))

    const addStep = screen.getByRole('button', { name: /^add step$/i })
    expect(document.activeElement).toBe(addStep)
  })

  it('blocks backdrop click while a version is incomplete', async () => {
    const user = userEvent.setup()
    let handle!: HarnessHandle
    await renderEditor({ onMount: (h) => { handle = h } })

    await user.click(screen.getByRole('button', { name: /add timer version/i }))

    const dialog = screen.getByRole('dialog')
    fireEvent.click(dialog) // target === dialog === the backdrop

    expect(handle.onCloseCalls()).toBe(0)
  })

  it('hides the "Manage sounds" link while a version is incomplete', async () => {
    const user = userEvent.setup()
    await renderEditor()
    await user.click(screen.getByRole('button', { name: /add timer version/i }))

    expect(screen.queryByRole('link', { name: /manage sounds/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^add step$/i }))

    expect(screen.getByRole('link', { name: /manage sounds/i })).toBeInTheDocument()
  })

  it('does not block existing committed versions loaded from storage', async () => {
    let handle!: HarnessHandle
    await renderEditor({
      initialSets: [committedSet('s1', 'Pomodoro')],
      onMount: (h) => { handle = h },
    })

    expect(screen.getByRole('button', { name: /^done$/i })).toBeEnabled()
    expect(screen.queryByText(/add a step to save/i)).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^done$/i }))
    expect(handle.onCloseCalls()).toBe(1)
  })

  it('keeps the block on a freshly added version even when a committed version exists', async () => {
    const user = userEvent.setup()
    let handle!: HarnessHandle
    await renderEditor({
      initialSets: [committedSet('s1', 'Pomodoro')],
      onMount: (h) => { handle = h },
    })

    expect(screen.getByRole('button', { name: /^done$/i })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: /^add timer version$/i }))

    // The new version is active and incomplete — close paths are all blocked.
    expect(screen.getByRole('button', { name: /^done$/i })).toBeDisabled()
    expect(handle.getSets()).toHaveLength(2)

    fireEvent.click(screen.getByRole('dialog'))
    expect(handle.onCloseCalls()).toBe(0)
  })

  it('marks the incomplete chip so multi-version users can find the orphan', async () => {
    const user = userEvent.setup()
    await renderEditor({ initialSets: [committedSet('s1', 'Pomodoro')] })

    await user.click(screen.getByRole('button', { name: /^add timer version$/i }))

    const tabs = screen.getAllByRole('tab')
    const incompleteTab = tabs.find((t) => t.hasAttribute('data-incomplete'))
    expect(incompleteTab).toBeDefined()
    expect(incompleteTab?.getAttribute('aria-describedby')).toBe('timer-incomplete-hint')
  })

  it('removes the incomplete flag the moment a step is added (last step deletion path)', async () => {
    const user = userEvent.setup()
    await renderEditor()
    await user.click(screen.getByRole('button', { name: /add timer version/i }))
    await user.click(screen.getByRole('button', { name: /^add step$/i }))

    // Now delete the only step — the version drops back to incomplete and
    // close is blocked again.
    await user.click(screen.getByRole('button', { name: /remove step 1/i }))

    expect(screen.getByRole('button', { name: /^done$/i })).toBeDisabled()
    expect(screen.getByText(/add a step to save/i)).toBeInTheDocument()
  })
})

import { render, screen } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import {
  WorkspaceContext,
  type WorkspaceContextValue,
} from '~/state/workspaceContext'
import { createGroupsStore } from '~/features/groups/store'
import { createTasksStore } from '~/features/tasks/store'
import { createSoundsStore } from '~/features/sounds/store'
import type { AlarmsScheduler } from '~/features/alarms/scheduler'
import type { TimersRunner } from '~/features/timers/runner'
import WorkspaceHeader from './WorkspaceHeader'

const stubScheduler: AlarmsScheduler = {
  firing: () => null,
  nextAlarm: () => null,
  dismiss: () => {},
  dispose: () => {},
}

const stubTimersRunner: TimersRunner = {
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
}

const makeCtx = (): WorkspaceContextValue => ({
  dbReady: () => true,
  dbError: () => null,
  groups: createGroupsStore(),
  tasks: createTasksStore(),
  sounds: createSoundsStore(),
  alarmsScheduler: stubScheduler,
  timersRunner: stubTimersRunner,
  pickingTimerTaskId: () => null,
  openTimerPicker: () => {},
  closeTimerPicker: () => {},
  importGroup: async () => ({ ok: false as const, error: 'stub' }),
})

const renderWithCtx = (
  ctx: WorkspaceContextValue,
  ui: () => ReturnType<typeof WorkspaceHeader>,
) =>
  render(() => (
    <WorkspaceContext.Provider value={ctx}>{ui()}</WorkspaceContext.Provider>
  ))

describe('WorkspaceHeader', () => {
  it('renders the Today eyebrow and a date heading', () => {
    renderWithCtx(makeCtx(), () => <WorkspaceHeader onManage={() => {}} />)
    expect(screen.getByText(/^today$/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('hides the summary line and the manage button when there are no groups', () => {
    renderWithCtx(makeCtx(), () => <WorkspaceHeader onManage={() => {}} />)
    expect(screen.queryByText(/groups\b/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /manage visible groups/i })).not.toBeInTheDocument()
  })

  it('shows the summary line and the manage button once groups exist', () => {
    const ctx = makeCtx()
    // setAll seeds groups AND flips loaded=true; create() alone does not flip loaded.
    ctx.groups.setAll([
      { id: 'g1', name: 'Alpha', order: 0, isOpen: true, isHidden: false },
    ])
    renderWithCtx(ctx, () => <WorkspaceHeader onManage={() => {}} />)
    // The summary paragraph is split across text nodes; match by class.
    const summary = document.querySelector('p.readout')
    expect(summary?.textContent ?? '').toMatch(/1\s*group/i)
    expect(summary?.textContent ?? '').toMatch(/0\s*tasks/i)
    expect(screen.getByRole('button', { name: /manage visible groups/i })).toBeInTheDocument()
  })

  it('fires onManage when the manage button is clicked', async () => {
    const ctx = makeCtx()
    await ctx.groups.create('Alpha')
    const onManage = vi.fn()
    const user = userEvent.setup()
    renderWithCtx(ctx, () => <WorkspaceHeader onManage={onManage} />)
    await user.click(screen.getByRole('button', { name: /manage visible groups/i }))
    expect(onManage).toHaveBeenCalledOnce()
  })
})

import { render, screen } from '@solidjs/testing-library'
import { Route, Router } from '@solidjs/router'
import { describe, it, expect } from 'vitest'
import {
  WorkspaceContext,
  type WorkspaceContextValue,
} from '~/state/workspaceContext'
import { createGroupsStore } from '~/features/groups/store'
import { createTasksStore } from '~/features/tasks/store'
import { createSoundsStore } from '~/features/sounds/store'
import type { AlarmsScheduler } from '~/features/alarms/scheduler'
import type { TimersRunner } from '~/features/timers/runner'
import StatusStrip from './StatusStrip'

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

const ctx: WorkspaceContextValue = {
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
}

const renderInRouter = () =>
  render(() => (
    <Router>
      <Route
        path="*"
        component={() => (
          <WorkspaceContext.Provider value={ctx}>
            <StatusStrip />
          </WorkspaceContext.Provider>
        )}
      />
    </Router>
  ))

describe('StatusStrip', () => {
  it('renders the DaiBX brand and home link', () => {
    renderInRouter()
    expect(screen.getByLabelText(/daibx home/i)).toBeInTheDocument()
    expect(screen.getByText('DaiBX')).toBeInTheDocument()
  })

  it('renders the settings link', () => {
    renderInRouter()
    expect(screen.getByLabelText(/^settings$/i)).toBeInTheDocument()
  })

  it('renders an initial clock in HH:MM:SS form with the right aria-label shape', () => {
    renderInRouter()
    const clock = screen.getByLabelText(/^current time \d{2}:\d{2}:\d{2}$/i)
    expect(clock.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })

  it('does not render the next-alarm chip when no alarm is scheduled', () => {
    renderInRouter()
    expect(screen.queryByText(/^next$/i)).not.toBeInTheDocument()
  })
})

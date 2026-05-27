import { render, screen } from '@solidjs/testing-library'
import { describe, it, expect } from 'vitest'
import TimerBadge from './TimerBadge'
import type { TimerSet } from './types'

const set: TimerSet = {
  id: 's',
  name: 'A',
  order: 0,
  autoAdvance: false,
  soundId: null,
  timers: [
    { id: 'a', durationMinutes: 5, order: 0 },
    { id: 'b', durationMinutes: 10, order: 1 },
  ],
}

describe('TimerBadge', () => {
  it('renders the step summary in arrow form', () => {
    render(() => <TimerBadge set={set} active={false} />)
    expect(screen.getByText(/5m\s*→\s*10m/)).toBeInTheDocument()
  })

  it('uses primary fill when active', () => {
    const { container } = render(() => <TimerBadge set={set} active={true} />)
    const node = container.querySelector('span')!
    expect(node.className).toContain('bg-primary')
  })

  it('uses neutral fill when inactive', () => {
    const { container } = render(() => <TimerBadge set={set} active={false} />)
    const node = container.querySelector('span')!
    expect(node.className).toContain('bg-secondary-background')
  })
})

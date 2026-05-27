import { render } from '@solidjs/testing-library'
import { describe, it, expect } from 'vitest'
import AlarmBadge from './AlarmBadge'

const inOneHour = (): string => new Date(Date.now() + 60 * 60_000).toISOString()

describe('AlarmBadge', () => {
  it('renders a time label for an enabled alarm', () => {
    render(() => (
      <AlarmBadge
        alarm={{
          firesAt: inOneHour(),
          soundId: null,
          enabled: true,
          repeat: 'none',
        }}
      />
    ))
    // The exact format is locale-dependent; just assert SOMETHING was rendered.
    const span = document.querySelector('span.readout')
    expect(span?.textContent ?? '').toMatch(/\d/)
  })

  it('renders with muted styling when disabled', () => {
    const { container } = render(() => (
      <AlarmBadge
        alarm={{
          firesAt: inOneHour(),
          soundId: null,
          enabled: false,
          repeat: 'none',
        }}
      />
    ))
    const root = container.querySelector('span')!
    expect(root.className).toContain('opacity-60')
    expect(root.className).toContain('text-subtle-foreground')
  })
})
